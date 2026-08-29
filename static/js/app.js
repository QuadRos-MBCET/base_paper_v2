// API configuration for cross-origin hosting
const API_BASE = window.location.hostname.includes("github.io") 
    ? "https://base-paper-v2.onrender.com" 
    : "";

// State variables
let userType = "adult"; // "adult" or "child"
let username = "demo_user";
let activeTab = "home";
let loadedPosts = [];

let savedPostIds = new Set();
let likedPostIds = new Set();

// Initialize application on load
window.addEventListener("DOMContentLoaded", () => {
    checkSession();
    setupEventListeners();
});

// Check if user session is active
function checkSession() {
    const sessionUserType = sessionStorage.getItem("user_type");
    const sessionUsername = sessionStorage.getItem("username");
    
    if (sessionUserType && sessionUsername) {
        userType = sessionUserType;
        username = sessionUsername;
        showApp();
    } else {
        showLogin();
    }
}

// Display login screen
function showLogin() {
    document.getElementById("login-screen").classList.add("active");
    document.getElementById("main-app").classList.remove("active");
}

// Display main application dashboard
function showApp() {
    document.getElementById("login-screen").classList.remove("active");
    document.getElementById("main-app").classList.add("active");
    
    // Update profile and header tags
    document.getElementById("header-user-type-tag").innerText = userType === "adult" ? "Adult Account" : "Child Account";
    document.getElementById("profile-username-val").innerText = username;
    document.getElementById("profile-account-tag-val").innerText = userType === "adult" ? "Adult Profile" : "Child Profile";
    
    // Set profile avatar deterministically
    const avatarIdx = (username.length % 10) + 1;
    document.getElementById("profile-avatar-img").src = `static/assets/avatars/avatar${avatarIdx}.svg`;

    // Fetch and load data
    loadFeed();
    loadStories();
    loadNotifications();
}

// Demo user credentials mapping with real-life names
const CREDENTIALS = {
    "emily_smith": { password: "child123", type: "child" },
    "jacob_jones": { password: "child123", type: "child" },
    "sophia_lee": { password: "child123", type: "child" },
    "john_doe": { password: "adult123", type: "adult" },
    "sarah_miller": { password: "adult123", type: "adult" },
    "michael_brown": { password: "adult123", type: "adult" }
};

// Handle login submit
function handleLogin() {
    const userInput = document.getElementById("username-input").value.trim();
    const passInput = document.getElementById("password-input").value.trim();
    const errorEl = document.getElementById("login-error-msg");
    
    if (userInput in CREDENTIALS && CREDENTIALS[userInput].password === passInput) {
        username = userInput;
        userType = CREDENTIALS[userInput].type;
        sessionStorage.setItem("user_type", userType);
        sessionStorage.setItem("username", username);
        if (errorEl) errorEl.style.display = "none";
        showApp();
    } else {
        if (errorEl) errorEl.style.display = "block";
    }
}

// Handle logout and clean up state
function handleLogout() {
    sessionStorage.clear();
    
    // Clear in-memory caches to prevent state bleed between accounts
    loadedPosts = [];
    failedPostIds.clear();
    if (window.likedPostIds) window.likedPostIds.clear();
    if (window.savedPostIds) window.savedPostIds.clear();
    
    // Clear DOM content
    const feedContainer = document.getElementById("posts-feed-container");
    if (feedContainer) feedContainer.innerHTML = "";
    
    const searchGrid = document.getElementById("search-results-container");
    if (searchGrid) searchGrid.innerHTML = "";
    
    const profileGrid = document.getElementById("profile-grid-container");
    if (profileGrid) profileGrid.innerHTML = "";
    
    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.value = "";
    
    const scannerResult = document.getElementById("scanner-result");
    if (scannerResult) {
        scannerResult.innerHTML = "";
        scannerResult.style.display = "none";
    }
    const scannerPreview = document.getElementById("scanner-preview-img");
    if (scannerPreview) {
        scannerPreview.src = "";
        scannerPreview.style.display = "none";
    }
    const scannerPlaceholder = document.getElementById("scanner-upload-placeholder");
    if (scannerPlaceholder) {
        scannerPlaceholder.style.display = "block";
    }
    const scannerText = document.getElementById("scanner-text-input");
    if (scannerText) scannerText.value = "";
    
    showLogin();
}

// Tab navigation handler
function switchTab(tabId) {
    activeTab = tabId;
    
    // Update navigation buttons
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.toggle("active", btn.id === `nav-btn-${tabId}`);
    });
    
    // Update panels
    document.querySelectorAll(".tab-panel").forEach(panel => {
        panel.classList.toggle("active", panel.id === `tab-${tabId}`);
    });
    
    // Scroll content to top
    document.querySelector(".app-main-content").scrollTop = 0;
    
    // Specific tab activations
    if (tabId === "profile") {
        renderProfilePosts();
    } else if (tabId === "search") {
        renderSearchGrid(loadedPosts);
    }
}

// Setup global event listeners
function setupEventListeners() {
    // Reels scroll listener has been removed
}

// Fetch and load posts for Home feed
async function loadFeed() {
    const feedContainer = document.getElementById("posts-feed-container");
    feedContainer.innerHTML = `
        <div class="reel-analysis-loader" style="position:relative; height: 200px; background:transparent;">
            <div class="loader-spinner"></div>
            <p style="color:var(--text-secondary); font-size:0.85rem;">Retrieving feed posts...</p>
        </div>
    `;

    try {
        const response = await fetch(API_BASE + "/api/posts");
        const allFetchedPosts = await response.json();
        
        // Map real-life demo usernames to indices 0-5
        const userNamesList = ["emily_smith", "jacob_jones", "sophia_lee", "john_doe", "sarah_miller", "michael_brown"];
        const uIdx = userNamesList.indexOf(username);
        const userIndex = uIdx !== -1 ? uIdx : 0;
        
        // Partition/Filter posts: each account gets a unique subset based on post ID modulo 6
        // This ensures every account has a completely unique set of posts!
        loadedPosts = allFetchedPosts.filter(post => {
            const numericId = parseInt(post.id) || 0;
            return (numericId % 6) === userIndex;
        });
        
        feedContainer.innerHTML = "";
        
        if (loadedPosts.length === 0) {
            feedContainer.innerHTML = `<div style="text-align:center; padding: 40px; color:var(--text-secondary);">No feed posts available.</div>`;
            return;
        }

        loadedPosts.forEach(post => {
            renderPostCard(post, feedContainer);
        });
    } catch (e) {
        console.error("Failed to load feed:", e);
        feedContainer.innerHTML = `<div style="text-align:center; padding: 40px; color:var(--accent-red);">Failed to retrieve feed. Please check server connection.</div>`;
    }
}

// Track post IDs whose image files failed to load
const failedPostIds = new Set();

// Render an individual post card and invoke its moderation analysis
async function renderPostCard(post, container) {
    // If the post has no image path, or has already failed to load, skip it entirely
    if (!post.image_path || failedPostIds.has(post.id)) {
        return;
    }

    const card = document.createElement("div");
    card.className = "post-card glass-card";
    card.id = `post-${post.id}`;
    
    const mediaUrl = `${API_BASE}/api/media/${post.image_path}`;
    const mediaHtml = `<img id="media-img-${post.id}" src="${mediaUrl}" alt="Post Media" class="post-media" onerror="handleImageLoadError(this, '${post.id}')">`;

    card.innerHTML = `
        <div class="post-header">
            <div class="post-user-info">
                <img src="${post.user_avatar}" alt="Avatar" class="post-avatar">
                <span class="post-username font-outfit">${post.username}</span>
            </div>
            <div class="post-header-badges" id="badges-${post.id}">
                <span class="mod-badge" style="background:rgba(255,255,255,0.05); color:var(--text-muted); border:1px solid var(--border-glass);">
                    AI Analyzing...
                </span>
            </div>
        </div>
        
        <div class="post-media-container" id="media-container-${post.id}">
            ${mediaHtml}
            <div class="post-overlay-layer" id="overlay-${post.id}"></div>
        </div>
        
        <div class="post-actions">
            <div class="actions-left">
                <button class="action-btn" id="like-btn-${post.id}" onclick="toggleLike('${post.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </button>
                <button class="action-btn" onclick="focusCommentInput('${post.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </button>
            </div>
            <button class="action-btn" id="bookmark-btn-${post.id}" onclick="toggleBookmark('${post.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </button>
        </div>
        
        <div class="post-details font-inter">
            <span class="likes-count font-outfit" id="likes-count-${post.id}">${post.likes} likes</span>
            
            <!-- Inline Warning block (rendered dynamically if hateful is dismissed) -->
            <div id="inline-warn-${post.id}"></div>
            
            <p class="post-caption">
                <span class="post-caption-user font-outfit">${post.username}</span>${post.text}
            </p>
            
            <div class="post-comments-summary" onclick="showAllComments('${post.id}')">
                View all ${post.comments.length} comments
            </div>
            
            <div class="post-comments-list" id="comments-list-${post.id}">
                ${post.comments.slice(0, 2).map(c => `
                    <div class="post-comment-item">
                        <span class="comment-user font-outfit">${c.username}</span>${c.text}
                    </div>
                `).join("")}
            </div>
            
            <!-- Add comment field -->
            <div style="display:flex; margin-top:10px; border-top:1px solid var(--border-glass); padding-top:10px;">
                <input type="text" id="comment-input-${post.id}" placeholder="Add a comment..." class="glass-input" style="padding:8px 12px; font-size:0.8rem; flex:1;" onkeydown="handleAddComment(event, '${post.id}')">
            </div>
        </div>
    `;

    // Before appending, check if image load failure was triggered synchronously
    if (card.classList.contains("image-load-failed")) {
        return;
    }

    container.appendChild(card);
    
    // Check one more time after append
    if (card.classList.contains("image-load-failed")) {
        card.remove();
        return;
    }
    
    // Call the backend moderation pipeline asynchronously
    analyzePostContent(post);
}

// Fallback image error handler: if the dataset image fails to load, remove the post completely from feeds and search grids
function handleImageLoadError(imgEl, postId) {
    failedPostIds.add(postId);
    
    // Mark memory card to prevent append, or remove if already in DOM
    const card = imgEl ? imgEl.closest(".post-card") : null;
    if (card) {
        card.classList.add("image-load-failed");
        card.remove();
    }
    
    const postCard = document.getElementById(`post-${postId}`);
    if (postCard) {
        postCard.remove();
    }
    
    // Filter out from memory registry to avoid showing in Search and Profile grids
    loadedPosts = loadedPosts.filter(p => p.id !== postId);
    
    // Update profile posts count if profile is rendered
    const countEl = document.getElementById("profile-posts-count");
    if (countEl) {
        const userPosts = loadedPosts.filter(p => p.username === username);
        countEl.innerText = userPosts.length;
    }
}

// Execute Stage 1 and Stage 2 Moderation Analysis
async function analyzePostContent(post) {
    const badgeContainer = document.getElementById(`badges-${post.id}`);
    const overlayContainer = document.getElementById(`overlay-${post.id}`);
    
    try {
        const response = await fetch(API_BASE + "/api/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                post_id: post.id,
                image_path: post.image_path,
                text: post.text
            })
        });
        
        const data = await response.json();
        
        // Cache API prediction results directly in our array for search and profiles
        post.prediction = data.prediction;
        post.confidence = data.confidence;
        post.age_category = data.age_category;
        post.reason = data.reason;
        
        // Update header safety badge with confidence scores
        badgeContainer.innerHTML = "";
        
        if (data.prediction === "Hateful") {
            // Render Hateful badge
            badgeContainer.innerHTML = `<span class="mod-badge hateful">🔴 HATEFUL (${Math.round(data.confidence * 100)}%)</span>`;
            
            // Apply Hateful Content Warning overlay
            overlayContainer.innerHTML = `
                <div class="hateful-overlay-banner" id="hateful-banner-${post.id}">
                    <svg class="overlay-warning-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <h3 class="hateful-title font-outfit">HATEFUL CONTENT</h3>
                    <p class="hateful-desc font-inter">This post was flagged as potentially sensitive by our AI safety moderation engine.</p>
                    <div class="hateful-reason-box font-inter">
                        <strong>Reason:</strong> ${data.reason}
                    </div>
                    <button class="btn-overlay-dismiss font-outfit" onclick="dismissHatefulOverlay('${post.id}')">View Content</button>
                </div>
            `;
            
        } else {
            // SAFE CONTENT -> Process Stage 2 Age-Access categories
            if (data.age_category === "Adult Only") {
                badgeContainer.innerHTML = `<span class="mod-badge safe-adult">🟠 ADULT ONLY (${Math.round(data.confidence * 100)}%)</span>`;
                
                if (userType === "child") {
                    // For Child session: Apply blur + lock overlay (no bypass)
                    overlayContainer.innerHTML = `
                        <div class="child-lock-overlay">
                            <svg class="lock-icon-svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <h3 class="lock-title font-outfit">Content Restricted</h3>
                            <p class="lock-desc font-inter">This content is marked as Adult Only and is restricted for accounts under 18 years of age.</p>
                            <span class="lock-badge font-outfit">Restricted Content</span>
                        </div>
                    `;
                    // Blur the actual media object itself
                    const mediaElement = document.getElementById(`media-img-${post.id}`) || document.getElementById(`media-container-${post.id}`).querySelector(".text-meme-fallback");
                    if (mediaElement) {
                        mediaElement.style.filter = "blur(30px) grayscale(0.5)";
                    }
                }
            } else {
                // Child Friendly
                badgeContainer.innerHTML = `<span class="mod-badge safe-child">🟢 SAFE (${Math.round(data.confidence * 100)}%)</span>`;
            }
        }
    } catch (e) {
        console.error(`Inference analysis failed for post ${post.id}:`, e);
        badgeContainer.innerHTML = `<span class="mod-badge" style="color:var(--accent-red);">Inference Failed</span>`;
    }
}

// Dismiss the hateful overlay banner to allow viewing
function dismissHatefulOverlay(postId) {
    const banner = document.getElementById(`hateful-banner-${postId}`);
    if (banner) {
        banner.classList.add("dismissed");
        setTimeout(() => banner.remove(), 300);
    }
    
    // Find the post and render an inline warning text above description
    const post = loadedPosts.find(p => p.id === postId);
    if (post) {
        const inlineContainer = document.getElementById(`inline-warn-${postId}`);
        if (inlineContainer) {
            inlineContainer.innerHTML = `
                <div class="post-dismissed-warning font-inter">
                    <strong>⚠ AI Flagged:</strong> ${post.reason || "Flagged as hateful content."}
                </div>
            `;
        }
    }
}


// Focus on comment box
function focusCommentInput(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (input) input.focus();
}

// Handle adding comment
function handleAddComment(event, postId) {
    if (event.key !== "Enter") return;
    
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;
    
    const list = document.getElementById(`comments-list-${postId}`);
    const commentItem = document.createElement("div");
    commentItem.className = "post-comment-item";
    commentItem.innerHTML = `<span class="comment-user font-outfit">${username}</span>${text}`;
    
    list.appendChild(commentItem);
    input.value = "";
    
    // Update local comments list
    const post = loadedPosts.find(p => p.id === postId);
    if (post) {
        post.comments.push({ username, text });
        document.querySelector(`#post-${postId} .post-comments-summary`).innerText = `View all ${post.comments.length} comments`;
    }
}

// Toggle like for standard post card
function toggleLike(postId) {
    const btn = document.getElementById(`like-btn-${postId}`);
    const countEl = document.getElementById(`likes-count-${postId}`);
    const post = loadedPosts.find(p => p.id === postId);
    if (!post) return;
    
    const isLiked = btn.classList.toggle("liked");
    post.likes = isLiked ? (post.likes + 1) : (post.likes - 1);
    countEl.innerText = `${post.likes} likes`;
    
    if (isLiked) {
        likedPostIds.add(postId);
    } else {
        likedPostIds.delete(postId);
    }
}

// Toggle bookmarks
function toggleBookmark(postId) {
    const btn = document.getElementById(`bookmark-btn-${postId}`);
    const isBookmarked = btn.classList.toggle("bookmarked");
    
    if (isBookmarked) {
        savedPostIds.add(postId);
    } else {
        savedPostIds.delete(postId);
    }
}

// Client-side search filters existing loaded posts on caption, username, and hashtags
function handleSearch(event) {
    const query = document.getElementById("search-input").value.trim().toLowerCase();
    
    if (!query) {
        renderSearchGrid(loadedPosts);
        return;
    }
    
    const filtered = loadedPosts.filter(post => {
        return post.username.toLowerCase().includes(query) ||
               post.text.toLowerCase().includes(query) ||
               (query.startsWith("#") && post.text.toLowerCase().includes(query));
    });
    
    renderSearchGrid(filtered);
}

// Render search explorer posts grid
function renderSearchGrid(posts) {
    const container = document.getElementById("search-results-container");
    container.innerHTML = "";
    
    if (posts.length === 0) {
        container.innerHTML = `<div class="search-no-results font-inter">No results found matching your search parameters.</div>`;
        return;
    }
    
    posts.forEach(post => {
        // Evaluate if post should be blurred for child accounts
        const isRestrictedChild = userType === "child" && post.prediction === "Not Hateful" && post.age_category === "Adult Only";
        const isHateful = post.prediction === "Hateful";
        
        let gridMedia = "";
        let blurStyle = isRestrictedChild ? 'style="filter: blur(15px);"' : '';
        
        if (post.image_path) {
            gridMedia = `<img src="${API_BASE}/api/media/${post.image_path}" class="search-grid-image" ${blurStyle}>`;
        } else {
            gridMedia = `
                <div class="text-meme-fallback" style="padding: 10px; font-size:0.6rem; ${isRestrictedChild ? 'filter: blur(15px);' : ''}">
                    ${post.text.slice(0, 40)}...
                </div>
            `;
        }
        
        // Banners/icon tags overlay in grid
        let iconHtml = "";
        if (isRestrictedChild) {
            iconHtml = `
                <div class="search-grid-overlay-icon" title="Restricted Content">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
            `;
        } else if (isHateful) {
            iconHtml = `
                <div class="search-grid-overlay-icon" style="color:var(--accent-red); background:rgba(0,0,0,0.8);" title="Hateful Content Flag">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    </svg>
                </div>
            `;
        }
        
        const item = document.createElement("div");
        item.className = "search-grid-item";
        item.innerHTML = `
            ${gridMedia}
            ${iconHtml}
        `;
        
        // Clicking on search item navigates home and scrolls to target post card
        item.onclick = () => {
            switchTab("home");
            setTimeout(() => {
                const card = document.getElementById(`post-${post.id}`);
                if (card) {
                    card.scrollIntoView({ behavior: "smooth", block: "center" });
                    card.style.outline = "2px solid var(--accent-purple)";
                    setTimeout(() => card.style.outline = "none", 2000);
                }
            }, 100);
        };
        
        container.appendChild(item);
    });
}

// Render profile posts grid (normal posts vs bookmarked/saved posts)
let profileActiveTab = "posts";

function switchProfileTab(tab) {
    profileActiveTab = tab;
    document.getElementById("profile-btn-posts").classList.toggle("active", tab === "posts");
    document.getElementById("profile-btn-saved").classList.toggle("active", tab === "saved");
    renderProfilePosts();
}

function renderProfilePosts() {
    const container = document.getElementById("profile-grid-container");
    container.innerHTML = "";
    
    // Filter posts: either posts owned by user (dummy owned list) or saved posts
    let postsToRender = [];
    if (profileActiveTab === "posts") {
        // Show a subset of loaded posts as "user posts" for display
        postsToRender = loadedPosts.slice(0, 6);
        document.getElementById("profile-posts-count").innerText = postsToRender.length;
    } else {
        // Show bookmarked items
        postsToRender = loadedPosts.filter(p => savedPostIds.has(p.id));
    }
    
    if (postsToRender.length === 0) {
        container.innerHTML = `<div class="search-no-results font-inter" style="grid-column: 1/-1;">No posts to display in this gallery.</div>`;
        return;
    }
    
    postsToRender.forEach(post => {
        const isRestrictedChild = userType === "child" && post.prediction === "Not Hateful" && post.age_category === "Adult Only";
        
        let gridMedia = "";
        let blurStyle = isRestrictedChild ? 'style="filter: blur(15px);"' : '';
        
        if (post.image_path) {
            gridMedia = `<img src="${API_BASE}/api/media/${post.image_path}" class="profile-grid-image" ${blurStyle}>`;
        } else {
            gridMedia = `
                <div class="text-meme-fallback" style="padding: 10px; font-size:0.6rem; ${isRestrictedChild ? 'filter: blur(15px);' : ''}">
                    ${post.text.slice(0, 40)}...
                </div>
            `;
        }
        
        const item = document.createElement("div");
        item.className = "profile-grid-item";
        item.innerHTML = gridMedia;
        
        item.onclick = () => {
            switchTab("home");
            setTimeout(() => {
                const card = document.getElementById(`post-${post.id}`);
                if (card) {
                    card.scrollIntoView({ behavior: "smooth", block: "center" });
                    card.style.outline = "2px solid var(--accent-purple)";
                    setTimeout(() => card.style.outline = "none", 2000);
                }
            }, 100);
        };
        
        container.appendChild(item);
    });
}

// Generate circular dummy stories row
function loadStories() {
    const row = document.getElementById("stories-row-container");
    row.innerHTML = "";
    
    // Load users as story icons
    const storyUsers = USERNAMES.slice(4, 12);
    
    storyUsers.forEach((user, idx) => {
        const item = document.createElement("div");
        item.className = "story-item";
        item.innerHTML = `
            <div class="story-avatar-ring" id="story-ring-${idx}">
                <img src="static/assets/avatars/avatar${idx+1}.svg" class="story-avatar">
            </div>
            <span class="story-username">${user}</span>
        `;
        
        // Show mock story display popup
        item.onclick = () => {
            document.getElementById(`story-ring-${idx}`).classList.add("viewed");
            showMockStoryModal(user, `static/assets/avatars/avatar${idx+1}.svg`);
        };
        
        row.appendChild(item);
    });
}

// Display temporary story popup modal
function showMockStoryModal(username, avatarUrl) {
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.background = "rgba(0,0,0,0.95)";
    modal.style.zIndex = "100";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.color = "white";
    
    // Clean layout
    modal.innerHTML = `
        <div style="width:100%; max-width:420px; display:flex; align-items:center; justify-content:space-between; padding:20px;">
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${avatarUrl}" style="width:36px; height:36px; border-radius:50%; border:2px solid var(--accent-purple);">
                <span class="font-outfit" style="font-weight:700;">${username}</span>
            </div>
            <button style="background:transparent; border:none; color:white; font-size:1.5rem; cursor:pointer;" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
        
        <div style="flex:1; width:100%; max-width:420px; max-height: 600px; display:flex; justify-content:center; align-items:center; overflow:hidden; border-radius:16px;">
            <!-- Beautiful graphic pattern background as story content -->
            <div class="text-meme-fallback" style="font-size:1.6rem; padding: 40px; height: 100%; border-radius:16px;">
                "Life is what happens when you're busy making other plans." 🌸✨
            </div>
        </div>
        
        <div style="width:100%; height:4px; background:rgba(255,255,255,0.2); max-width:400px; margin-bottom: 20px; border-radius:2px; overflow:hidden;">
            <div id="story-progress" style="height:100%; width:0%; background:var(--accent-purple);"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate progress bar
    let progress = 0;
    const interval = setInterval(() => {
        progress += 1;
        const progressEl = modal.querySelector("#story-progress");
        if (progressEl) {
            progressEl.style.width = `${progress}%`;
        }
        if (progress >= 100) {
            clearInterval(interval);
            modal.remove();
        }
    }, 30); // ~3 seconds total
    
    // If modal is dismissed, clear interval
    modal.onclick = (e) => {
        if (e.target === modal || e.target.tagName === "BUTTON") {
            clearInterval(interval);
            modal.remove();
        }
    };
}

// Generate dummy notifications list
function loadNotifications() {
    const list = document.getElementById("notifications-list-container");
    list.innerHTML = "";
    
    const notifications = [
        { type: "like", user: "nature_lens", time: "2m", text: "liked your post." },
        { type: "comment", user: "cyber_punk", time: "15m", text: "commented: 'Excellent analysis workflow!'" },
        { type: "flag", user: "AegisSentry AI", time: "1h", text: "completed evaluation on 50 local dataset posts." },
        { type: "like", user: "alex_explorer", time: "3h", text: "liked your comment." },
        { type: "follow", user: "design_guru", time: "1d", text: "started following you." }
    ];
    
    notifications.forEach((notif, idx) => {
        const item = document.createElement("div");
        item.className = "notification-item font-inter";
        
        // Generate circular avatars
        const avatarUrl = notif.user === "AegisSentry AI" ? "static/assets/logo.png" : `static/assets/avatars/avatar${(idx % 10) + 1}.svg`;
        
        item.innerHTML = `
            <img src="${avatarUrl}" alt="Avatar" class="notification-avatar" onerror="this.src='static/assets/placeholder-avatar.png'">
            <div class="notification-body">
                <span class="notification-user font-outfit">${notif.user}</span> ${notif.text}
                <span class="notification-time">${notif.time}</span>
            </div>
        `;
        list.appendChild(item);
    });
}

// Utility: Debouncer for event optimizations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Click trigger for file input in AI Scanner
function triggerFileInput() {
    document.getElementById("scanner-file-input").click();
}

// Handle file selection in AI Scanner and show a preview
function handleScannerFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const previewImg = document.getElementById("scanner-preview-img");
        const placeholder = document.getElementById("scanner-upload-placeholder");
        
        previewImg.src = e.target.result;
        previewImg.style.display = "block";
        placeholder.style.display = "none";
    };
    reader.readAsDataURL(file);
}

// Run analysis on custom uploaded image and text overlay
async function runScannerAnalysis() {
    const fileInput = document.getElementById("scanner-file-input");
    const textInput = document.getElementById("scanner-text-input");
    const resultContainer = document.getElementById("scanner-result");
    
    const file = fileInput.files[0];
    const text = textInput.value.trim();
    
    if (!file) {
        alert("Please select an image file to analyze.");
        return;
    }
    
    resultContainer.innerHTML = `
        <div class="reel-analysis-loader" style="position:relative; height: 100px; background:transparent;">
            <div class="loader-spinner"></div>
            <p style="color:var(--text-secondary); font-size:0.8rem; margin-top:8px;">Running Multimodal AI Assessment...</p>
        </div>
    `;
    resultContainer.style.display = "block";
    
    const formData = new FormData();
    formData.append("image", file);
    formData.append("text", text);
    
    try {
        const response = await fetch(API_BASE + "/api/predict_custom", {
            method: "POST",
            body: formData
        });
        
        const data = await response.json();
        
        // Render beautiful scanner result report card
        let badgeHtml = "";
        let overlayStyle = "";
        let explanationText = data.reason || "Evaluated safe under standard criteria.";
        
        if (data.prediction === "Hateful") {
            badgeHtml = `<span class="mod-badge badge-hateful font-outfit" style="font-size: 0.85rem; padding: 6px 12px;">🔴 HATEFUL CONTENT</span>`;
            overlayStyle = `border-left: 4px solid var(--accent-red); background: rgba(239, 68, 68, 0.05);`;
        } else {
            if (data.age_category === "Adult Only") {
                badgeHtml = `<span class="mod-badge badge-adult font-outfit" style="font-size: 0.85rem; padding: 6px 12px;">🟠 ADULT ONLY (${Math.round(data.confidence * 100)}%)</span>`;
                overlayStyle = `border-left: 4px solid var(--accent-pink); background: rgba(255, 107, 107, 0.05);`;
                if (userType === "child") {
                    explanationText += " (Note: This content would be BLURRED & LOCKED on child accounts).";
                }
            } else {
                badgeHtml = `<span class="mod-badge badge-safe font-outfit" style="font-size: 0.85rem; padding: 6px 12px;">🟢 SAFE (${Math.round(data.confidence * 100)}%)</span>`;
                overlayStyle = `border-left: 4px solid var(--accent-purple); background: rgba(168, 85, 247, 0.05);`;
            }
        }
        
        let ocrBannerHtml = "";
        if (data.ocr_text && !text) {
            ocrBannerHtml = `
                <div class="font-inter" style="font-size: 0.75rem; color: var(--text-secondary); background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: 6px; padding: 8px 10px; margin-bottom: 12px; line-height: 1.4;">
                    🔍 <strong>Auto-Detected Text:</strong> "${data.ocr_text}"
                </div>
            `;
        }

        resultContainer.innerHTML = `
            <div style="padding: 10px; border-radius: 8px; ${overlayStyle}">
                ${ocrBannerHtml}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span class="font-outfit" style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary);">Moderation Report</span>
                    ${badgeHtml}
                </div>
                <div class="font-inter" style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 8px;">
                    <strong>AI Decision:</strong> ${data.prediction} (Confidence: ${Math.round(data.confidence * 100)}%)
                </div>
                <div class="font-inter" style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5;">
                    <strong>Explainable AI Reasoning:</strong> ${explanationText}
                </div>
            </div>
        `;
        
    } catch (e) {
        console.error("Scanner analysis failed:", e);
        resultContainer.innerHTML = `
            <div style="color: var(--accent-red); font-size: 0.8rem; padding: 10px; border-left: 4px solid var(--accent-red);">
                Failed to execute analysis. Please verify your connection to the server.
            </div>
        `;
    }
}
