# -*- coding: utf-8 -*-
"""
Google Colab - MLLM API Evaluation Pipeline (GPT-4o & Qwen-VL-Max)
Task: Evaluate GPT-4o and Qwen-VL-Max on Hateful Meme Detection with the proposed framework.
Supports:
  1. Retrieve Socio-Cultural Knowledge (SCK), Relevance Scores (SCRS), and Representative Cases (RC) via FAISS.
  2. Encode meme images to Base64.
  3. Construct Chain-of-Thought (CoT) prompts.
  4. Call MLLM APIs and evaluate classification accuracy.
"""

# --- STEP 0: INSTALL SYSTEM REQUIREMENTS ---
!pip install sentence-transformers scikit-learn transformers datasets accelerate faiss-cpu openai dashscope

import os
import base64
import urllib.request
import json
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

# --- STEP 1: API CONFIGURATION ---
print("--- STEP 1: Configure API Keys ---")
# Prompting user for API keys in Colab
openai_api_key = input("Enter OpenAI API Key (leave blank to skip GPT-4): ").strip()
dashscope_api_key = input("Enter Alibaba DashScope API Key (leave blank to skip Qwen-VL): ").strip()

if openai_api_key:
    os.environ["OPENAI_API_KEY"] = openai_api_key
    from openai import OpenAI
    openai_client = OpenAI()
    print("OpenAI client initialized.")

if dashscope_api_key:
    os.environ["DASHSCOPE_API_KEY"] = dashscope_api_key
    import dashscope
    dashscope.api_key = dashscope_api_key
    print("DashScope client initialized.")

# --- STEP 2: LOAD AND ENCODE DATASETS ---
print("\n--- STEP 2: Loading FHM Dataset & Knowledge Base ---")
os.makedirs("datasets", exist_ok=True)
os.makedirs("images", exist_ok=True)

fhm_url = "https://huggingface.co/datasets/neuralcatcher/hateful_memes/resolve/main/train.jsonl"
hatred_url = "https://raw.githubusercontent.com/Social-AI-Studio/HatReD/main/datasets/hatred/annotations/fhm_train_reasonings.jsonl"

fhm_path = "datasets/fhm_train.jsonl"
hatred_path = "datasets/fhm_train_reasonings.jsonl"

if not os.path.exists(fhm_path):
    print("Downloading FHM train dataset...")
    urllib.request.urlretrieve(fhm_url, fhm_path)
if not os.path.exists(hatred_path):
    print("Downloading HatReD reasons annotations...")
    urllib.request.urlretrieve(hatred_url, hatred_path)

df_fhm = pd.read_json(fhm_path, lines=True)
df_hatred = pd.read_json(hatred_path, lines=True)

# Build Knowledge Base
knowledge_texts = []
for _, row in df_hatred.iterrows():
    if row['reasonings']:
        knowledge_texts.append(row['reasonings'][0])
knowledge_texts = list(set(knowledge_texts))

# Load Embeddings & FAISS Index
embed_model = SentenceTransformer('all-MiniLM-L6-v2')
kb_embeddings = embed_model.encode(knowledge_texts, show_progress_bar=False).astype(np.float32)
faiss.normalize_L2(kb_embeddings)

index = faiss.IndexFlatIP(kb_embeddings.shape[1])
index.add(kb_embeddings)

# --- STEP 3: KNOWLEDGE RETRIEVAL UTILITIES ---
def retrieve_knowledge_features(text):
    text_embedding = embed_model.encode([text], show_progress_bar=False).astype(np.float32)
    faiss.normalize_L2(text_embedding)
    similarities, indices = index.search(text_embedding, k=2)
    
    sck_text = knowledge_texts[indices[0][0]]
    scrs_score = similarities[0][0]
    rc_text = knowledge_texts[indices[0][1]]
    
    return sck_text, scrs_score, rc_text

def encode_image(image_path):
    """Encodes local image to base64 string."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Download a sample of images for evaluation (e.g. first 20 samples to verify pipeline works)
eval_df = df_fhm.iloc[:20].copy()
print(f"\nDownloading {len(eval_df)} sample images for local validation...")
for idx, row in eval_df.iterrows():
    img_name = os.path.basename(row['img'])
    local_img_path = f"images/{img_name}"
    # Hugging Face resolve path for FHM images
    hf_img_url = f"https://huggingface.co/datasets/neuralcatcher/hateful_memes/resolve/main/{row['img']}"
    if not os.path.exists(local_img_path):
        try:
            urllib.request.urlretrieve(hf_img_url, local_img_path)
        except Exception as e:
            print(f"Failed to download image {row['img']}: {e}")

# --- STEP 4: MLLM API PROMPTING AND CALLS ---
def build_prompt(text, sck, scrs, rc):
    return f"""Analyze the provided meme image and accompanying text. Determine whether this meme is Hateful or Safe.

Meme Text overlay: "{text}"

To assist your analysis, the following socio-cultural context has been retrieved:
1. Socio-Cultural Knowledge (SCK): {sck}
2. Relevance Score (SCRS): {scrs:.4f}
3. Representative Case (RC): {rc}

Reason step-by-step using Chain-of-Thought (CoT):
- Analyze visual objects and their interaction with the text.
- Connect this to the retrieved Socio-Cultural Knowledge (SCK) and Representative Case (RC).
- Conclude with a final classification: either "Classification: Hateful" or "Classification: Safe".
"""

def call_gpt4o(image_path, prompt):
    if not openai_api_key:
        return None
    
    base64_image = encode_image(image_path)
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error calling GPT-4o: {e}")
        return None

def call_qwen_vl(image_path, prompt):
    if not dashscope_api_key:
        return None
        
    try:
        # Construct message content for Dashscope Qwen-VL API
        messages = [
            {
                "role": "user",
                "content": [
                    {"image": f"file://{os.path.abspath(image_path)}"},
                    {"text": prompt}
                ]
            }
        ]
        response = dashscope.MultiModalConversation.call(
            model='qwen-vl-max',
            messages=messages
        )
        if response.status_code == 200:
            return response.output.choices[0].message.content[0]['text']
        else:
            print(f"Qwen-VL-Max Error: {response.code} - {response.message}")
            return None
    except Exception as e:
        print(f"Error calling Qwen-VL-Max: {e}")
        return None

# --- STEP 5: EVALUATION LOOP ---
print("\n--- STEP 5: Commencing Evaluation ---")
gpt4_preds = []
qwen_preds = []
targets = []

for idx, row in eval_df.iterrows():
    img_name = os.path.basename(row['img'])
    local_img_path = f"images/{img_name}"
    
    if not os.path.exists(local_img_path):
        continue
        
    text = row['text']
    target_label = row['label'] # 1 = Hateful, 0 = Safe
    targets.append(target_label)
    
    # Retrieve SCK, SCRS, RC features
    sck, scrs, rc = retrieve_knowledge_features(text)
    prompt = build_prompt(text, sck, scrs, rc)
    
    print(f"\nEvaluating Meme ID: {row['id']} | True Label: {'Hateful' if target_label == 1 else 'Safe'}")
    
    # GPT-4o Evaluation
    if openai_api_key:
        print("  Calling GPT-4o...")
        response_text = call_gpt4o(local_img_path, prompt)
        if response_text:
            print(f"    GPT-4o Response: {response_text.strip().replace(chr(10), ' ')}")
            pred = 1 if "Classification: Hateful" in response_text else 0
            gpt4_preds.append(pred)
        else:
            gpt4_preds.append(0)
            
    # Qwen-VL-Max Evaluation
    if dashscope_api_key:
        print("  Calling Qwen-VL-Max...")
        response_text = call_qwen_vl(local_img_path, prompt)
        if response_text:
            print(f"    Qwen-VL Response: {response_text.strip().replace(chr(10), ' ')}")
            pred = 1 if "Classification: Hateful" in response_text else 0
            qwen_preds.append(pred)
        else:
            qwen_preds.append(0)

# --- STEP 6: OUTPUT ACCURACY METRICS ---
print("\n" + "="*50)
print("             EVALUATION PERFORMANCE METRICS")
print("="*50)
if openai_api_key and len(gpt4_preds) == len(targets):
    acc = accuracy_score(targets, gpt4_preds)
    print(f"GPT-4o + Ours:   Accuracy = {acc:.2%}")
if dashscope_api_key and len(qwen_preds) == len(targets):
    acc = accuracy_score(targets, qwen_preds)
    print(f"Qwen-VL + Ours:  Accuracy = {acc:.2%}")
print("="*50)
