document.addEventListener('DOMContentLoaded', () => {
    // ==============================
    // 1) Intersection Observer → Section Title/Content görünür olunca animasyon ekle
    // ==============================
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.section-title, .section-content').forEach(el => {
        observer.observe(el);
    });

    // ==============================
    // 2) Scroll sırasında film overlay hız efekti
    //    (px birimi + transform; idle drift + scroll anında hızlanma; periyot modlu)
    // ==============================
    const viewport = document.querySelector('.viewport-frame');
    const filmOverlay = document.querySelector('.film-overlay');

    const MAX_SPEED = 15;      // px/frame (scroll sırasında hedef)
    const ACCELERATION = 2;    // px/frame/frame → hedefe yaklaşma (hızlanma)
    const DECELERATION = 0.7;  // px/frame/frame → hedefe yaklaşma (yavaşlama)
    const IDLE_SPEED = 0.3;    // px/frame (scroll yokken sürünme)
    const IDLE_DELAY_MS = 200; // ms (scroll kesilince idle'a dönüş gecikmesi)
    const PATTERN_VW = 6;      // SVG pattern yüksekliği (6vw → dikey periyot)

    if (filmOverlay && viewport) {
        // Performans
        filmOverlay.style.willChange = 'transform';

        // Overlay'i yüksekte tutarak ilk yüklemede kenar boşluğu sorununu engelle
        function ensureOverlaySizing() {
            const vh = viewport.clientHeight || window.innerHeight;
            // Güvenli yükseklik: 200vh civarı
            const safeH = Math.max(vh * 2, 1);
            if (filmOverlay.style.height !== safeH + 'px') {
                filmOverlay.style.height = safeH + 'px';
            }
            // top'u sabit tut, sadece transform ile oynayacağız
            if (!filmOverlay.style.top) {
                filmOverlay.style.top = '0px';
            }
        }
        ensureOverlaySizing();
        window.addEventListener('resize', ensureOverlaySizing);

        // Pattern periyodu: 6vw → px
        let patternPeriodPx = (PATTERN_VW / 100) * (viewport.clientWidth || window.innerWidth);
        function recomputePeriod() {
            patternPeriodPx = (PATTERN_VW / 100) * (viewport.clientWidth || window.innerWidth);
            // offset'i yeni periyoda göre normalize et
            offsetPx = ((offsetPx % patternPeriodPx) + patternPeriodPx) % patternPeriodPx;
        }
        window.addEventListener('resize', recomputePeriod);

        let offsetPx = 0;
        let speed = 0;
        let targetSpeed = 0;
        let animationFrameId = null;
        let scrollTimeout = null;
        let lastDirection = 1;
        let lastScrollTop = viewport.scrollTop;

        // Başlangıç: hafif sürünme (drift birikmiyor; periyot modlu)
        targetSpeed = IDLE_SPEED * lastDirection;
        animationFrameId = requestAnimationFrame(animateFilmOverlay);

        function animateFilmOverlay() {
            // Hedef hıza yaklaş (ease)
            if (speed < targetSpeed) {
                speed = Math.min(speed + ACCELERATION, targetSpeed);
            } else if (speed > targetSpeed) {
                speed = Math.max(speed - DECELERATION, targetSpeed);
            }

            // Offset'i periyotla sınırla (drift yok)
            // Not: patternPeriodPx 0 olamaz; viewport genişliği > 0 varsayıyoruz
            offsetPx = ((offsetPx + speed) % patternPeriodPx + patternPeriodPx) % patternPeriodPx;

            filmOverlay.style.transform = `translateY(${-offsetPx}px)`;
            animationFrameId = requestAnimationFrame(animateFilmOverlay);
        }

        // Scroll dinleyicisi: hızlanma + idle'a dönüş
        viewport.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);

            const dy = viewport.scrollTop - lastScrollTop;
            if (dy !== 0) lastDirection = Math.sign(dy) || lastDirection;
            lastScrollTop = viewport.scrollTop;

            // Scroll sırasında hızlı akış (yönü koru)
            targetSpeed = MAX_SPEED * lastDirection;

            // Scroll kesilince küçük idle hıza dön
            scrollTimeout = setTimeout(() => {
                targetSpeed = IDLE_SPEED * lastDirection;
            }, IDLE_DELAY_MS);
        }, { passive: true });
    } else {
        console.warn('[filmOverlay] .film-overlay veya .viewport-frame bulunamadı; film hareketi atlandı.');
    }

    // ==============================
    // 3) Header Logo görünürlüğü (scroll mesafesine göre)
    // ==============================
    const headerLogo = document.querySelector('.header-logo');
    const headerThreshold = 300;

    if (viewport && headerLogo) {
        viewport.addEventListener('scroll', () => {
            const scrollY = viewport.scrollTop;
            if (scrollY <= headerThreshold) {
                headerLogo.classList.remove('header-logo-visible');
            } else {
                headerLogo.classList.add('header-logo-visible');
            }
        }, { passive: true });
    }

    // ==============================
    // 4) Noise overlay katmanlarını döngü halinde değiştir (film grain efekti)
    // ==============================
    const noiseLayers = document.querySelectorAll('.noise-overlay');
    let frame = 0;
    let cycling = false;
    let noiseAnimationId;
    let noiseFadeTimeout;

    function cycleNoise() {
        if (!cycling) return;
        noiseLayers.forEach((layer, index) => {
            layer.style.opacity = (index === frame % noiseLayers.length) ? 1 : 0.0;
        });
        frame++;
        noiseAnimationId = requestAnimationFrame(() => {
            setTimeout(cycleNoise, 1000 / 24); // 24 fps
        });
    }

    function startNoise() {
        clearTimeout(noiseFadeTimeout);
        cycling = true;
        noiseLayers.forEach((layer, index) => {
            layer.style.transition = 'opacity 0.2s ease-in-out';
            layer.style.opacity = (index === frame % noiseLayers.length) ? 1 : 0;
        });
        if (!noiseAnimationId) cycleNoise();
    }

    function stopNoiseWithFade() {
        cycling = false;
        cancelAnimationFrame(noiseAnimationId);
        noiseAnimationId = null;
        noiseFadeTimeout = setTimeout(() => {
            noiseLayers.forEach(layer => {
                layer.style.transition = 'opacity 3s ease-out';
                layer.style.opacity = '.5';
            });
        }, 3000);
    }

    // Sayfa açılır açılmaz noise efektini başlat
    startNoise();

    // ==============================
    // 5) Navigation linklerine tıklayınca smooth scroll + noise sync
    // ==============================
    if (viewport) {
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetEl = document.getElementById(targetId);

                if (targetEl) {
                    const targetRect = targetEl.getBoundingClientRect();
                    const containerRect = viewport.getBoundingClientRect();
                    const relativeOffset = viewport.scrollTop + (targetRect.top - containerRect.top);

                    startNoise();
                    viewport.scrollTo({ top: relativeOffset, behavior: 'smooth' });
                }
            });
        });
    }

    // ==============================
    // 6) Section içindeki "Next" butonuna basınca bir sonraki section’a geç
    // ==============================
    function scrollToNextSection(button) {
        const currentSection = button.closest('section');
        const nextSection = currentSection.nextElementSibling;
        if (nextSection) {
            nextSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    // Not: HTML’de <button onclick="scrollToNextSection(this)"> şeklinde kullanılabilir.

    // ==============================
    // 7) Video ses aç/kapa butonları
    // ==============================

    function muteAllVideosAndSync() {
        // Tüm videoları mute et
        document.querySelectorAll('video').forEach(v => { v.muted = true; });

        // Tüm toggle ikonlarını 'mute' durumuna getir
        document.querySelectorAll('.unmute-toggle').forEach(link => {
            const vid = document.getElementById(link.dataset.target);
            syncUnmuteIcon(link, vid);
        });
    }


    function syncUnmuteIcon(link, video) {
        const icon = link.querySelector('i');
        if (!icon) return;
        const isMuted = (video?.muted !== false); // muted veya video yoksa: muted say
        if (isMuted) {
            icon.classList.remove('fa-volume-high');
            icon.classList.add('fa-volume-xmark');
            link.setAttribute('aria-label', 'Unmute video');
            link.title = 'Unmute';
            link.setAttribute('aria-pressed', 'false');
        } else {
            icon.classList.remove('fa-volume-xmark');
            icon.classList.add('fa-volume-high');
            link.setAttribute('aria-label', 'Mute video');
            link.title = 'Mute';
            link.setAttribute('aria-pressed', 'true');
        }
    }


    // 8) Section değişince otomatik MUTE
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            // Yalnızca video barındıran section'larda tetikle (isteğe bağlı filtre)
            if (!entry.target.querySelector('video')) return;

            // Yeni bölüme girdik → hepsini mute et + ikonları güncelle
            muteAllVideosAndSync();
        });
    }, {
        // Sizin scroll konteyneriniz .viewport-frame ise kök onu yapalım;
        // değilse root: null kalsın (window scroll).
        root: viewport || null,
        threshold: 0.6,          // bölümün ~%60'ı görünür olunca tetikle
        rootMargin: '0px 0px 0px 0px'
    });

    // Gözlemlenecek section'ları bağla
    document.querySelectorAll('section').forEach(sec => sectionObserver.observe(sec));

    document.querySelectorAll('.unmute-toggle').forEach(link => {
        const video = document.getElementById(link.dataset.target);
        syncUnmuteIcon(link, video);

        link.addEventListener('click', (e) => {
            e.preventDefault();
            const vid = document.getElementById(link.dataset.target);
            if (!vid) return;

            // user gesture -> sesi aç/kapa
            if (vid.muted) {
                vid.muted = false;
                vid.volume = 1.0;
            } else {
                vid.muted = true;
            }
            syncUnmuteIcon(link, vid);
        });
    });




});
