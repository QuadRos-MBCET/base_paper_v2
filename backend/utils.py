import csv
import os
import random
from backend.config import DATASET_DIR

# Hardcoded list of usernames and captions to assign randomly/deterministically
USERNAMES = [
    "alex_explorer", "nature_lens", "pixel_craft", "design_guru", "echo_chamber",
    "shadow_light", "quantum_leap", "urban_vibes", "nomad_writer", "cyber_punk",
    "neon_glow", "alpha_mind", "beta_tester", "gamma_ray", "delta_force",
    "omega_prime", "haze_gazer", "retro_wave", "pixel_perfect", "silent_owl"
]

ADULT_KEYWORDS = [
    "drunk", "drink", "kiss", "sexy", "kill", "gun", "police", "fight", "war",
    "blood", "riot", "dumb", "stupid", "idiot", "fat", "ugly", "beer", "wine",
    "alcohol", "bitch", "ass", "naked", "sex", "mature", "explicit", "nudity",
    "violence", "murder", "weapons", "drugs", "smoke", "abuse", "dating",
    "blow job", "blowjob", "porn", "g-spot", "boobs", "dick", "chicks", "condom",
    "pill", "adult", "nsfw", "sasha", "grey", "nude", "virgin"
]

def get_age_category(text, label):
    """
    Categorizes Not Hateful posts as Child Friendly or Adult Only.
    Hateful posts do not get an age category.
    """
    if str(label) == "1":
        return None
        
    if not text or not text.strip():
        return "Child Friendly"
    
    text_lower = text.lower()
    for kw in ADULT_KEYWORDS:
        if kw in text_lower:
            return "Adult Only"
            
    # Stable character code sum to ensure determinism across Python sessions
    h = sum(ord(c) for c in text) % 10
    if h in [0, 1, 2]: # 30% default Adult Only
        return "Adult Only"
    return "Child Friendly"

def load_all_posts():
    """
    Loads posts from fhm_dataset.csv only and standardizes the columns:
    id, username, user_avatar, image_path, text, true_label, age_category, likes, comments
    """
    posts = []
    
    # Load FHM Dataset
    fhm_path = os.path.join(DATASET_DIR, "fhm_dataset.csv")
    if os.path.exists(fhm_path):
        with open(fhm_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                pid = row['id']
                # Block graphic, nude, or highly inappropriate posts from the demo
                if pid in ["01423", "14072", "26543"]:
                    continue
                label = int(row['label'])
                text = row['text']
                img_path = row['image_path'] # e.g. "img/42953.png"
                
                # Deterministic random generation using ID as seed
                random.seed(int(pid))
                username = USERNAMES[int(pid) % len(USERNAMES)]
                avatar_idx = (int(pid) % 10) + 1
                avatar = f"/static/assets/avatars/avatar{avatar_idx}.svg"
                likes = random.randint(10, 1500)
                
                age_cat = get_age_category(text, label)
                
                posts.append({
                    "id": pid,
                    "dataset": "fhm",
                    "username": username,
                    "user_avatar": avatar,
                    "image_path": img_path,
                    "text": text,
                    "true_label": label,
                    "age_category": age_cat,
                    "likes": likes,
                    "comments": generate_comments(pid)
                })
                
    return posts

def generate_comments(seed_str):
    """Generates a list of dummy comments for a post based on a seed."""
    comments_pool = [
        "So true! Thanks for sharing this.",
        "I don't think this is correct...",
        "Interesting visual metaphor here.",
        "Wow, outstanding design!",
        "This is really making me think.",
        "Could someone explain this to me?",
        "Beautifully captured.",
        "A bit controversial but interesting.",
        "Spot on!",
        "Exactly what I was looking for today."
    ]
    
    random.seed(hash(seed_str))
    num_comments = random.randint(0, 4)
    selected = random.sample(comments_pool, min(num_comments, len(comments_pool)))
    
    comments = []
    for comment_text in selected:
        commenter = USERNAMES[random.randint(0, len(USERNAMES)-1)]
        comments.append({
            "username": commenter,
            "text": comment_text
        })
    return comments
