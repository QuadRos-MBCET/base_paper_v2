# -*- coding: utf-8 -*-
"""
Google Colab - MAMI (Multimedia Automatic Misogyny Identification) Classification Pipeline
Task: Multi-Label Misogyny, Shaming, Stereotype, Objectification, and Violence classification
"""

import os
import urllib.request
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import accuracy_score, roc_auc_score

# Install extra packages in Colab if needed:
# !pip install sentence-transformers scikit-learn

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("Please install requirements: pip install sentence-transformers scikit-learn")

# --- Step 1: Download & Load Original MAMI Dataset ---
print("--- Step 1: Loading MAMI Dataset ---")
os.makedirs("datasets", exist_ok=True)
mami_url = "https://huggingface.co/datasets/arch-raven/MAMI/resolve/main/data.jsonl"
mami_path = "datasets/mami_data.jsonl"

if not os.path.exists(mami_path):
    print("Downloading MAMI data.jsonl...")
    urllib.request.urlretrieve(mami_url, mami_path)

df = pd.read_json(mami_path, lines=True)
print(f"Dataset columns: {df.columns.tolist()}")

labels_cols = ["misogynous", "shaming", "stereotype", "objectification", "violence"]
print(f"Total rows: {df.shape[0]}")
for col in labels_cols:
    print(f"  Class '{col}' distribution: {df[df[col]==1].shape[0]} positive cases")

# --- Step 2: Text Embedding Generation ---
print("\n--- Step 2: Extracting Text Embeddings ---")
embed_model = SentenceTransformer('all-MiniLM-L6-v2')

# Split dataset
train_df = df.iloc[:8000]
val_df = df.iloc[8000:10000]

print("Encoding train texts...")
X_train = embed_model.encode(train_df['transcription'].tolist(), show_progress_bar=True)
y_train = train_df[labels_cols].values.astype(np.float32)

print("Encoding val texts...")
X_val = embed_model.encode(val_df['transcription'].tolist(), show_progress_bar=True)
y_val = val_df[labels_cols].values.astype(np.float32)

# --- Step 3: Dataset Loader ---
class MAMIDataset(Dataset):
    def __init__(self, embeddings, labels):
        self.embeddings = torch.tensor(embeddings, dtype=torch.float32)
        self.labels = torch.tensor(labels, dtype=torch.float32)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return self.embeddings[idx], self.labels[idx]

train_loader = DataLoader(MAMIDataset(X_train, y_train), batch_size=64, shuffle=True)
val_loader = DataLoader(MAMIDataset(X_val, y_val), batch_size=64, shuffle=False)

# --- Step 4: Model Architecture (Multi-Label Classifier) ---
class MAMIMultiLabelClassifier(nn.Module):
    def __init__(self, input_dim, num_labels):
        super(MAMIMultiLabelClassifier, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, num_labels)
        )

    def forward(self, x):
        return self.net(x)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = MAMIMultiLabelClassifier(input_dim=X_train.shape[1], num_labels=len(labels_cols)).to(device)
criterion = nn.BCEWithLogitsLoss() # Appropriate loss for multi-label classification
optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)

# --- Step 5: Model Training & Evaluation ---
print("\n--- Step 5: Training MAMI Model ---")
epochs = 15
for epoch in range(epochs):
    model.train()
    total_loss = 0
    for inputs, targets in train_loader:
        inputs, targets = inputs.to(device), targets.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()

    # Evaluation
    model.eval()
    all_probs = []
    all_targets = []
    with torch.no_grad():
        for inputs, targets in val_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            probs = torch.sigmoid(outputs)
            all_probs.extend(probs.cpu().numpy())
            all_targets.extend(targets.numpy())

    all_probs = np.array(all_probs)
    all_targets = np.array(all_targets)
    all_preds = (all_probs > 0.5).astype(int)

    # Compute metric per label
    aucs = []
    for i, col in enumerate(labels_cols):
        try:
            label_auc = roc_auc_score(all_targets[:, i], all_probs[:, i])
            aucs.append(label_auc)
        except ValueError:
            aucs.append(0.5)

    mean_acc = accuracy_score(all_targets, all_preds)
    mean_auc = np.mean(aucs)
    print(f"Epoch {epoch+1:02d}/{epochs:02d} | Loss: {total_loss/len(train_loader):.4f} | Mean Val Acc: {mean_acc:.2%} | Mean Val AUC: {mean_auc:.4f}")

print("\nMAMI training complete! Saving model checkpoint...")
torch.save(model.state_dict(), "mami_multilabel_classifier.pt")
