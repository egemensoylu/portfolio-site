# egemensoylu.com — Cinematic Scroll Experience 🎬

A film-like, scroll-driven portfolio for **Egemen Soylu**.  
Each section is a full-screen scene with lateral/vertical transitions, parallax depth, and cinematic flow. Built with **raw HTML/CSS/JS** for maximum control.

---

## ✨ Core Features
- 🎥 **Full-bleed, page-per-scene videos** (hero sequences per section)  
- 🌀 **Scroll orchestration** with IntersectionObserver + requestAnimationFrame  
- 🧭 **Lateral + vertical transitions** and parallax effects  
- 🔊 **Sound cues** synced to scene thresholds (optional)  
- 📱 **Responsive** layouts, film-grade typography & motion  

---

## 🧩 Tech & Patterns
- **Vanilla HTML/CSS/JS** (no heavy frameworks)  
- **IntersectionObserver** for scene entry/exit detection  
- **requestAnimationFrame** for smooth parallax + animations  
- **Lazy loading** (`loading="lazy"`, `preload`/`preconnect`)  
- Video formats: **MP4 (H.264)** + **WebM** fallbacks  
- Deployment: **AWS S3 + CloudFront** (caching, range requests, CORS)  

---

## 🚀 Local Development
Clone the repository and serve locally:

```bash
git clone https://github.com/egemensoylu/portfolio-site.git
cd portfolio-site
python3 -m http.server
```

--- 

## 🧪 Performance Checklist
- Poster frames for all videos (poster="")
- Short loop “idle” cuts; defer long masters until in-view
- playsinline + muted autoplay for mobile support
- preload="metadata" and swap to full load on intersect
- Compress with ffmpeg (-crf 23 -preset veryslow -movflags +faststart)
- Serve via CloudFront with cache-busting filenames

---
## 📸 Preview

-- Add screenshots or short demo videos here:
-- docs/preview.png / docs/preview.mp4


## 🗺️ Project Structure (example)

/assets
  /video     # scene_*.mp4/.webm + poster images
  /img
  /fonts
/css
/js
index.html
scenes.html



## 🔮 Future Plans
- 📝 Blog section (articles on creativity, tech, and film)
- 🗂 Dynamic portfolio (from raw HTML → CMS or Next.js + Django API)
- 🌐 Multilingual support (EN / TR / SV)
- 🔔 Push notifications (web + mobile webview integration)
- 🎛️ Scene editor for timing & thresholds (JSON-driven)
-🗄️ Admin panel + database backend (content management & analytics)
- 🎨 Design tokens for themes (film stocks, LUT-inspired palettes)


## 🏷️ Topics / Tags

portfolio-website scroll-animation parallax vanilla-js creative-coding full-screen-video cinematic



## 📄 License

This project is licensed under the GNU General Public License (GPL).
See the LICENSE file for details.

© Egemen Soylu