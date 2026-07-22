# -*- coding: utf-8 -*-
"""
Google Colab - HatReD Explanation Reasoning Generation Fine-Tuning Pipeline
Task: Fine-Tuning a Seq2Seq Model (T5-Small) to generate socio-cultural rationales
"""

import os
import urllib.request
import pandas as pd
import numpy as np
import torch
from sklearn.model_selection import train_test_split

# Install extra packages in Colab:
# !pip install transformers datasets accelerate rouge-score

try:
    from transformers import (
        T5Tokenizer, 
        T5ForConditionalGeneration, 
        Seq2SeqTrainingArguments, 
        Seq2SeqTrainer, 
        DataCollatorForSeq2Seq
    )
    from datasets import Dataset
except ImportError:
    print("Please install requirements: pip install transformers datasets accelerate rouge-score")

# --- Step 1: Download & Load HatReD & FHM Annotations ---
print("--- Step 1: Loading HatReD and FHM Dataset ---")
os.makedirs("datasets", exist_ok=True)

urls = {
    "fhm": "https://huggingface.co/datasets/neuralcatcher/hateful_memes/resolve/main/train.jsonl",
    "hatred": "https://raw.githubusercontent.com/Social-AI-Studio/HatReD/main/datasets/hatred/annotations/fhm_train_reasonings.jsonl"
}

fhm_path = "datasets/fhm_train.jsonl"
hatred_path = "datasets/fhm_train_reasonings.jsonl"

if not os.path.exists(fhm_path):
    print("Downloading FHM train.jsonl...")
    urllib.request.urlretrieve(urls["fhm"], fhm_path)

if not os.path.exists(hatred_path):
    print("Downloading HatReD annotations...")
    urllib.request.urlretrieve(urls["hatred"], hatred_path)

df_fhm = pd.read_json(fhm_path, lines=True)
df_hatred = pd.read_json(hatred_path, lines=True)

# Merge datasets to link original meme texts with the ground-truth reasonings
fhm_dict = {row['id']: row for _, row in df_fhm.iterrows()}

records = []
for _, row in df_hatred.iterrows():
    item_id = row['id']
    if item_id in fhm_dict:
        meme_text = fhm_dict[item_id]['text']
        # Use first reasoning as target
        reason = row['reasonings'][0] if row['reasonings'] else ""
        target = row['target'][0] if row['target'] else "general"
        
        # Format input prompt
        input_prompt = f"explain meme: text: {meme_text} | targets: {target}"
        records.append({"input_text": input_prompt, "target_text": reason})

df_merged = pd.DataFrame(records)
print(f"Total merged dataset rows: {df_merged.shape[0]}")
print(f"Example Input: {df_merged.iloc[0]['input_text']}")
print(f"Example Target Reason: {df_merged.iloc[0]['target_text']}")

# --- Step 2: Initialize Tokenizer & Model ---
print("\n--- Step 2: Initializing T5-Small Tokenizer and Model ---")
model_name = "t5-small"
tokenizer = T5Tokenizer.from_pretrained(model_name)
model = T5ForConditionalGeneration.from_pretrained(model_name)

# Split dataset
train_df, val_df = train_test_split(df_merged, test_size=0.15, random_state=42)
train_dataset = Dataset.from_pandas(train_df)
val_dataset = Dataset.from_pandas(val_df)

# --- Step 3: Preprocess Datasets ---
def preprocess_function(examples):
    inputs = examples["input_text"]
    targets = examples["target_text"]
    
    # Tokenize input prompts
    model_inputs = tokenizer(inputs, max_length=128, truncation=True, padding="max_length")
    
    # Tokenize target explanations (labels)
    labels = tokenizer(text_target=targets, max_length=128, truncation=True, padding="max_length")
    
    # Replace padding token ids with -100 so they are ignored in cross-entropy loss computation
    labels["input_ids"] = [
        [(l if l != tokenizer.pad_token_id else -100) for l in label] for label in labels["input_ids"]
    ]
    
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

print("Tokenizing datasets...")
tokenized_train = train_dataset.map(preprocess_function, batched=True, remove_columns=["input_text", "target_text"])
tokenized_val = val_dataset.map(preprocess_function, batched=True, remove_columns=["input_text", "target_text"])

# --- Step 4: Configure Training Arguments ---
print("\n--- Step 4: Configuring Training Parameters ---")
training_args = Seq2SeqTrainingArguments(
    output_dir="./results_hatred",
    evaluation_strategy="epoch",
    learning_rate=3e-4,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    weight_decay=0.01,
    save_total_limit=2,
    num_train_epochs=5,
    predict_with_generate=True,
    fp16=torch.cuda.is_available(), # Use mixed precision if GPU is available
    logging_steps=50,
)

data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)

# --- Step 5: Trainer Setup & Training ---
trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_train,
    eval_dataset=tokenized_val,
    tokenizer=tokenizer,
    data_collator=data_collator,
)

print("\n--- Step 5: Commencing T5 Fine-Tuning ---")
trainer.train()

# --- Step 6: Test Inference ---
print("\n--- Step 6: Testing Generated Explanation ---")
model.eval()

test_prompt = "explain meme: text: look at that chimpanzee eating like a human | targets: minorities"
input_ids = tokenizer(test_prompt, return_tensors="pt").input_ids.to(model.device)

with torch.no_grad():
    outputs = model.generate(input_ids, max_length=128, num_beams=4, early_stopping=True)
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

print(f"\nQuery Prompt: {test_prompt}")
print(f"Generated Reason: {generated_text}")

# Save the model
print("\nSaving fine-tuned model checkpoint...")
model.save_pretrained("hatred_t5_reasoner")
tokenizer.save_pretrained("hatred_t5_reasoner")
