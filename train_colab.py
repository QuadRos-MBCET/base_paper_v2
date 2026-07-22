# -*- coding: utf-8 -*-
"""
Google Colab Training Pipeline for Meme Safety Analyzer
Based on Base Paper Architecture: SCGen Search, SCRA-MTI, RCR, and CoT MLLM.
"""

import os
import urllib.request
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# Install extra requirements (Uncomment if running in Google Colab)
# !pip install sentence-transformers faiss-cpu

try:
    from sentence_transformers import SentenceTransformer
    import faiss
except ImportError:
    print("Please install requirements: pip install sentence-transformers faiss-cpu")

# --- Step 1: Download Original Datasets ---
print("--- Step 1: Downloading original datasets for training ---")
os.makedirs("datasets", exist_ok=True)

urls = {
    "fhm": "https://huggingface.co/datasets/neuralcatcher/hateful_memes/resolve/main/train.jsonl",
    "mami": "https://huggingface.co/datasets/arch-raven/MAMI/resolve/main/data.jsonl",
    "hatred": "https://raw.githubusercontent.com/Social-AI-Studio/HatReD/main/datasets/hatred/annotations/fhm_train_reasonings.jsonl",
    "harmeme_dev": "https://raw.githubusercontent.com/panFJCharlotte98/HMC/main/data/HarMeme_V1/data/Harm-C/dev.json",
    "harmeme_test": "https://raw.githubusercontent.com/panFJCharlotte98/HMC/main/data/HarMeme_V1/data/Harm-C/test.json"
}

# Download and load FHM
fhm_path = "datasets/fhm_train.jsonl"
if not os.path.exists(fhm_path):
    urllib.request.urlretrieve(urls["fhm"], fhm_path)
df_fhm = pd.read_json(fhm_path, lines=True)
print(f"Loaded FHM: {df_fhm.shape[0]} rows")

# Download and load MAMI
mami_path = "datasets/mami_data.jsonl"
if not os.path.exists(mami_path):
    urllib.request.urlretrieve(urls["mami"], mami_path)
df_mami = pd.read_json(mami_path, lines=True)
print(f"Loaded MAMI: {df_mami.shape[0]} rows")

# Download and load HatReD
hatred_path = "datasets/fhm_train_reasonings.jsonl"
if not os.path.exists(hatred_path):
    urllib.request.urlretrieve(urls["hatred"], hatred_path)
df_hatred = pd.read_json(hatred_path, lines=True)
print(f"Loaded HatReD: {df_hatred.shape[0]} rows")


# --- Step 2: RCR (Representative Case Retrieval) Indexing ---
print("\n--- Step 2: Initializing Representative Case Retrieval Index ---")
embed_model = SentenceTransformer('all-MiniLM-L6-v2')

# Combine datasets for RCR corpus
texts = df_fhm['text'].tolist()
embeddings = embed_model.encode(texts, show_progress_bar=True)
embeddings = np.array(embeddings).astype('float32')

# Build FAISS L2 index
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(embeddings)
print(f"FAISS vector index built successfully with {index.ntotal} vectors.")


# --- Step 3: Define PyTorch Safety Classifier Model ---
print("\n--- Step 3: Defining Safety Classifier Network ---")

class MemeDataset(Dataset):
    def __init__(self, texts, labels, embed_model):
        self.embeddings = embed_model.encode(texts, show_progress_bar=False)
        self.labels = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return torch.tensor(self.embeddings[idx], dtype=torch.float32), torch.tensor(self.labels[idx], dtype=torch.long)

class MemeSafetyClassifier(nn.Module):
    def __init__(self, input_dim):
        super(MemeSafetyClassifier, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 2) # Outputs Logits: 0 = Safe, 1 = Unsafe (Hateful)
        )

    def forward(self, x):
        return self.net(x)


# --- Step 4: Model Training ---
print("\n--- Step 4: Preparing training data & training model ---")
# Use a subset of FHM for demonstration speed
train_texts = df_fhm['text'].iloc[:2000].tolist()
train_labels = df_fhm['label'].iloc[:2000].tolist() # 0 = safe, 1 = unsafe

val_texts = df_fhm['text'].iloc[2000:2500].tolist()
val_labels = df_fhm['label'].iloc[2000:2500].tolist()

train_dataset = MemeDataset(train_texts, train_labels, embed_model)
val_dataset = MemeDataset(val_texts, val_labels, embed_model)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = MemeSafetyClassifier(input_dim=dimension).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)

epochs = 10
print(f"Training on device: {device}")
for epoch in range(epochs):
    model.train()
    total_loss = 0
    correct = 0
    total = 0
    for inputs, targets in train_loader:
        inputs, targets = inputs.to(device), targets.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        _, predicted = outputs.max(1)
        total += targets.size(0)
        correct += predicted.eq(targets).sum().item()

    # Validation
    model.eval()
    val_loss = 0
    val_correct = 0
    val_total = 0
    with torch.no_grad():
        for inputs, targets in val_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            val_loss += loss.item()
            _, predicted = outputs.max(1)
            val_total += targets.size(0)
            val_correct += predicted.eq(targets).sum().item()

    print(f"Epoch {epoch+1:02d}/{epochs:02d} | "
          f"Train Loss: {total_loss/len(train_loader):.4f} | Acc: {100.*correct/total:.2f}% | "
          f"Val Loss: {val_loss/len(val_loader):.4f} | Val Acc: {100.*val_correct/val_total:.2f}%")


# --- Step 5: Inference with RCR Case-Retrieval & CoT Prompt Generation ---
print("\n--- Step 5: Simulating Base Paper Inference Flow ---")

def run_base_paper_flow(query_text, query_objects):
    print(f"\n[QUERY MEME]")
    print(f"  OCR Text: '{query_text}'")
    print(f"  Visual Objects: {query_objects}")

    # 1. Representative Case Retrieval (RCR)
    query_emb = embed_model.encode([query_text]).astype('float32')
    D, I = index.search(query_emb, k=2) # Find 2 most similar cases
    
    retrieved_cases = []
    for idx, dist in zip(I[0], D[0]):
        case_text = df_fhm['text'].iloc[idx]
        case_label = "Unsafe (Hateful)" if df_fhm['label'].iloc[idx] == 1 else "Safe (Non-Hateful)"
        # Try to find corresponding target/reason in HatReD
        hatred_match = df_hatred[df_hatred['id'] == df_fhm['id'].iloc[idx]]
        reason = hatred_match['reasonings'].iloc[0][0] if not hatred_match.empty and hatred_match['reasonings'].iloc[0] else "N/A"
        retrieved_cases.append((case_text, case_label, reason))

    # 2. Classifier evaluation
    model.eval()
    with torch.no_grad():
        logits = model(torch.tensor(query_emb).to(device))
        prob = torch.softmax(logits, dim=1)
        pred_class = prob.argmax(dim=1).item()
        confidence = prob[0][pred_class].item()
    
    safety_result = "Unsafe (Hateful)" if pred_class == 1 else "Safe (Non-Hateful)"

    # 3. Print the Chain-of-Thought (CoT) Prompt template generated for LLM reasoning
    print("\n[SCRA-MTI & CoT PROMPT GENERATED FOR MLLM]")
    print("------------------------------------------")
    prompt = f"""
System Prompt: You are a socio-cultural meme safety auditor.
Context:
Similar retrieved cases (RCR):
1. Text: "{retrieved_cases[0][0]}" | Label: {retrieved_cases[0][1]} | Reason: {retrieved_cases[0][2]}
2. Text: "{retrieved_cases[1][0]}" | Label: {retrieved_cases[1][1]} | Reason: {retrieved_cases[1][2]}

Current Meme Input:
- Visual Bounding Boxes (YOLO-World): {query_objects}
- OCR Text: "{query_text}"

Task:
Perform Chain-of-Thought reasoning. Connect the visual objects with the text transcription.
State the target category, metaphorical comparison, safety category, and the detailed safety reasoning.
"""
    print(prompt.strip())
    print("------------------------------------------")
    print(f"Classification Prediction: {safety_result} (Confidence: {confidence:.2%})")

# Run inference simulation
run_base_paper_flow(
    query_text="look at that chimpanzee eating like a human",
    query_objects=["Chimpanzee", "Banana"]
)
