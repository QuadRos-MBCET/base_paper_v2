import os

# Base directory definitions
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "datasets")
IMAGES_DIR = os.path.join(DATASET_DIR, "images")

# Notebook path
NOTEBOOK_PATH = os.path.join(BASE_DIR, "colab_pipelines", "reproduce_paper_pipeline.ipynb")

# Server settings
HOST = "127.0.0.1"
PORT = 5000
DEBUG = True
