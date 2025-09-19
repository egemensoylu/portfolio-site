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
    const unmuteButtons = document.querySelectorAll('.unmute-button');

    unmuteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const video = document.getElementById(targetId);

            if (video) {
                if (video.muted) {
                    video.muted = false;
                    video.volume = 1.0;
                    button.innerHTML = '🔇 mute';
                } else {
                    video.muted = true;
                    button.innerHTML = '🔊 unmute';
                }
            }
        });
    });

    // ==============================
    // 8) #project section’da özel yatay scroll
    // ==============================
    const projectsSection = document.getElementById('projects');
    const projectsContainer = projectsSection?.querySelector('.projects-container');

    let inHorizontalMode = false;

    if (projectsSection && projectsContainer && viewport) {

        function isProjectsInView() {
            const containerRect = viewport.getBoundingClientRect();
            const sectionRect = projectsSection.getBoundingClientRect();

            const sectionTopRelative = sectionRect.top - containerRect.top;
            const sectionBottomRelative = sectionRect.bottom - containerRect.top;

            return (
                sectionTopRelative < viewport.clientHeight &&
                sectionBottomRelative > 0
            );
        }

        // viewport scroll'unu dinle
        viewport.addEventListener('scroll', () => {
            if (isProjectsInView()) {
                if (!inHorizontalMode) {
                    console.log("✅ Yatay moda geçildi!");
                    inHorizontalMode = true;
                }
            } else {
                if (inHorizontalMode) {
                    console.log("⬆️ Yatay moddan çıkıldı");
                    inHorizontalMode = false;
                }
            }
        }, { passive: true });

        // wheel event → yatay moddaysa dikeyi engelle
        viewport.addEventListener('wheel', (e) => {
            if (!inHorizontalMode) return;

            e.preventDefault(); // dikey scroll'u durdur
            projectsContainer.scrollLeft += 100;

            const maxScrollLeft = projectsContainer.scrollWidth - projectsContainer.clientWidth;

            // Yatay scroll bitince moddan çık
            if (projectsContainer.scrollLeft <= 0 && e.deltaY < 0) {
                inHorizontalMode = false;
                console.log("⬆️ Başa geldik → dikeye dön");
            }
            if (projectsContainer.scrollLeft >= maxScrollLeft && e.deltaY > 0) {
                inHorizontalMode = false;
                console.log("⬇️ Sona geldik → dikeye dön");
            }
        }, { passive: false });
    }
});
