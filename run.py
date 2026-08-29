import os
import shutil
import subprocess

# Paths definitions
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOWNLOADS_DIR = r"C:\Users\Asus\Downloads"
STATIC_DIR = os.path.join(BASE_DIR, "static")
ASSETS_DIR = os.path.join(STATIC_DIR, "assets")
AVATARS_DIR = os.path.join(ASSETS_DIR, "avatars")
REELS_DIR = os.path.join(ASSETS_DIR, "reels")

# Gradient color schemes for avatars
AVATAR_COLORS = [
    ("#8b5cf6", "#ec4899", "A"),
    ("#3b82f6", "#8b5cf6", "B"),
    ("#10b981", "#3b82f6", "C"),
    ("#f59e0b", "#ef4444", "D"),
    ("#ec4899", "#f43f5e", "E"),
    ("#14b8a6", "#10b981", "F"),
    ("#6366f1", "#a855f7", "G"),
    ("#f97316", "#f59e0b", "H"),
    ("#06b6d4", "#3b82f6", "I"),
    ("#ec4899", "#8b5cf6", "J")
]

# Videos to copy from Downloads
REELS_MAPPING = {
    "Try this out today #deepshi #fyp #chatgpt #manus #claude.mp4": "reel1.mp4",
    "WhatsApp.mp4": "reel2.mp4",
    "videoplayback.mp4": "reel3.mp4",
    "vidssave.com Obsession Movie Clip - Nice Date (2026) 720P.mp4": "reel4.mp4"
}

def setup_directories():
    """Create static assets directories if they do not exist."""
    print("Setting up asset directories...")
    os.makedirs(AVATARS_DIR, exist_ok=True)
    os.makedirs(REELS_DIR, exist_ok=True)

def generate_svg_avatars():
    """Generates 10 abstract vector SVG avatars with color gradients and initials."""
    print("Generating vector avatar assets...")
    for idx, (c1, c2, initial) in enumerate(AVATAR_COLORS):
        file_path = os.path.join(AVATARS_DIR, f"avatar{idx+1}.svg")
        
        svg_content = f"""<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad{idx+1}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="50" fill="url(#grad{idx+1})"/>
  <text x="50" y="58" fill="#ffffff" font-family="'Outfit', 'Inter', sans-serif" font-weight="bold" font-size="28" text-anchor="middle">{initial}</text>
</svg>"""

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
            
    # Generate generic placeholder avatar
    placeholder_path = os.path.join(ASSETS_DIR, "placeholder-avatar.png")
    if not os.path.exists(placeholder_path):
        # We write a simple SVG representing a profile placeholder
        svg_placeholder = """<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="#1e2030"/>
  <circle cx="50" cy="40" r="18" fill="#6b7280"/>
  <path d="M 22 82 C 22 62, 78 62, 78 82 Z" fill="#6b7280"/>
</svg>"""
        with open(os.path.join(ASSETS_DIR, "placeholder-avatar.png"), "w") as f:
            f.write(svg_placeholder)

def copy_reels_videos():
    """Copies video files from the Downloads folder to the local static/assets/reels folder."""
    print("Importing video reels from Downloads...")
    for filename, target_name in REELS_MAPPING.items():
        src_path = os.path.join(DOWNLOADS_DIR, filename)
        dest_path = os.path.join(REELS_DIR, target_name)
        
        if os.path.exists(src_path):
            if not os.path.exists(dest_path):
                print(f"  Copying {filename} -> {target_name}...")
                try:
                    shutil.copy(src_path, dest_path)
                except Exception as e:
                    print(f"  Failed to copy {filename}: {e}")
            else:
                print(f"  {target_name} already exists.")
        else:
            print(f"  Warning: Source video {filename} not found in Downloads. Creating dummy video stub.")
            # If missing, create an empty stub to prevent file not found errors
            if not os.path.exists(dest_path):
                with open(dest_path, "w") as f:
                    f.write("")

def start_server():
    """Starts the Flask server."""
    print("Launching Flask application...")
    subprocess.run(["python", "-m", "backend.app"], cwd=BASE_DIR)

if __name__ == "__main__":
    setup_directories()
    generate_svg_avatars()
    start_server()
