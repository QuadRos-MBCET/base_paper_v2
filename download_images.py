import os
from datasets import load_dataset

datasets_dir = r"c:\s7\base_paperv2\base_paper_v2\datasets"
images_dir = os.path.join(datasets_dir, "images")
os.makedirs(images_dir, exist_ok=True)

print("How to view images associated with the datasets:")
print("-----------------------------------------------")
print("Option A: View Online via Browser (For FHM & HatReD)")
print("1. FHM/HatReD: Any image path from fhm_dataset.csv or hatred_dataset.csv (e.g. img/97860.png)")
print("   can be viewed by appending it to the Hugging Face resolve URL in your browser:")
print("   https://huggingface.co/datasets/neuralcatcher/hateful_memes/resolve/main/img/97860.png")
print("")
print("Option B: Extract and Save MAMI Images using Python")
print("Since MAMI images are embedded inside Hugging Face Parquet files, you can use")
print("the 'datasets' library to load and save them locally:")
print("")
print("```python")
print("from datasets import load_dataset")
print("ds = load_dataset('scintist/MAMI-dataset', split='train')")
print("ds[0]['image'].save('mami_sample_0.jpg')")
print("```")
