# -*- coding: utf-8 -*-
"""
Google Colab - Consolidated Hateful Meme Training Pipeline
Runs sequentially:
  1. FHM Hateful Meme Classification (Binary Classifier)
  2. MAMI Misogyny Classification (Multi-Label Classifier)
  3. HarMeme COVID-19 Meme Classification (Binary Classifier)
  4. HatReD Explanation Generation (Seq2Seq Transformer Fine-Tuning)
"""

import os
import urllib.request
import json
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score
import inspect

# Install extra packages in Colab if running manually:
# !pip install sentence-transformers scikit-learn transformers datasets accelerate rouge-score faiss-cpu

try:
    from sentence_transformers import SentenceTransformer
    from transformers import (
        T5Tokenizer, 
        T5ForConditionalGeneration, 
        Seq2SeqTrainingArguments, 
        Seq2SeqTrainer, 
        DataCollatorForSeq2Seq
    )
    from datasets import Dataset as HFDataset
except ImportError:
    print("Please install requirements: pip install sentence-transformers scikit-learn transformers datasets accelerate rouge-score")

# Create datasets folder
os.makedirs("datasets", exist_ok=True)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Download URLs
urls = {
    "fhm": "https://huggingface.co/datasets/neuralcatcher/hateful_memes/resolve/main/train.jsonl",
    "mami": "https://huggingface.co/datasets/arch-raven/MAMI/resolve/main/data.jsonl",
    "hatred": "https://raw.githubusercontent.com/Social-AI-Studio/HatReD/main/datasets/hatred/annotations/fhm_train_reasonings.jsonl",
    "harmeme_dev": "https://raw.githubusercontent.com/panFJCharlotte98/HMC/main/data/HarMeme_V1/data/Harm-C/dev.json",
    "harmeme_test": "https://raw.githubusercontent.com/panFJCharlotte98/HMC/main/data/HarMeme_V1/data/Harm-C/test.json"
}

# --- Shared PyTorch Classification Framework ---
class EmbedDataset(Dataset):
    def __init__(self, embeddings, labels, multi_label=False):
        self.embeddings = torch.tensor(embeddings, dtype=torch.float32)
        self.labels = torch.tensor(labels, dtype=torch.float32 if multi_label else torch.long)
    def __len__(self): return len(self.labels)
    def __getitem__(self, idx): return self.embeddings[idx], self.labels[idx]

class DenseClassifier(nn.Module):
    def __init__(self, input_dim, output_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 256), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(256, 128), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(128, output_dim)
        )
    def forward(self, x): return self.net(x)

def train_eval_classifier(train_loader, val_loader, input_dim, output_dim, epochs=10, is_multilabel=False):
    model = DenseClassifier(input_dim, output_dim).to(device)
    criterion = nn.BCEWithLogitsLoss() if is_multilabel else nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)

    final_acc = 0.0
    final_auc = 0.0

    for epoch in range(epochs):
        model.train()
        train_loss = 0
        for inputs, targets in train_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            optimizer.zero_grad()
            loss = criterion(model(inputs), targets)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        model.eval()
        all_probs, all_targets = [], []
        with torch.no_grad():
            for inputs, targets in val_loader:
                outputs = model(inputs.to(device))
                probs = torch.sigmoid(outputs) if is_multilabel else torch.softmax(outputs, dim=1)
                all_probs.extend(probs.cpu().numpy())
                all_targets.extend(targets.numpy())

        all_probs = np.array(all_probs)
        all_targets = np.array(all_targets)
        if is_multilabel:
            all_preds = (all_probs > 0.5).astype(int)
            acc = accuracy_score(all_targets, all_preds)
            aucs = [roc_auc_score(all_targets[:, i], all_probs[:, i]) for i in range(output_dim)]
            auc = np.mean(aucs)
            val_metric = f"Acc: {acc:.2%} | Mean AUC: {auc:.4f}"
        else:
            all_preds = all_probs.argmax(axis=1)
            acc = accuracy_score(all_targets, all_preds)
            auc = roc_auc_score(all_targets, all_probs[:, 1])
            val_metric = f"Acc: {acc:.2%} | AUC: {auc:.4f}"
        
        final_acc = acc
        final_auc = auc
        print(f"  Epoch {epoch+1:02d} | Loss: {train_loss/len(train_loader):.4f} | Val {val_metric}")
    return model, final_acc, final_auc

# =====================================================================
# PART 1: Facebook Hateful Memes (FHM) Binary Classification
# =====================================================================
print("\n" + "="*50 + "\nPART 1: TRAINING ON FHM (FACEBOOK HATEFUL MEMES)\n" + "="*50)
fhm_path = "datasets/fhm_train.jsonl"
if not os.path.exists(fhm_path): 
    print("Downloading FHM train dataset...")
    urllib.request.urlretrieve(urls["fhm"], fhm_path)
df_fhm = pd.read_json(fhm_path, lines=True)
embed_model = SentenceTransformer('all-MiniLM-L6-v2')

train_fhm, val_fhm = df_fhm.iloc[:7000], df_fhm.iloc[7000:8500]
X_train_fhm = embed_model.encode(train_fhm['text'].tolist(), show_progress_bar=False)
X_val_fhm = embed_model.encode(val_fhm['text'].tolist(), show_progress_bar=False)
fhm_train_loader = DataLoader(EmbedDataset(X_train_fhm, train_fhm['label'].values), batch_size=64, shuffle=True)
fhm_val_loader = DataLoader(EmbedDataset(X_val_fhm, val_fhm['label'].values), batch_size=64, shuffle=False)
model_fhm, fhm_acc, fhm_auc = train_eval_classifier(fhm_train_loader, fhm_val_loader, input_dim=X_train_fhm.shape[1], output_dim=2, epochs=8)

# =====================================================================
# PART 2: MAMI Misogyny Multi-Label Classification
# =====================================================================
print("\n" + "="*50 + "\nPART 2: TRAINING ON MAMI (MISOGYNY DETECTION)\n" + "="*50)
mami_path = "datasets/mami_data.jsonl"
if not os.path.exists(mami_path): 
    print("Downloading MAMI dataset...")
    urllib.request.urlretrieve(urls["mami"], mami_path)
df_mami = pd.read_json(mami_path, lines=True)
labels_cols = ["misogynous", "shaming", "stereotype", "objectification", "violence"]

train_mami, val_mami = df_mami.iloc[:8000], df_mami.iloc[8000:10000]
X_train_mami = embed_model.encode(train_mami['transcription'].tolist(), show_progress_bar=False)
X_val_mami = embed_model.encode(val_mami['transcription'].tolist(), show_progress_bar=False)
y_train_mami = train_mami[labels_cols].values.astype(np.float32)
y_val_mami = val_mami[labels_cols].values.astype(np.float32)

mami_train_loader = DataLoader(EmbedDataset(X_train_mami, y_train_mami, multi_label=True), batch_size=64, shuffle=True)
mami_val_loader = DataLoader(EmbedDataset(X_val_mami, y_val_mami, multi_label=True), batch_size=64, shuffle=False)
model_mami, mami_acc, mami_auc = train_eval_classifier(mami_train_loader, mami_val_loader, input_dim=X_train_mami.shape[1], output_dim=len(labels_cols), epochs=8, is_multilabel=True)

# =====================================================================
# PART 3: HarMeme COVID-19 Hateful Meme Classification
# =====================================================================
print("\n" + "="*50 + "\nPART 3: TRAINING ON HARMEME\n" + "="*50)
harm_dev_path, harm_test_path = "datasets/harm_dev.json", "datasets/harm_test.json"
if not os.path.exists(harm_dev_path): urllib.request.urlretrieve(urls["harmeme_dev"], harm_dev_path)
if not os.path.exists(harm_test_path): urllib.request.urlretrieve(urls["harmeme_test"], harm_test_path)

harm_rows = []
for p in [harm_dev_path, harm_test_path]:
    with open(p, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for item in data:
            harm_rows.append({"text": item['text'], "label": 1 if item['label'] > 0 else 0})

df_harm = pd.DataFrame(harm_rows)
train_harm, val_harm = df_harm.iloc[:400], df_harm.iloc[400:]
X_train_harm = embed_model.encode(train_harm['text'].tolist(), show_progress_bar=False)
X_val_harm = embed_model.encode(val_harm['text'].tolist(), show_progress_bar=False)
harm_train_loader = DataLoader(EmbedDataset(X_train_harm, train_harm['label'].values), batch_size=32, shuffle=True)
harm_val_loader = DataLoader(EmbedDataset(X_val_harm, val_harm['label'].values), batch_size=32, shuffle=False)
model_harm, harm_acc, harm_auc = train_eval_classifier(harm_train_loader, harm_val_loader, input_dim=X_train_harm.shape[1], output_dim=2, epochs=8)

# =====================================================================
# PART 4: HatReD Explanation Generation (T5 Fine-Tuning)
# =====================================================================
print("\n" + "="*50 + "\nPART 4: FINE-TUNING REASONER (HATRED DATASET)\n" + "="*50)
hatred_path = "datasets/fhm_train_reasonings.jsonl"
if not os.path.exists(hatred_path): 
    print("Downloading HatReD reasons annotations...")
    urllib.request.urlretrieve(urls["hatred"], hatred_path)
df_hatred = pd.read_json(hatred_path, lines=True)

# Merge HatReD explanations with original FHM texts
fhm_dict = {row['id']: row for _, row in df_fhm.iterrows()}
records = []
for _, row in df_hatred.iterrows():
    item_id = row['id']
    if item_id in fhm_dict:
        records.append({
            "input_text": f"explain meme: text: {fhm_dict[item_id]['text']} | targets: {row['target'][0] if row['target'] else 'general'}",
            "target_text": row['reasonings'][0] if row['reasonings'] else ""
        })

df_merged = pd.DataFrame(records)
tokenizer = T5Tokenizer.from_pretrained("t5-small")
t5_model = T5ForConditionalGeneration.from_pretrained("t5-small")
train_t5, val_t5 = train_test_split(df_merged, test_size=0.15, random_state=42)
hf_train_ds = HFDataset.from_pandas(train_t5)
hf_val_ds = HFDataset.from_pandas(val_t5)

def preprocess_t5(examples):
    model_inputs = tokenizer(examples["input_text"], max_length=128, truncation=True, padding="max_length")
    labels = tokenizer(text_target=examples["target_text"], max_length=128, truncation=True, padding="max_length")
    labels["input_ids"] = [[(l if l != tokenizer.pad_token_id else -100) for l in label] for label in labels["input_ids"]]
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

print("Preprocessing and tokenizing datasets for T5...")
tokenized_train = hf_train_ds.map(preprocess_t5, batched=True, remove_columns=["input_text", "target_text"])
tokenized_val = hf_val_ds.map(preprocess_t5, batched=True, remove_columns=["input_text", "target_text"])

# Clear GPU memory cache before fine-tuning
torch.cuda.empty_cache()

training_args = Seq2SeqTrainingArguments(
    output_dir="./results_hatred",
    eval_strategy="epoch",               # Compatible with v4.41.0+ and newer transformers
    learning_rate=3e-4,
    per_device_train_batch_size=4,       # Reduced from 16 to 4 to prevent Colab GPU Out-Of-Memory (OOM)
    per_device_eval_batch_size=4,        # Reduced from 16 to 4
    gradient_accumulation_steps=4,       # Accumulate gradients to maintain effective batch size of 16
    weight_decay=0.01,
    num_train_epochs=3,                  # Run 3 epochs for demonstration efficiency
    predict_with_generate=True,
    fp16=torch.cuda.is_available(),
    logging_steps=50,
)

trainer_kwargs = {
    "model": t5_model,
    "args": training_args,
    "train_dataset": tokenized_train,
    "eval_dataset": tokenized_val,
    "data_collator": DataCollatorForSeq2Seq(tokenizer, model=t5_model),
}

# Dynamically pass 'processing_class' on newer transformers versions and 'tokenizer' on older versions
sig = inspect.signature(Seq2SeqTrainer.__init__)
if "processing_class" in sig.parameters:
    trainer_kwargs["processing_class"] = tokenizer
else:
    trainer_kwargs["tokenizer"] = tokenizer

trainer = Seq2SeqTrainer(**trainer_kwargs)
trainer.train()

# Sample Inference
test_prompt = "explain meme: text: look at that chimpanzee eating like a human | targets: minorities"
input_ids = tokenizer(test_prompt, return_tensors="pt").input_ids.to(t5_model.device)
with torch.no_grad():
    outputs = t5_model.generate(input_ids, max_length=128, num_beams=4)
generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

print(f"\nSample Input Prompt: {test_prompt}\nGenerated Explanation: {generated_text}")

# =====================================================================
# FINAL INTEGRATED ACCURACY REPORT
# =====================================================================
print("\n" + "="*60)
print("             FINAL ACCURACY RATES SUMMARY REPORT")
print("="*60)
print(f"1. FHM Dataset Model:      Validation Accuracy = {fhm_acc:.2%}  |  Validation ROC-AUC = {fhm_auc:.4f}")
print(f"2. MAMI Dataset Model:     Validation Mean Acc = {mami_acc:.2%}  |  Validation Mean AUC = {mami_auc:.4f}")
print(f"3. HarMeme Dataset Model:  Validation Accuracy = {harm_acc:.2%}  |  Validation ROC-AUC = {harm_auc:.4f}")
print("="*60)
print("Explanation Generator (T5 fine-tuning on HatReD) executed successfully!")
print("="*60)
