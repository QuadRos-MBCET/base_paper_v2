import os
import random
import asyncio
from flask import Flask, jsonify, request, send_from_directory, render_template, redirect
from backend.config import HOST, PORT, DEBUG, BASE_DIR, DATASET_DIR, IMAGES_DIR
from backend.utils import load_all_posts
from backend.inference_wrapper import predict_content

def extract_text_from_image_fallback_api(absolute_image_path):
    """
    Fallback OCR using free OCR Space API for non-Windows platforms (like Linux/Render).
    """
    try:
        import requests
        url = "https://api.ocr.space/parse/image"
        with open(absolute_image_path, "rb") as f:
            files = {"file": f}
            data = {"apikey": "helloworld", "language": "eng"}
            # Disable verification in case of SSL proxy/interceptions
            response = requests.post(url, files=files, data=data, verify=False, timeout=8)
            result = response.json()
            if "ParsedResults" in result and len(result["ParsedResults"]) > 0:
                parsed_text = result["ParsedResults"][0].get("ParsedText", "").strip()
                return parsed_text
    except Exception as ex:
        print(f"Fallback OCR API failed: {ex}")
    return ""

def extract_text_from_image(absolute_image_path):
    """
    Extracts text from a local image file using Windows native OCR via PyWinRT.
    """
    if not os.path.exists(absolute_image_path):
        return ""
    try:
        from winrt.windows.storage import StorageFile
        from winrt.windows.media.ocr import OcrEngine
        from winrt.windows.graphics.imaging import BitmapDecoder

        async def run_ocr():
            file = await StorageFile.get_file_from_path_async(absolute_image_path)
            stream = await file.open_async(1) # Read mode
            decoder = await BitmapDecoder.create_async(stream)
            bitmap = await decoder.get_software_bitmap_async()
            engine = OcrEngine.try_create_from_user_profile_languages()
            if not engine:
                return ""
            result = await engine.recognize_async(bitmap)
            return result.text
            
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        text = loop.run_until_complete(run_ocr())
        loop.close()
        return text
    except Exception as e:
        print(f"Windows Native OCR failed (falling back to Web API): {e}")
        return extract_text_from_image_fallback_api(absolute_image_path)


# Set up paths for template and static files
template_dir = os.path.abspath(os.path.join(BASE_DIR, 'templates'))
static_dir = os.path.abspath(os.path.join(BASE_DIR, 'static'))

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

# Cache posts on startup to ensure fast responses
ALL_POSTS = []

def init_posts():
    global ALL_POSTS
    try:
        raw_posts = load_all_posts()
        # Separate into Hateful and Not Hateful to ensure a balanced feed
        hateful = [p for p in raw_posts if p["true_label"] == 1]
        safe = [p for p in raw_posts if p["true_label"] == 0]
        
        # Take a balanced sample
        random.seed(42)
        sample_hateful = random.sample(hateful, min(len(hateful), 100))
        sample_safe = random.sample(safe, min(len(safe), 150))
        
        ALL_POSTS = sample_hateful + sample_safe
        random.shuffle(ALL_POSTS)
        print(f"Loaded {len(ALL_POSTS)} curated posts for the demonstration feed.")
    except Exception as e:
        print(f"Error during post initialization: {e}")
        ALL_POSTS = []

@app.route('/')
def home():
    """Serves the main application UI."""
    return render_template('index.html')

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """Returns the list of curated feed posts."""
    if not ALL_POSTS:
        init_posts()
    return jsonify(ALL_POSTS)



@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Executes prediction via the inference wrapper.
    Accepts JSON containing post_id, image_path, and text.
    """
    data = request.get_json() or {}
    post_id = data.get('post_id')
    image_path = data.get('image_path')
    text = data.get('text')
    
    if not image_path:
        return jsonify({"error": "Missing image_path parameter"}), 400
        
    result = predict_content(post_id, image_path, text)
    return jsonify(result)

@app.route('/api/predict_custom', methods=['POST'])
def predict_custom():
    """
    Accepts custom image upload and text via form data,
    saves the image temporarily to get a path, runs the prediction wrapper,
    and returns prediction results.
    """
    text = request.form.get('text', '')
    img_file = request.files.get('image')
    
    # Save the file temporarily in static/assets/temp
    temp_filename = "custom_upload.png"
    temp_dir = os.path.join(static_dir, 'assets', 'temp')
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, temp_filename)
    
    if img_file:
        try:
            img_file.save(temp_path)
            image_path = os.path.relpath(temp_path, DATASET_DIR)
        except Exception as e:
            print(f"Error saving uploaded image: {e}")
            image_path = "img/placeholder.png"
    else:
        image_path = "img/placeholder.png"
        
    # If the user left the text overlay empty, run Windows OCR on the image
    if not text.strip() and img_file:
        extracted_text = extract_text_from_image(temp_path)
        if extracted_text:
            print(f"Auto-OCR extracted: {extracted_text}")
            text = extracted_text
            
    # Execute prediction via the inference wrapper
    result = predict_content(None, image_path, text)
    result["ocr_text"] = text
    return jsonify(result)

@app.route('/api/media/<path:filename>')
def get_media(filename):
    """
    Serves images from the local datasets folder.
    If the file is not present on disk, dynamically redirects to the Hugging Face
    repository hosting the official FHM dataset images.
    """
    basename = os.path.basename(filename)
    # Check under images directory first
    if os.path.exists(os.path.join(IMAGES_DIR, filename)):
        return send_from_directory(IMAGES_DIR, filename)
    if os.path.exists(os.path.join(IMAGES_DIR, basename)):
        return send_from_directory(IMAGES_DIR, basename)
    # Check directly under dataset dir
    if os.path.exists(os.path.join(DATASET_DIR, filename)):
        return send_from_directory(DATASET_DIR, filename)
    if os.path.exists(os.path.join(DATASET_DIR, basename)):
        return send_from_directory(DATASET_DIR, basename)
    
    # Ensure path format is correct for Hugging Face
    hf_path = filename.replace("\\", "/")
    if not hf_path.startswith("img/"):
        hf_path = f"img/{hf_path}"
        
    return redirect(f"https://huggingface.co/datasets/neuralcatcher/hateful_memes/resolve/main/{hf_path}")

# Serve avatar placeholders if they don't exist
@app.route('/static/assets/avatars/<path:filename>')
def get_avatar(filename):
    """
    Serves avatar vectors, resolving both .png and .svg requests to local assets,
    and fallback to placeholder-avatar.png without Werkzeug-incompatible keywords.
    """
    name, ext = os.path.splitext(filename)
    avatars_dir = os.path.join(static_dir, 'assets', 'avatars')
    for try_ext in ['.svg', '.png']:
        try_path = os.path.join(avatars_dir, name + try_ext)
        if os.path.exists(try_path):
            return send_from_directory(avatars_dir, name + try_ext)
            
    # If missing, return the generic placeholder
    return send_from_directory(os.path.join(static_dir, 'assets'), 'placeholder-avatar.png')

if __name__ == '__main__':
    init_posts()
    app.run(host=HOST, port=PORT, debug=DEBUG)
