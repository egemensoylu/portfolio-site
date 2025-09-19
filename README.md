# egemensoylu.com — Cinematic Scroll Experience 🎬

A film-like, scroll-driven portfolio for **Egemen Soylu**. Each section is a full-screen scene with lateral/vertical transitions, parallax layers, and subtle sound cues. Built with **raw HTML/CSS/JS** for tight control.

## ✨ Core Features
- 🎥 **Full-bleed, page-per-scene videos** (hero sequences per section)
- 🌀 **Scroll orchestration** with IntersectionObserver + rAF
- 🧭 **Lateral + vertical transitions** and parallax depth
- 🔊 Optional **sound cues** synced to scene thresholds
- 📱 **Responsive** layouts, film-grade typography & motion

## 🧩 Tech & Patterns
- **Vanilla** HTML/CSS/JS (no heavy framework)
- **IntersectionObserver** for scene entry/exit
- **requestAnimationFrame** for smooth parallax
- **Lazy loading** (`loading="lazy"`, `preload`/`preconnect`)
- Video formats: **MP4 (H.264)** + **WebM** fallbacks
- Deploy: **S3 + CloudFront** (cache, range requests, CORS)

## 🚀 Local Dev
```bash
git clone https://github.com/egemensoylu/portfolio-site.git
cd portfolio-site
python3 -m http.server
