# -*- coding: utf-8 -*-
"""
Google Colab - HarMeme Classification Pipeline
Task: COVID-19 related harmful and hateful meme detection
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
from sklearn.metrics import accuracy_score, roc_auc_score

# Install extra packages in Colab if needed:
# !pip install sentence-transformers scikit-learn

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("Please install requirements: pip install sentence-transformers scikit-learn")

# --- Step 1: Download & Load Original HarMeme Dataset ---
print("--- Step 1: Loading HarMeme Dataset ---")
os.makedirs("datasets", exist_ok=True)
harm_dev_url = "https://raw.githubusercontent.com/panFJCharlotte98/HMC/main/data/HarMeme_V1/data/Harm-C/dev.json"
harm_test_url = "https://raw.githubusercontent.com/panFJCharlotte98/HMC/main/data/HarMeme_V1/data/Harm-C/test.json"

harm_dev_path = "datasets/harm_dev.json"
harm_test_path = "datasets/harm_test.json"

if not os.path.exists(harm_dev_path):
    print("Downloading HarMeme dev...")
    urllib.request.urlretrieve(harm_dev_url, harm_dev_path)
if not os.path.exists(harm_test_path):
    print("Downloading HarMeme test...")
    urllib.request.urlretrieve(harm_test_url, harm_test_path)

# Merge dev and test data splits
harm_rows = []
for p in [harm_dev_path, harm_test_path]:
    with open(p, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for item in data:
            # Map label: 0 is non-hateful, 1 or 2 is hateful/harmful
            binary_label = 1 if item['label'] > 0 else 0
            harm_rows.append({"text": item['text'], "label": binary_label})

df = pd.DataFrame(harm_rows)
print(f"Total rows: {df.shape[0]} | Harmful (1): {df[df['label']==1].shape[0]} | Non-Harmful (0): {df[df['label']==0].shape[0]}")

# --- Step 2: Text Embedding Generation ---
print("\n--- Step 2: Extracting Text Embeddings ---")
embed_model = SentenceTransformer('all-MiniLM-L6-v2')

# Split dataset into train and validation sets
train_df = df.iloc[:400]
val_df = df.iloc[400:]

print("Encoding train texts...")
X_train = embed_model.encode(train_df['text'].tolist(), show_progress_bar=True)
y_train = train_df['label'].values

print("Encoding val texts...")
X_val = embed_model.encode(val_df['text'].tolist(), show_progress_bar=True)
y_val = val_df['label'].values

# --- Step 3: Dataset Loader ---
class HarMemeDataset(Dataset):
    def __init__(self, embeddings, labels):
        self.embeddings = torch.tensor(embeddings, dtype=torch.float32)
        self.labels = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return self.embeddings[idx], self.labels[idx]

train_loader = DataLoader(HarMemeDataset(X_train, y_train), batch_size=32, shuffle=True)
val_loader = DataLoader(HarMemeDataset(X_val, y_val), batch_size=32, shuffle=False)

# --- Step 4: Model Architecture ---
class HarMemeSafetyClassifier(nn.Module):
    def __init__(self, input_dim):
        super(HarMemeSafetyClassifier, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 2)
        )

    def forward(self, x):
        return self.net(x)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = HarMemeSafetyClassifier(input_dim=X_train.shape[1]).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)

# --- Step 5: Model Training & Evaluation ---
print("\n--- Step 5: Training HarMeme Model ---")
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
    all_preds = []
    all_probs = []
    all_targets = []
    with torch.no_grad():
        for inputs, targets in val_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            probs = torch.softmax(outputs, dim=1)
            all_preds.extend(outputs.argmax(dim=1).cpu().numpy())
            all_probs.extend(probs[:, 1].cpu().numpy())
            all_targets.extend(targets.numpy())

    acc = accuracy_score(all_targets, all_preds)
    auc = roc_auc_score(all_targets, all_probs)
    print(f"Epoch {epoch+1:02d}/{epochs:02d} | Loss: {total_loss/len(train_loader):.4f} | Val Acc: {acc:.2%} | Val AUC: {auc:.4f}")

print("\nHarMeme training complete! Saving model checkpoint...")
torch.save(model.state_dict(), "harmeme_safety_classifier.pt")
