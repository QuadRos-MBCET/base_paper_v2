# -*- coding: utf-8 -*-
"""
Google Colab - Complete Ablation Study Training Pipeline
Task: Replicate 'TABLE V: Ablation Study' for FHM, MAMI, and HarMeme datasets.
Runs sequentially:
  - Configuration 1: Baseline (Meme Text Embeddings only)
  - Configuration 2: + SCK (Socio-Cultural Knowledge retrieved via FAISS)
  - Configuration 3: + SCK + SCRS (Socio-Cultural Relevance Score appended)
  - Configuration 4: + SCK + SCRS + RC (Representative Case retrieved via FAISS appended)
"""

# --- STEP 0: INSTALL SYSTEM REQUIREMENTS ---
!pip install sentence-transformers scikit-learn transformers datasets accelerate rouge-score faiss-cpu

# --- STEP 1: INITIALIZE ENVIRONMENT ---
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
from sentence_transformers import SentenceTransformer
import faiss

# Create datasets folder
os.makedirs("datasets", exist_ok=True)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Dataset URLs
urls = {
    "fhm": "https://huggingface.co/datasets/neuralcatcher/hateful_memes/resolve/main/train.jsonl",
    "mami": "https://huggingface.co/datasets/arch-raven/MAMI/resolve/main/data.jsonl",
    "hatred": "https://raw.githubusercontent.com/Social-AI-Studio/HatReD/main/datasets/hatred/annotations/fhm_train_reasonings.jsonl",
    "harmeme_dev": "https://raw.githubusercontent.com/panFJCharlotte98/HMC/main/data/HarMeme_V1/data/Harm-C/dev.json",
    "harmeme_test": "https://raw.githubusercontent.com/panFJCharlotte98/HMC/main/data/HarMeme_V1/data/Harm-C/test.json"
}

# --- STEP 2: DOWNLOAD DATASETS ---
print("Downloading datasets...")
for name, url in urls.items():
    path = f"datasets/{name}.json" if "harmeme" in name else f"datasets/{name}.jsonl"
    if not os.path.exists(path):
        print(f"Downloading {name}...")
        urllib.request.urlretrieve(url, path)

# Load HatReD explanations to build Knowledge Base
df_hatred = pd.read_json("datasets/hatred.jsonl", lines=True)
knowledge_texts = []
for _, row in df_hatred.iterrows():
    if row['reasonings']:
        knowledge_texts.append(row['reasonings'][0])
knowledge_texts = list(set(knowledge_texts)) # Remove duplicates

# Initialize Encoder Model
embed_model = SentenceTransformer('all-MiniLM-L6-v2')
print(f"Loaded embedding model. Knowledge Base size: {len(knowledge_texts)} explanations.")

# --- STEP 3: BUILD KNOWLEDGE BASE FAISS INDEX ---
print("Building FAISS Vector Index over HatReD knowledge base...")
kb_embeddings = embed_model.encode(knowledge_texts, show_progress_bar=False).astype(np.float32)
faiss.normalize_L2(kb_embeddings) # Use Cosine Similarity

index = faiss.IndexFlatIP(kb_embeddings.shape[1]) # Inner Product on normalized vectors = Cosine Similarity
index.add(kb_embeddings)

def retrieve_knowledge_features(texts):
    """
    For a given batch of texts, queries the FAISS index to extract:
      1. SCK: Socio-Cultural Knowledge (embedding of top-1 nearest explanation)
      2. SCRS: Cosine Similarity score of the top-1 explanation
      3. RC: Representative Case (embedding of top-2 nearest explanation)
    """
    text_embeddings = embed_model.encode(texts, show_progress_bar=False).astype(np.float32)
    faiss.normalize_L2(text_embeddings)
    
    # Query FAISS index for top-2 neighbors
    similarities, indices = index.search(text_embeddings, k=2)
    
    sck_embeddings = []
    scrs_scores = []
    rc_embeddings = []
    
    for i in range(len(texts)):
        top1_idx = indices[i][0]
        top2_idx = indices[i][1]
        
        sck_embeddings.append(kb_embeddings[top1_idx])
        scrs_scores.append([similarities[i][0]]) # Shape [1]
        rc_embeddings.append(kb_embeddings[top2_idx])
        
    return np.array(sck_embeddings), np.array(scrs_scores), np.array(rc_embeddings)

# --- STEP 4: DEFINE CLASSIFICATION UTILITIES ---
class AblationDataset(Dataset):
    def __init__(self, X, y, is_multilabel=False):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32 if is_multilabel else torch.long)
    def __len__(self): return len(self.y)
    def __getitem__(self, idx): return self.X[idx], self.y[idx]

class DenseAblationClassifier(nn.Module):
    def __init__(self, input_dim, output_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 256), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(256, 128), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(128, output_dim)
        )
    def forward(self, x): return self.net(x)

def run_training_config(X_train, y_train, X_val, y_val, is_multilabel=False, output_dim=2, epochs=8):
    train_loader = DataLoader(AblationDataset(X_train, y_train, is_multilabel), batch_size=64, shuffle=True)
    val_loader = DataLoader(AblationDataset(X_val, y_val, is_multilabel), batch_size=64, shuffle=False)
    
    model = DenseAblationClassifier(X_train.shape[1], output_dim).to(device)
    criterion = nn.BCEWithLogitsLoss() if is_multilabel else nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)
    
    best_acc = 0.0
    best_auc = 0.0
    
    for epoch in range(epochs):
        model.train()
        for inputs, targets in train_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            optimizer.zero_grad()
            loss = criterion(model(inputs), targets)
            loss.backward()
            optimizer.step()
            
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
        else:
            all_preds = all_probs.argmax(axis=1)
            acc = accuracy_score(all_targets, all_preds)
            auc = roc_auc_score(all_targets, all_probs[:, 1])
            
        if acc > best_acc:
            best_acc = acc
            best_auc = auc
            
    return best_acc, best_auc

# Global store for ablation results
ablation_results = {
    "FHM": {"Baseline": (0,0), "+SCK": (0,0), "+SCK+SCRS": (0,0), "+SCK+SCRS+RC": (0,0)},
    "MAMI": {"Baseline": (0,0), "+SCK": (0,0), "+SCK+SCRS": (0,0), "+SCK+SCRS+RC": (0,0)},
    "HarM": {"Baseline": (0,0), "+SCK": (0,0), "+SCK+SCRS": (0,0), "+SCK+SCRS+RC": (0,0)}
}

# =====================================================================
# DATASET PIPELINE: FHM
# =====================================================================
print("\nProcessing FHM dataset...")
df_fhm = pd.read_json("datasets/fhm.jsonl", lines=True)
train_fhm, val_fhm = df_fhm.iloc[:7000], df_fhm.iloc[7000:8500]

print("  Encoding text and retrieving knowledge...")
X_train_text = embed_model.encode(train_fhm['text'].tolist(), show_progress_bar=False)
X_val_text = embed_model.encode(val_fhm['text'].tolist(), show_progress_bar=False)

train_sck, train_scrs, train_rc = retrieve_knowledge_features(train_fhm['text'].tolist())
val_sck, val_scrs, val_rc = retrieve_knowledge_features(val_fhm['text'].tolist())

y_train_fhm = train_fhm['label'].values
y_val_fhm = val_fhm['label'].values

# Run Configurations
print("  Running FHM Ablations...")
ablation_results["FHM"]["Baseline"] = run_training_config(X_train_text, y_train_fhm, X_val_text, y_val_fhm)
ablation_results["FHM"]["+SCK"] = run_training_config(
    np.hstack((X_train_text, train_sck)), y_train_fhm, 
    np.hstack((X_val_text, val_sck)), y_val_fhm
)
ablation_results["FHM"]["+SCK+SCRS"] = run_training_config(
    np.hstack((X_train_text, train_sck, train_scrs)), y_train_fhm, 
    np.hstack((X_val_text, val_sck, val_scrs)), y_val_fhm
)
ablation_results["FHM"]["+SCK+SCRS+RC"] = run_training_config(
    np.hstack((X_train_text, train_sck, train_scrs, train_rc)), y_train_fhm, 
    np.hstack((X_val_text, val_sck, val_scrs, val_rc)), y_val_fhm
)

# =====================================================================
# DATASET PIPELINE: MAMI
# =====================================================================
print("\nProcessing MAMI dataset...")
df_mami = pd.read_json("datasets/mami.jsonl", lines=True)
train_mami, val_mami = df_mami.iloc[:8000], df_mami.iloc[8000:10000]

print("  Encoding text and retrieving knowledge...")
X_train_text_mami = embed_model.encode(train_mami['transcription'].tolist(), show_progress_bar=False)
X_val_text_mami = embed_model.encode(val_mami['transcription'].tolist(), show_progress_bar=False)

train_sck_mami, train_scrs_mami, train_rc_mami = retrieve_knowledge_features(train_mami['transcription'].tolist())
val_sck_mami, val_scrs_mami, val_rc_mami = retrieve_knowledge_features(val_mami['transcription'].tolist())

y_train_mami = train_mami[labels_cols].values.astype(np.float32)
y_val_mami = val_mami[labels_cols].values.astype(np.float32)

# Run Configurations
print("  Running MAMI Ablations...")
ablation_results["MAMI"]["Baseline"] = run_training_config(X_train_text_mami, y_train_mami, X_val_text_mami, y_val_mami, is_multilabel=True, output_dim=5)
ablation_results["MAMI"]["+SCK"] = run_training_config(
    np.hstack((X_train_text_mami, train_sck_mami)), y_train_mami, 
    np.hstack((X_val_text_mami, val_sck_mami)), y_val_mami, is_multilabel=True, output_dim=5
)
ablation_results["MAMI"]["+SCK+SCRS"] = run_training_config(
    np.hstack((X_train_text_mami, train_sck_mami, train_scrs_mami)), y_train_mami, 
    np.hstack((X_val_text_mami, val_sck_mami, val_scrs_mami)), y_val_mami, is_multilabel=True, output_dim=5
)
ablation_results["MAMI"]["+SCK+SCRS+RC"] = run_training_config(
    np.hstack((X_train_text_mami, train_sck_mami, train_scrs_mami, train_rc_mami)), y_train_mami, 
    np.hstack((X_val_text_mami, val_sck_mami, val_scrs_mami, val_rc_mami)), y_val_mami, is_multilabel=True, output_dim=5
)

# =====================================================================
# DATASET PIPELINE: HarMeme
# =====================================================================
print("\nProcessing HarMeme dataset...")
harm_rows = []
for p in ["datasets/harmeme_dev.json", "datasets/harmeme_test.json"]:
    with open(p, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for item in data:
            harm_rows.append({"text": item['text'], "label": 1 if item['label'] > 0 else 0})

df_harm = pd.DataFrame(harm_rows)
train_harm, val_harm = df_harm.iloc[:400], df_harm.iloc[400:]

print("  Encoding text and retrieving knowledge...")
X_train_text_harm = embed_model.encode(train_harm['text'].tolist(), show_progress_bar=False)
X_val_text_harm = embed_model.encode(val_harm['text'].tolist(), show_progress_bar=False)

train_sck_harm, train_scrs_harm, train_rc_harm = retrieve_knowledge_features(train_harm['text'].tolist())
val_sck_harm, val_scrs_harm, val_rc_harm = retrieve_knowledge_features(val_harm['text'].tolist())

y_train_harm = train_harm['label'].values
y_val_harm = val_harm['label'].values

# Run Configurations
print("  Running HarMeme Ablations...")
ablation_results["HarM"]["Baseline"] = run_training_config(X_train_text_harm, y_train_harm, X_val_text_harm, y_val_harm)
ablation_results["HarM"]["+SCK"] = run_training_config(
    np.hstack((X_train_text_harm, train_sck_harm)), y_train_harm, 
    np.hstack((X_val_text_harm, val_sck_harm)), y_val_harm
)
ablation_results["HarM"]["+SCK+SCRS"] = run_training_config(
    np.hstack((X_train_text_harm, train_sck_harm, train_scrs_harm)), y_train_harm, 
    np.hstack((X_val_text_harm, val_sck_harm, val_scrs_harm)), y_val_harm
)
ablation_results["HarM"]["+SCK+SCRS+RC"] = run_training_config(
    np.hstack((X_train_text_harm, train_sck_harm, train_scrs_harm, train_rc_harm)), y_train_harm, 
    np.hstack((X_val_text_harm, val_sck_harm, val_scrs_harm, val_rc_harm)), y_val_harm
)

# =====================================================================
# --- STEP 5: PRINT REPLICATED TABLE V ---
# =====================================================================
print("\n" + "="*80)
print("                    TABLE V: ABLATION STUDY RESULTS")
print("="*80)
print(f"{'Model Setting':<25} | {'FHM AUC':<8} {'FHM Acc':<8} | {'MAMI AUC':<8} {'MAMI Acc':<8} | {'HarM AUC':<8} {'HarM Acc':<8}")
print("-"*80)

for setting in ["Baseline", "+SCK", "+SCK+SCRS", "+SCK+SCRS+RC"]:
    fhm_auc, fhm_acc = ablation_results["FHM"][setting]
    mami_auc, mami_acc = ablation_results["MAMI"][setting]
    harm_auc, harm_acc = ablation_results["HarM"][setting]
    
    # Scale values to match paper (0-100 scale)
    print(f"{setting:<25} | {fhm_auc*100:<8.2f} {fhm_acc*100:<8.2f} | {mami_auc*100:<8.2f} {mami_acc*100:<8.2f} | {harm_auc*100:<8.2f} {harm_acc*100:<8.2f}")

print("="*80)
