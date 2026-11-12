// Individually drifting science doodles for the page background.
// Unlike a scrolling background image, no two doodles share a timeline or path.
function initializeBackgroundDoodles() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'background-doodles';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    const doodles = [];
    let frameId;
    let width = 0;
    let height = 0;

    function makeDoodle() {
        const size = 10 + Math.random() * 14;
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            size,
            type: Math.floor(Math.random() * 8),
            vx: (Math.random() - 0.5) * 0.18,
            vy: (Math.random() - 0.5) * 0.18,
            turnAt: performance.now() + 1800 + Math.random() * 5000,
            rotation: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.002
        };
    }

    function resize() {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        // A denser field keeps the motion visible across wide displays without
        // letting the animation grow unbounded on very large screens.
        const count = Math.max(225, Math.min(420, Math.round(width * height / 4000)));
        doodles.length = 0;
        for (let i = 0; i < count; i++) doodles.push(makeDoodle());
    }

    function drawDoodle(doodle) {
        ctx.save();
        ctx.translate(doodle.x, doodle.y);
        ctx.rotate(doodle.rotation);
        ctx.strokeStyle = '#0f5370';
        ctx.fillStyle = '#0f5370';
        ctx.lineWidth = 1.15;
        const s = doodle.size;
        ctx.beginPath();
        if (doodle.type === 0) { // atom
            ctx.ellipse(0, 0, s, s * 0.34, 0, 0, Math.PI * 2);
            ctx.ellipse(0, 0, s, s * 0.34, Math.PI / 3, 0, Math.PI * 2);
            ctx.ellipse(0, 0, s, s * 0.34, -Math.PI / 3, 0, Math.PI * 2);
            ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, Math.PI * 2); ctx.fill();
        } else if (doodle.type === 1) { // flask
            ctx.moveTo(-s * .25, -s); ctx.lineTo(s * .25, -s); ctx.lineTo(s * .25, -s * .35);
            ctx.lineTo(s * .65, s * .65); ctx.lineTo(-s * .65, s * .65); ctx.lineTo(-s * .25, -s * .35); ctx.closePath(); ctx.stroke();
        } else if (doodle.type === 2) { // constellation
            ctx.arc(-s * .6, -s * .25, 1.7, 0, Math.PI * 2); ctx.arc(s * .55, -s * .55, 1.5, 0, Math.PI * 2); ctx.arc(s * .2, s * .6, 1.8, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-s * .6, -s * .25); ctx.lineTo(s * .55, -s * .55); ctx.lineTo(s * .2, s * .6); ctx.closePath(); ctx.stroke();
        } else if (doodle.type === 3) { // planet
            ctx.arc(0, 0, s * .35, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, s, s * .27, 0, 0, Math.PI * 2); ctx.stroke();
        } else if (doodle.type === 4) { // wave
            ctx.moveTo(-s, 0); ctx.quadraticCurveTo(-s * .5, -s * .6, 0, 0); ctx.quadraticCurveTo(s * .5, s * .6, s, 0); ctx.stroke();
        } else { // science formula
            const formulas = ['E = mc²', 'F = ma', 'pV = nRT'];
            ctx.font = `600 ${Math.max(10, s * .72)}px "Segoe UI", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(formulas[doodle.type - 5], 0, 0);
        }
        ctx.restore();
    }

    function animate(now) {
        ctx.clearRect(0, 0, width, height);
        doodles.forEach((doodle) => {
            if (now > doodle.turnAt) {
                doodle.vx += (Math.random() - .5) * .12;
                doodle.vy += (Math.random() - .5) * .12;
                const speed = Math.hypot(doodle.vx, doodle.vy);
                if (speed > .32) { doodle.vx *= .32 / speed; doodle.vy *= .32 / speed; }
                doodle.turnAt = now + 1800 + Math.random() * 5000;
            }
            doodle.x += doodle.vx; doodle.y += doodle.vy; doodle.rotation += doodle.spin;
            if (doodle.x < -doodle.size) doodle.x = width + doodle.size;
            if (doodle.x > width + doodle.size) doodle.x = -doodle.size;
            if (doodle.y < -doodle.size) doodle.y = height + doodle.size;
            if (doodle.y > height + doodle.size) doodle.y = -doodle.size;
            drawDoodle(doodle);
        });
        frameId = requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', resize);
    frameId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frameId); window.removeEventListener('resize', resize); canvas.remove(); };
}

// Universal Particle Engine configuration helper
function initializeParticles(containerElement, canvasElement) {
    if (!containerElement || !canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    const isTouchScreen = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    let particlesArray = [];
    let animationFrameId = null;
    let resizeTimeout = null;

    const mouse = {
        x: null,
        y: null,
        radius: 120
    };

    function resizeCanvas() {
        // getBoundingClientRect reflects the final mobile layout more reliably
        // than offset dimensions while the fixed header/footer is being painted.
        const bounds = containerElement.getBoundingClientRect();
        canvasElement.width = Math.max(1, Math.round(bounds.width));
        canvasElement.height = Math.max(1, Math.round(bounds.height));
        initParticles();
    }

    function debouncedResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeCanvas, 150);
    }

    const handleMouseMove = (e) => {
        const rect = containerElement.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
        mouse.x = null;
        mouse.y = null;
    };

    containerElement.addEventListener('mousemove', handleMouseMove);
    containerElement.addEventListener('mouseleave', handleMouseLeave);

    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update() {
            if (this.x > canvasElement.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvasElement.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

            if (mouse.x !== null && mouse.y !== null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    this.x += (dx / distance) * force * 2.5;
                    this.y += (dy / distance) * force * 2.5;
                }
            }

            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    function initParticles() {
        particlesArray = [];
        let numberOfParticles = Math.floor((canvasElement.width * canvasElement.height) / 4000);
        // Short mobile headers otherwise contain too few particles to notice.
        if (numberOfParticles < (isTouchScreen ? 24 : 15)) {
            numberOfParticles = isTouchScreen ? 24 : 15;
        }

        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1;
            let x = Math.random() * (canvasElement.width - size * 2) + size;
            let y = Math.random() * (canvasElement.height - size * 2) + size;

            let speed = Math.random() * 0.6 + 0.2;
            let angle = Math.random() * Math.PI * 2;

            let directionX = Math.cos(angle) * speed;
            let directionY = Math.sin(angle) * speed;

            const opacity = isTouchScreen ? (Math.random() * 0.25 + 0.65) : (Math.random() * 0.4 + 0.3);
            let color = 'rgba(0, 200, 255, ' + opacity + ')';

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connectNodes();
    }

    function connectNodes() {
        let maxDistance = isTouchScreen ? 80 : 65;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a + 1; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    let opacity = (1 - (distance / maxDistance)) * (isTouchScreen ? 0.28 : 0.12);
                    ctx.strokeStyle = `rgba(0, 168, 255, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    window.addEventListener('resize', debouncedResize);
    resizeCanvas();
    // Mobile browsers can report an interim height while custom elements mount.
    requestAnimationFrame(resizeCanvas);
    animate();

    return function cleanup() {
        window.removeEventListener('resize', debouncedResize);
        containerElement.removeEventListener('mousemove', handleMouseMove);
        containerElement.removeEventListener('mouseleave', handleMouseLeave);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
}

class UniversalHeader extends HTMLElement {
    connectedCallback() {
        if (!document.querySelector("link[rel*='icon']")) {
            const favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.type = 'image/webp';
            favicon.href = 'image/logo.webp';
            document.head.appendChild(favicon);

            const appleTouchIcon = document.createElement('link');
            appleTouchIcon.rel = 'apple-touch-icon';
            appleTouchIcon.href = 'image/logo.webp';
            document.head.appendChild(appleTouchIcon);
        }

        const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

        this.innerHTML = `
        <header>
            <canvas class="particle-canvas"></canvas>
            <div class="nav-container">
                <a href="index.html" class="logo"> <img src="image/official/logo.webp" height="35" width="35" alt="GSTU SC Logo"><span class="brand-name">GSTU Science Club</span></a>
                
                <button class="menu-toggle" aria-label="Toggle Navigation Menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <nav id="nav-menu">
                    <ul id="nav-links">
                        <li><a href="index.html">Home</a></li>
                        <li><a href="events.html">Events</a></li>
                        <li><a href="achievement.html">Achievement</a></li>
                        <li class="dropdown">
                            <a href="committee.html" class="dropdown-trigger">Committee <span class="dropdown-arrow">&#9662;</span></a>
                            <ul class="dropdown-menu">
                                <li><a href="advisor.html">Advisor Panel</a></li>
                                <li><a href="committee.html">Executive Committee</a></li>
                                <li><a href="ce.html">Core Executives</a></li>
                                <li><a href="standing-committee.html">Standing Committee</a></li>
                                <li><a href="alumni.html">Alumni Panel</a></li>
                                <li><a href="teams.html">Teams</a></li>
                            </ul>
                        </li>
                        <li><a href="contact.html">Contact</a></li>
                        <li><a href="about.html">About</a></li>
                        <li class="theme-toggle-li">
                            <button class="theme-toggle-btn" id="themeToggleBtn" role="switch" aria-checked="false" aria-label="Toggle dark mode">
                                <span class="theme-switch-track" aria-hidden="true"><span class="theme-icon"></span></span>
                                <span class="theme-text">Dark</span>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
        `;

        const menuToggle = this.querySelector('.menu-toggle');
        const navMenu = this.querySelector('#nav-menu');
        const dropdownTrigger = this.querySelector('.dropdown-trigger');
        const dropdownMenu = this.querySelector('.dropdown-menu');

        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                menuToggle.classList.toggle('open');
                navMenu.classList.toggle('open');
            });
        }

        this._outsideClickHandler = (e) => {
            if (navMenu && navMenu.classList.contains('open')) {
                if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                    navMenu.classList.remove('open');
                    menuToggle.classList.remove('open');

                    if (dropdownMenu && dropdownMenu.classList.contains('open')) {
                        dropdownMenu.classList.remove('open');
                        const arrow = dropdownTrigger.querySelector('.dropdown-arrow');
                        if (arrow) arrow.style.transform = 'rotate(0deg)';
                    }
                }
            }
        };
        document.addEventListener('click', this._outsideClickHandler);

        if (dropdownTrigger && dropdownMenu) {
            dropdownTrigger.addEventListener('click', (e) => {
                if (window.innerWidth <= 900) {
                    e.preventDefault();
                    dropdownMenu.classList.toggle('open');

                    const arrow = dropdownTrigger.querySelector('.dropdown-arrow');
                    if (arrow) {
                        arrow.style.transform = dropdownMenu.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
                    }
                }
            });
        }

        const themeBtn = this.querySelector('#themeToggleBtn');
        const themeIcon = themeBtn.querySelector('.theme-icon');
        const themeText = themeBtn.querySelector('.theme-text');

        const savedTheme = localStorage.getItem('gstu-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeButtonUI(savedTheme);

        let themeTransitionTimer;

        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.classList.add('theme-transitioning');
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('gstu-theme', newTheme);
            updateThemeButtonUI(newTheme);

            clearTimeout(themeTransitionTimer);
            themeTransitionTimer = setTimeout(() => {
                document.documentElement.classList.remove('theme-transitioning');
            }, 450);
        });

        function updateThemeButtonUI(theme) {
            themeBtn.setAttribute('aria-checked', String(theme === 'dark'));
            themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Dark mode is on. Switch to light mode' : 'Light mode is on. Switch to dark mode');
            if (theme === 'dark') {
                themeIcon.innerHTML = moonIcon;
                themeText.textContent = 'Dark';
            } else {
                themeIcon.innerHTML = sunIcon;
                themeText.textContent = 'Light';
            }
        }

        const links = this.querySelectorAll('#nav-links a');
        let currentPath = window.location.pathname.split('/').pop();
        if (currentPath === "" || currentPath === "index.html") {
            currentPath = "index.html";
        }

        let isSubPageActive = false;
        const committeeSubPages = ["advisor.html", "standing-committee.html", "committee.html", "ce.html", "alumni.html", "teams.html"];

        links.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPath) {
                link.classList.add('active');
                if (committeeSubPages.includes(currentPath)) {
                    isSubPageActive = true;
                }
            }
        });

        if (isSubPageActive && dropdownTrigger) {
            dropdownTrigger.classList.add('active');
        }

        const headerContainer = this.querySelector('header');
        const headerCanvas = this.querySelector('.particle-canvas');
        this._particleCleanup = initializeParticles(headerContainer, headerCanvas);

        // Keep the navigation out of the way while reading, then bring it back
        // down from above as soon as the visitor reverses direction.
        let lastScrollY = window.scrollY;
        let ticking = false;
        let revealTimer;

        const revealHeader = () => {
            if (this.classList.contains('scroll-hidden')) {
                this.classList.remove('scroll-hidden');
                this.classList.add('scroll-revealing');
                clearTimeout(revealTimer);
                revealTimer = setTimeout(() => this.classList.remove('scroll-revealing'), 500);
            }
        };

        this._headerScrollHandler = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const currentScrollY = Math.max(0, window.scrollY);
                const distance = currentScrollY - lastScrollY;
                const menuIsOpen = navMenu && navMenu.classList.contains('open');

                if (currentScrollY <= 12) {
                    revealHeader();
                } else if (!menuIsOpen && Math.abs(distance) > 6) {
                    if (distance > 0 && currentScrollY > 110) {
                        this.classList.add('scroll-hidden');
                    } else if (distance < 0) {
                        revealHeader();
                    }
                }

                lastScrollY = currentScrollY;
                ticking = false;
            });
        };
        window.addEventListener('scroll', this._headerScrollHandler, { passive: true });
    }

    disconnectedCallback() {
        if (this._outsideClickHandler) {
            document.removeEventListener('click', this._outsideClickHandler);
        }
        if (this._particleCleanup) {
            this._particleCleanup();
        }
        if (this._headerScrollHandler) {
            window.removeEventListener('scroll', this._headerScrollHandler);
        }
    }
}

// --- MESSAGES CAROUSEL ENGINE ---
const messagesSection = document.querySelector('.messages-section');
const msgCarousel = document.getElementById('msgCarousel');
const msgViewport = document.getElementById('msgViewport');
const msgTrack = document.getElementById('msgTrack');
const msgPrev = document.getElementById('msgPrev');
const msgNext = document.getElementById('msgNext');
const msgDotsContainer = document.getElementById('msgDots');

if (msgTrack && msgPrev && msgNext) {
    const msgCards = msgTrack.querySelectorAll('.message-card');
    let currentMsgIndex = 0;
    let msgAutoSlideTimer = null;
    let msgIsOnScreen = false;
    const MSG_SLIDE_DELAY = 6000;

    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isDragging = false;

    if (msgDotsContainer && msgCards.length > 0) {
        msgDotsContainer.innerHTML = '';
        msgCards.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.classList.add('msg-dot');
            if (i === 0) dot.classList.add('active');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => {
                currentMsgIndex = i;
                updateMsgSlider();
                resetMsgAutoSlide();
            });
            msgDotsContainer.appendChild(dot);
        });
    }

    function updateMsgSlider() {
        if (msgCards.length === 0) return;
        const cardWidth = msgCards[0].offsetWidth;
        const gap = 20;

        currentTranslate = -currentMsgIndex * (cardWidth + gap);
        prevTranslate = currentTranslate;

        msgTrack.style.transform = `translateX(${currentTranslate}px)`;

        if (msgDotsContainer) {
            const dots = msgDotsContainer.querySelectorAll('.msg-dot');
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === currentMsgIndex);
            });
        }
    }

    function nextMsgSlide() {
        currentMsgIndex = (currentMsgIndex + 1) % msgCards.length;
        updateMsgSlider();
    }

    function prevMsgSlide() {
        currentMsgIndex = (currentMsgIndex - 1 + msgCards.length) % msgCards.length;
        updateMsgSlider();
    }

    function startMsgAutoSlide() {
        if (!msgIsOnScreen) return;
        stopMsgAutoSlide();
        msgAutoSlideTimer = setInterval(nextMsgSlide, MSG_SLIDE_DELAY);
    }

    function stopMsgAutoSlide() {
        if (msgAutoSlideTimer) {
            clearInterval(msgAutoSlideTimer);
            msgAutoSlideTimer = null;
        }
    }

    function resetMsgAutoSlide() {
        stopMsgAutoSlide();
        startMsgAutoSlide();
    }

    msgNext.addEventListener('click', () => {
        nextMsgSlide();
        resetMsgAutoSlide();
    });

    msgPrev.addEventListener('click', () => {
        prevMsgSlide();
        resetMsgAutoSlide();
    });

    if (messagesSection) {
        messagesSection.addEventListener('mouseenter', stopMsgAutoSlide);
        messagesSection.addEventListener('mouseleave', startMsgAutoSlide);
    }

    if (msgCarousel) {
        msgCarousel.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                nextMsgSlide();
                resetMsgAutoSlide();
            } else if (e.key === 'ArrowLeft') {
                prevMsgSlide();
                resetMsgAutoSlide();
            }
        });
    }

    if (msgViewport) {
        msgViewport.addEventListener('touchstart', touchStart);
        msgViewport.addEventListener('touchend', touchEnd);
        msgViewport.addEventListener('touchmove', touchMove);

        msgViewport.addEventListener('mousedown', touchStart);
        msgViewport.addEventListener('mouseup', touchEnd);
        msgViewport.addEventListener('mouseleave', () => { if (isDragging) touchEnd(); });
        msgViewport.addEventListener('mousemove', touchMove);
    }

    function touchStart(e) {
        isDragging = true;
        startX = getPositionX(e);
        stopMsgAutoSlide();
        msgTrack.style.transition = 'none';
    }

    function touchMove(e) {
        if (!isDragging) return;
        const currentPosition = getPositionX(e);
        const movedBy = currentPosition - startX;
        msgTrack.style.transform = `translateX(${prevTranslate + movedBy}px)`;
    }

    function touchEnd() {
        if (!isDragging) return;
        isDragging = false;
        msgTrack.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';

        const movedBy = currentTranslate - prevTranslate;

        if (movedBy < -50) {
            nextMsgSlide();
        } else if (movedBy > 50) {
            prevMsgSlide();
        } else {
            updateMsgSlider();
        }
        startMsgAutoSlide();
    }

    function getPositionX(e) {
        return e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    }

    window.addEventListener('resize', updateMsgSlider);

    const msgVisibilityObserver = new IntersectionObserver((entries) => {
        msgIsOnScreen = entries[0].isIntersecting;
        if (msgIsOnScreen) {
            startMsgAutoSlide();
        } else {
            stopMsgAutoSlide();
        }
    }, { threshold: 0.2 });

    msgVisibilityObserver.observe(messagesSection || msgCarousel);

    setTimeout(() => {
        updateMsgSlider();
    }, 100);
}

class UniversalFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer>
            <canvas class="particle-canvas"></canvas>
            <div class="footer-container">
                <div class="footer-col">
                    <a href="index.html" class="logo footer-logo-link"> 
                    <img src="image/official/logo.webp" height="60px" width="60px" alt="GSTU SC Logo"></a>
                    <h3>GSTU Science Club</h3>
                    <p>Inspiring innovation, research, and technical excellence among the bright minds of GSTU. Your workspace to shape tomorrow.</p>
                </div>
                
                <div class="footer-col footer-links-column">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="https://gstu.edu.bd/s/">Gopalganj Science and Technology University</a></li>
                        <li><a href="https://most.gov.bd">Ministry of Science and Technology</a></li>
                        <li><a href="https://nmst.gov.bd">National Museum of Science and Technology</a></li>
                    </ul>
                </div>
                
                <div class="footer-col footer-links-column">
                    <h3>Resources</h3>
                    <ul>
                        <li><a href="index.html">Home</a></li>
                        <li><a href="committee.html">Executive Committee</a></li>
                        <li><a href="achievement.html">Achievement</a></li>
                        <li><a href="contact.html">Contact Support</a></li>
                    </ul>
                </div>
                
                <div class="footer-col">
                    <h3>Connect With Us</h3>
                    <p>Follow our news feeds for instant updates on current hackathons and assignments.</p> <br>
                    <p>President: +880 1602-337216</p>
                    <p>General Secretary: +880 1746-739437</p>
                    <div class="social-links">
                        <a href="https://www.facebook.com/GSTUSC" target="_blank" aria-label="Facebook"><img src="image/official/facebook.webp" width="35px" height="35px" alt="Facebook"></a>
                        <a href="https://www.linkedin.com/company/gstu-science-club" target="_blank" aria-label="LinkedIn"><img src="image/official/linkedin.webp" width="35px" height="35px" alt="LinkedIn"></a>
                        <a href="https://www.youtube.com/@gstuscienceclub" target="_blank" aria-label="YouTube"><img src="image/official/youtube.webp" width="35px" height="35px" alt="YouTube"></a>
                        <a href="https://www.facebook.com/groups/bsmrstusc" target="_blank" aria-label="Facebook Group"><img src="image/official/facebook.webp" width="35px" height="35px" alt="FB Group"></a>
                    </div>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2026 GSTU Science Club. All Rights Reserved.</p>
            </div>
        </footer>
        `;

        const footerContainer = this.querySelector('footer');
        const footerCanvas = this.querySelector('.particle-canvas');
        this._particleCleanup = initializeParticles(footerContainer, footerCanvas);
    }

    disconnectedCallback() {
        if (this._particleCleanup) {
            this._particleCleanup();
        }
    }
}

customElements.define('universal-header', UniversalHeader);
customElements.define('universal-footer', UniversalFooter);

// --- GALLERY CAROUSEL CONTROL ---
const track = document.getElementById('galleryTrack');
const prevBtn = document.getElementById('galleryPrev');
const nextBtn = document.getElementById('galleryNext');
const galleryDotsContainer = document.getElementById('galleryDots');

if (track && prevBtn && nextBtn) {
    let currentColumnIndex = 0;
    let autoSlideInterval = null;
    let galleryIsOnScreen = false;
    const SLIDE_DELAY = 4000;

    function getItemsPerView() {
        if (window.innerWidth <= 600) return 1;
        if (window.innerWidth <= 968) return 2;
        return 3;
    }

    function renderGalleryDots() {
        if (!galleryDotsContainer) return;
        const items = track.querySelectorAll('.gallery-item');
        const totalColumns = Math.ceil(items.length / 2);
        const columnsPerView = getItemsPerView();

        if (totalColumns <= columnsPerView) {
            galleryDotsContainer.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(totalColumns / columnsPerView);

        if (galleryDotsContainer.children.length !== totalPages) {
            galleryDotsContainer.innerHTML = '';
            for (let i = 0; i < totalPages; i++) {
                const dot = document.createElement('button');
                dot.classList.add('gallery-dot');
                dot.setAttribute('aria-label', `Go to photo page ${i + 1}`);
                dot.addEventListener('click', () => {
                    const maxIndex = Math.max(0, totalColumns - columnsPerView);
                    let targetIndex = i * columnsPerView;
                    if (targetIndex > maxIndex) targetIndex = maxIndex;
                    currentColumnIndex = targetIndex;
                    updateSliderPosition();
                    startAutoSlide();
                });
                galleryDotsContainer.appendChild(dot);
            }
        }
    }

    function updateGalleryDotsUI() {
        if (!galleryDotsContainer) return;
        const columnsPerView = getItemsPerView();
        const dots = galleryDotsContainer.querySelectorAll('.gallery-dot');
        const activePageIndex = Math.min(
            dots.length - 1,
            Math.floor(currentColumnIndex / columnsPerView)
        );

        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === activePageIndex);
        });
    }

    function updateSliderPosition() {
        const items = track.querySelectorAll('.gallery-item');
        if (items.length === 0) return;

        const totalColumns = Math.ceil(items.length / 2);
        const columnsPerView = getItemsPerView();
        const maxIndex = Math.max(0, totalColumns - columnsPerView);

        if (currentColumnIndex > maxIndex) currentColumnIndex = 0;
        if (currentColumnIndex < 0) currentColumnIndex = maxIndex;

        if (totalColumns <= columnsPerView) {
            track.style.transform = `translateX(0px)`;
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            stopAutoSlide();
            renderGalleryDots();
            return;
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        }

        const firstItem = items[0];
        const itemWidth = firstItem.getBoundingClientRect().width;
        const trackStyle = window.getComputedStyle(track);
        const gap = parseFloat(trackStyle.gap) || 0;

        const shiftAmount = currentColumnIndex * (itemWidth + gap);
        track.style.transform = `translateX(-${shiftAmount}px)`;

        prevBtn.disabled = false;
        nextBtn.disabled = false;

        renderGalleryDots();
        updateGalleryDotsUI();
    }

    function handleNextSlide() {
        const items = track.querySelectorAll('.gallery-item');
        const totalColumns = Math.ceil(items.length / 2);
        const columnsPerView = getItemsPerView();
        const maxIndex = Math.max(0, totalColumns - columnsPerView);

        if (currentColumnIndex >= maxIndex) {
            currentColumnIndex = 0;
        } else {
            currentColumnIndex += getItemsPerView();
            if (currentColumnIndex > maxIndex) currentColumnIndex = maxIndex;
        }
        updateSliderPosition();
    }

    function handlePrevSlide() {
        const items = track.querySelectorAll('.gallery-item');
        const totalColumns = Math.ceil(items.length / 2);
        const columnsPerView = getItemsPerView();
        const maxIndex = Math.max(0, totalColumns - columnsPerView);

        if (currentColumnIndex <= 0) {
            currentColumnIndex = maxIndex;
        } else {
            currentColumnIndex -= getItemsPerView();
            if (currentColumnIndex < 0) currentColumnIndex = 0;
        }
        updateSliderPosition();
    }

    function startAutoSlide() {
        if (!galleryIsOnScreen) return;
        const items = track.querySelectorAll('.gallery-item');
        const totalColumns = Math.ceil(items.length / 2);
        if (totalColumns <= getItemsPerView()) return;

        stopAutoSlide();
        autoSlideInterval = setInterval(handleNextSlide, SLIDE_DELAY);
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }

    nextBtn.addEventListener('click', () => {
        handleNextSlide();
        startAutoSlide();
    });

    prevBtn.addEventListener('click', () => {
        handlePrevSlide();
        startAutoSlide();
    });

    const galleryContainer = document.querySelector('.gallery-carousel-container');
    if (galleryContainer) {
        galleryContainer.addEventListener('mouseenter', stopAutoSlide);
        galleryContainer.addEventListener('mouseleave', startAutoSlide);
        galleryContainer.addEventListener('touchstart', stopAutoSlide, { passive: true });
        galleryContainer.addEventListener('touchend', startAutoSlide, { passive: true });
        galleryContainer.addEventListener('touchcancel', startAutoSlide, { passive: true });

        const galleryVisibilityObserver = new IntersectionObserver((entries) => {
            galleryIsOnScreen = entries[0].isIntersecting;
            if (galleryIsOnScreen) {
                startAutoSlide();
            } else {
                stopAutoSlide();
            }
        }, { threshold: 0.2 });

        galleryVisibilityObserver.observe(galleryContainer);
    }

    let resizeDebounceTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeDebounceTimeout);
        resizeDebounceTimeout = setTimeout(() => {
            updateSliderPosition();
            startAutoSlide();
        }, 100);
    });

    setTimeout(() => {
        updateSliderPosition();
    }, 150);
}

// --- SITE-WIDE FULL-SIZE IMAGE PREVIEW ---
// A single modal is reused for every image, including pages that do not have
// gallery markup of their own.
let galleryModal = document.getElementById('galleryModal');

if (!galleryModal) {
    galleryModal = document.createElement('div');
    galleryModal.id = 'galleryModal';
    galleryModal.className = 'gallery-modal';
    galleryModal.setAttribute('aria-hidden', 'true');
    galleryModal.innerHTML = `
        <button class="modal-close" id="modalClose" type="button" aria-label="Close image preview">&times;</button>
        <div class="modal-content-wrapper" role="dialog" aria-modal="true" aria-label="Image preview">
            <img class="modal-image" id="modalImg" src="" alt="">
            <div class="modal-caption" id="modalCaption"></div>
        </div>`;
    document.body.appendChild(galleryModal);
}

const modalImg = galleryModal.querySelector('#modalImg');
const modalCaption = galleryModal.querySelector('#modalCaption');
const modalClose = galleryModal.querySelector('#modalClose');
let previewTrigger = null;
let previousBodyOverflow = '';

const closeImagePreview = () => {
    if (!galleryModal.classList.contains('show')) return;
    galleryModal.classList.remove('show');
    galleryModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousBodyOverflow;
    previewTrigger?.focus();
};

const openImagePreview = (img) => {
    if (!img.currentSrc && !img.src) return;
    previewTrigger = img;
    previousBodyOverflow = document.body.style.overflow;
    modalImg.src = img.currentSrc || img.src;
    modalImg.alt = img.alt || 'Full-size image preview';
    modalCaption.textContent = img.alt || '';
    galleryModal.classList.add('show');
    galleryModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
};

// The club logo is navigation/branding rather than previewable content.
document.querySelectorAll('img:not(.modal-image):not([src*="image/official/logo.webp"])').forEach((img) => {
    img.classList.add('image-preview-trigger');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `Open full-size preview of ${img.alt || 'image'}`);

    img.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openImagePreview(img);
    });
    img.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openImagePreview(img);
        }
    });
});

modalClose.setAttribute('role', 'button');
modalClose.setAttribute('tabindex', '0');
modalClose.addEventListener('click', closeImagePreview);
galleryModal.addEventListener('click', (event) => {
    if (event.target === galleryModal) closeImagePreview();
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeImagePreview();
});

// --- HERO STAT BOXES BOUNCE & ENTRY ANIMATION ---
function animateHeroStatBoxes() {
    const heroStatBoxes = document.querySelectorAll('#hero .hero-stats .stat-box');

    heroStatBoxes.forEach((box, index) => {
        box.style.transition = 'opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';

        setTimeout(() => {
            box.style.opacity = '1';
            box.style.transform = 'translateY(0)';
        }, index * 150);
    });
}

// --- HERO COUNTER ANIMATION ENGINE ---
function startHeroCounters() {
    const counters = document.querySelectorAll('.counter');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    counters.forEach((counter) => {
        if (counter.classList.contains('counted')) return;
        counter.classList.add('counted');

        const target = Number(counter.getAttribute('data-target')) || 0;
        const suffix = counter.getAttribute('data-suffix') || '';
        const duration = 2000;
        if (reduceMotion) {
            counter.textContent = target + suffix;
            return;
        }

        const startTime = performance.now();
        const countUp = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const currentCount = Math.round(target * (1 - Math.pow(1 - progress, 3)));
            counter.textContent = currentCount + suffix;

            if (progress < 1) requestAnimationFrame(countUp);
        };
        requestAnimationFrame(countUp);
    });
}

// --- INTERSECTION OBSERVER & GENERAL SCROLL REVEAL ---
document.addEventListener('DOMContentLoaded', () => {
    initializeBackgroundDoodles();

    const heroStatBoxes = document.querySelectorAll('#hero .hero-stats .stat-box');
    heroStatBoxes.forEach((box) => {
        box.style.opacity = '0';
        box.style.transform = 'translateY(50px)';
    });

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.12
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealDirections = ['bottom', 'left', 'right'];
    const currentPage = window.location.pathname.toLowerCase();
    const isEventsPage = currentPage.endsWith('/events.html');
    const isAchievementPage = currentPage.endsWith('/achievement.html');
    const elementsToReveal = Array.from(document.querySelectorAll('.reveal-on-scroll'));
    const sectionRevealElements = elementsToReveal.filter(el => !el.parentElement.closest('.reveal-on-scroll'));

    sectionRevealElements.forEach((el, index) => {
        const revealDirection = isEventsPage
            ? 'bottom'
            : isAchievementPage
                ? (index % 2 === 0 ? 'left' : 'right')
                : revealDirections[Math.floor(Math.random() * revealDirections.length)];
        el.classList.add(`reveal-from-${revealDirection}`);

        // Child elements stay visible within their parent so the whole section
        // enters the viewport as one group instead of animating card by card.
        el.querySelectorAll('.reveal-on-scroll').forEach(child => child.classList.add('is-visible'));
        scrollObserver.observe(el);
    });

    // Bind dynamic cursor tracking for radial card overlays
    const interactiveCards = document.querySelectorAll('.qa-item, .affiliation-wide-card, .message-card');
    interactiveCards.forEach(card => {
        let animationFrame = null;
        let pointerX = 0;
        let pointerY = 0;
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            pointerX = e.clientX - rect.left;
            pointerY = e.clientY - rect.top;
            if (animationFrame) return;

            animationFrame = requestAnimationFrame(() => {
                card.style.setProperty('--x', `${pointerX}px`);
                card.style.setProperty('--y', `${pointerY}px`);
                animationFrame = null;
            });
        });
    });
});

// --- TEAMS SEARCH ENGINE FILTER LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('teamsSearch');
    const detailsElements = document.querySelectorAll('.committee-accordion details');
    const noResults = document.getElementById('noResults');

    if (searchInput && detailsElements.length > 0) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            let hasGlobalMatches = false;

            detailsElements.forEach(details => {
                const rows = details.querySelectorAll('.list-table tbody tr');
                let hasMatchInSection = false;

                rows.forEach(row => {
                    const nameCell = row.cells[0]?.textContent.toLowerCase() || '';
                    const teamCell = row.cells[1]?.textContent.toLowerCase() || '';
                    const designationCell = row.cells[2]?.textContent.toLowerCase() || '';

                    if (query === '' || nameCell.includes(query) || teamCell.includes(query) || designationCell.includes(query)) {
                        row.style.display = '';
                        hasMatchInSection = true;
                    } else {
                        row.style.display = 'none';
                    }
                });

                if (query === '') {
                    details.style.display = '';
                } else if (hasMatchInSection) {
                    details.style.display = '';
                    details.open = true;
                    hasGlobalMatches = true;
                } else {
                    details.style.display = 'none';
                    details.open = false;
                }
            });

            if (noResults) {
                if (query !== '' && !hasGlobalMatches) {
                    noResults.style.display = 'block';
                } else {
                    noResults.style.display = 'none';
                }
            }
        });
    }
});

/* ==========================================
   SESSION-BASED PRELOADER LOGIC
   ========================================== */
window.addEventListener('load', () => {
    const loader = document.getElementById('loader-wrapper');
    const body = document.body;

    const finishLoading = () => {
        if (loader) {
            loader.classList.add('fade-out');
        }
        body.classList.remove('loading');

        animateHeroStatBoxes();
        startHeroCounters();
    };

    if (sessionStorage.getItem('hasSeenLoaderThisSession')) {
        finishLoading();
        return;
    }

    const MIN_DISPLAY_TIME = 2500;
    const startTime = window.loaderStartTime || Date.now();
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsedTime);

    setTimeout(() => {
        finishLoading();
        sessionStorage.setItem('hasSeenLoaderThisSession', 'true');
    }, remainingTime);
});

// --- HELPER FUNCTIONS FOR GLOW TEXTURES ---
function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.08)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    return new THREE.CanvasTexture(canvas);
}

function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.08)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    return new THREE.CanvasTexture(canvas);
}

// Cycle hero models in a fixed order on every refresh: atom, then sun.
const previousHeroModel = Number.parseInt(localStorage.getItem('gstu-hero-model-index'), 10);
const heroModel = Number.isInteger(previousHeroModel) ? (previousHeroModel + 1) % 2 : 0;
localStorage.setItem('gstu-hero-model-index', String(heroModel));
const showAtomicModel = heroModel === 0;
document.body.classList.toggle('atomic-hero-active', showAtomicModel);
if (showAtomicModel) {
const atomCanvas = document.getElementById('sun-canvas');
if (atomCanvas && typeof THREE !== 'undefined') {
    const glowTexture = createGlowTexture();
    const particleTexture = createParticleTexture();

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        28,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({ canvas: atomCanvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    let controls = null;
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0xff3366, 1.75, 25);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const coreLightSecondary = new THREE.PointLight(0xffaa00, 1.18, 19);
    coreLightSecondary.position.set(0, 0, 0);
    scene.add(coreLightSecondary);

    const cyanLight = new THREE.PointLight(0x00d2ff, 1.2, 30);
    cyanLight.position.set(5, 5, 5);
    scene.add(cyanLight);

    const atomGroup = new THREE.Group();
    atomGroup.position.set(0, 0.5, 0);
    atomGroup.scale.set(0.9, 0.9, 0.9);
    scene.add(atomGroup);

    function updateCameraView() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isMobile = w < 768;

        camera.aspect = w / h;

        if (isMobile) {
            camera.position.set(0, 0, 40);
            camera.setViewOffset(w, h, 0, -h * 0.12, w, h);
        } else {
            camera.position.set(0, 0, 30);
            camera.setViewOffset(w, h, -w * 0.23, 0, w, h);
        }

        camera.updateProjectionMatrix();
    }
    updateCameraView();

    // Nucleus
    const nucleusGroup = new THREE.Group();
    const nucleonRadius = 0.25;
    const particleGeo = new THREE.SphereGeometry(nucleonRadius, 18, 18);

    const mat1 = new THREE.MeshStandardMaterial({
        color: 0xee2255,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0xcc0033,
        emissiveIntensity: 0.74
    });

    const mat2 = new THREE.MeshStandardMaterial({
        color: 0xee8800,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0xcc5500,
        emissiveIntensity: 0.74
    });

    // Rounded close-packed nucleus: one centre particle and irregular shells,
    // avoiding the visible 3 × 3 × 3 cube formation.
    const packedPositions = [new THREE.Vector3(0, 0, 0)];
    const particleSpacing = 0.56;
    const shellCounts = [8, 18];
    shellCounts.forEach((shellCount, shell) => {
        const radius = particleSpacing * (shell + 1);
        for (let index = 0; index < shellCount; index++) {
            const y = 1 - (index / (shellCount - 1)) * 2;
            const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
            const theta = Math.PI * (3 - Math.sqrt(5)) * index + shell * 0.47;
            packedPositions.push(new THREE.Vector3(
                Math.cos(theta) * ringRadius * radius,
                y * radius,
                Math.sin(theta) * ringRadius * radius
            ));
        }
    });
    const count = packedPositions.length;
    for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(particleGeo, i % 2 === 0 ? mat1 : mat2);
        mesh.position.copy(packedPositions[i]);
        mesh.userData.spinSpeed = 0.4 + Math.random() * 0.6;
        mesh.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.42,
            (Math.random() - 0.5) * 0.42,
            (Math.random() - 0.5) * 0.42
        );

        nucleusGroup.add(mesh);
    }

    const nucleusGlowMat = new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xff3366,
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const nucleusGlowSprite = new THREE.Sprite(nucleusGlowMat);
    nucleusGlowSprite.scale.set(3.2, 3.2, 3.2);
    nucleusGroup.add(nucleusGlowSprite);

    atomGroup.add(nucleusGroup);

    // Quantum Probability Electron Cloud
    const cloudParticlesCount = 6500;
    const cloudGeometry = new THREE.BufferGeometry();
    const cloudPositions = new Float32Array(cloudParticlesCount * 3);
    const cloudColors = new Float32Array(cloudParticlesCount * 3);

    const colorBlue = new THREE.Color(0x00d2ff);
    const colorPurple = new THREE.Color(0x8800ff);

    for (let i = 0; i < cloudParticlesCount; i++) {
        const u = Math.random();
        const radius = 2.0 + Math.pow(u, 2) * 5.0;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        cloudPositions[i * 3] = x;
        cloudPositions[i * 3 + 1] = y;
        cloudPositions[i * 3 + 2] = z;

        const mixedColor = colorBlue.clone().lerp(colorPurple, radius / 7.0);
        cloudColors[i * 3] = mixedColor.r;
        cloudColors[i * 3 + 1] = mixedColor.g;
        cloudColors[i * 3 + 2] = mixedColor.b;
    }

    cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
    cloudGeometry.setAttribute('color', new THREE.BufferAttribute(cloudColors, 3));

    const cloudMaterial = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const quantumCloud = new THREE.Points(cloudGeometry, cloudMaterial);
    atomGroup.add(quantumCloud);

    // Orbital System
    const ringsData = [
        { radius: 3.8, color: 0xffb040, tailColor: 0xff2200, speed: 6.5, rotX: 0.7, rotY: 0.5, rotZ: 0.2, electrons: 2 },
        { radius: 5.2, color: 0x00e5ff, tailColor: 0x0033cc, speed: 5.0, rotX: -0.8, rotY: 1.2, rotZ: -0.4, electrons: 4 },
        { radius: 6.5, color: 0x33ff88, tailColor: 0x006622, speed: 3.8, rotX: 1.1, rotY: -0.6, rotZ: 0.7, electrons: 4 },
        { radius: 7.8, color: 0xff33aa, tailColor: 0x660044, speed: 2.8, rotX: -0.4, rotY: -1.1, rotZ: -0.5, electrons: 4 }
    ];

    const electronInstances = [];
    const electronCoreGeo = new THREE.SphereGeometry(0.12, 16, 16);

    ringsData.forEach((data) => {
        const orbitPivot = new THREE.Group();
        orbitPivot.rotation.set(data.rotX, data.rotY, data.rotZ);
        atomGroup.add(orbitPivot);

        const segments = 128;
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(theta) * data.radius, 0, Math.sin(theta) * data.radius));
        }

        const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);

        const continuousMat = new THREE.LineBasicMaterial({
            color: data.color,
            linewidth: 1.5,
            transparent: true,
            opacity: 0.20,
            depthTest: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const continuousOrbitLine = new THREE.Line(orbitGeo, continuousMat);
        continuousOrbitLine.renderOrder = 999;
        orbitPivot.add(continuousOrbitLine);

        const baseColor = new THREE.Color(data.color);
        const warmTailColor = new THREE.Color(data.tailColor);

        for (let j = 0; j < data.electrons; j++) {
            const trailParticlesCount = 240;
            const trailGeo = new THREE.BufferGeometry();
            const trailPositions = new Float32Array(trailParticlesCount * 3);
            const trailColors = new Float32Array(trailParticlesCount * 3);
            const trailSizes = new Float32Array(trailParticlesCount);

            trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
            trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
            trailGeo.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));

            const trailMat = new THREE.PointsMaterial({
                size: 0.65,
                map: particleTexture,
                vertexColors: true,
                transparent: true,
                opacity: 0.65,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            const trailPoints = new THREE.Points(trailGeo, trailMat);
            orbitPivot.add(trailPoints);

            const electronPivot = new THREE.Group();

            const coreMesh = new THREE.Mesh(
                electronCoreGeo,
                new THREE.MeshBasicMaterial({ color: 0xffffff })
            );
            electronPivot.add(coreMesh);

            const spriteMat = new THREE.SpriteMaterial({
                map: glowTexture,
                color: 0xffffff,
                transparent: true,
                opacity: 0.7,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const glowSprite = new THREE.Sprite(spriteMat);
            glowSprite.scale.set(1.1, 1.1, 1.1);
            electronPivot.add(glowSprite);

            orbitPivot.add(electronPivot);

            const startAngle = (j / data.electrons) * Math.PI * 2;

            electronInstances.push({
                pivot: electronPivot,
                trailPoints: trailPoints,
                trailPositions: trailPositions,
                trailColors: trailColors,
                trailSizes: trailSizes,
                trailParticlesCount: trailParticlesCount,
                radius: data.radius,
                speed: data.speed,
                angle: startAngle,
                baseColor: baseColor,
                warmTailColor: warmTailColor
            });
        }
    });

    // --- MOUSE INTERACTION SETUP ---
    let targetRotationX = 0;
    let targetRotationY = 0;

    const heroSection = document.getElementById('hero');
    if (heroSection) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

            targetRotationY = normX * 1.2;
            targetRotationX = normY * 0.8;
        });

        heroSection.addEventListener('mouseleave', () => {
            targetRotationX = 0;
            targetRotationY = 0;
        });
    }

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // Model rotation
        const desiredY = elapsedTime * 0.04 + targetRotationY;
        // Frame-rate-independent, quick pointer response for the atomic model.
        const pointerResponse = 1 - Math.exp(-18 * delta);

        atomGroup.rotation.y += (desiredY - atomGroup.rotation.y) * pointerResponse;
        atomGroup.rotation.x += (targetRotationX - atomGroup.rotation.x) * pointerResponse;

        // Quantum cloud rotation
        quantumCloud.rotation.x = elapsedTime * 0.02;
        quantumCloud.rotation.y = -elapsedTime * 0.03;

        // Nucleus rotation
        nucleusGroup.rotation.x = elapsedTime * 0.15;
        nucleusGroup.rotation.y = elapsedTime * 0.2;

        const nucleons = nucleusGroup.children.filter((child) => child.isMesh && child.userData.velocity);
        nucleons.forEach((nucleon) => {
            const { velocity, spinSpeed } = nucleon.userData;
            // A changing, gentle force keeps the nucleons flowing instead of anchored.
            velocity.x += Math.sin(elapsedTime * 1.7 + nucleon.id * 1.9) * delta * 0.12;
            velocity.y += Math.cos(elapsedTime * 1.3 + nucleon.id * 1.4) * delta * 0.12;
            velocity.z += Math.sin(elapsedTime * 1.5 + nucleon.id * 2.3) * delta * 0.12;
            velocity.multiplyScalar(Math.pow(0.992, delta * 60));
            nucleon.position.addScaledVector(velocity, delta);
            const distanceFromCentre = nucleon.position.length();
            const nucleusBoundary = 1.25;
            if (distanceFromCentre > nucleusBoundary) {
                const inward = nucleon.position.clone().normalize();
                nucleon.position.copy(inward.multiplyScalar(nucleusBoundary));
                velocity.addScaledVector(inward, -velocity.dot(inward) * 1.7);
            }
            nucleon.rotation.x += spinSpeed * delta;
            nucleon.rotation.y += spinSpeed * 0.7 * delta;
        });

        // Resolve sphere-to-sphere collisions several times per frame. This keeps the
        // moving protons/neutrons solid: they touch and redirect instead of intersecting.
        const minimumDistance = nucleonRadius * 2;
        for (let pass = 0; pass < 3; pass++) {
            for (let a = 0; a < nucleons.length; a++) {
                for (let b = a + 1; b < nucleons.length; b++) {
                    const first = nucleons[a], second = nucleons[b];
                    const separation = second.position.clone().sub(first.position);
                    const distance = separation.length();
                    if (distance < minimumDistance) {
                        const normal = distance > 0.0001 ? separation.multiplyScalar(1 / distance) : new THREE.Vector3(1, 0, 0);
                        const correction = (minimumDistance - distance) * 0.51;
                        first.position.addScaledVector(normal, -correction);
                        second.position.addScaledVector(normal, correction);
                        const relativeSpeed = second.userData.velocity.clone().sub(first.userData.velocity).dot(normal);
                        if (relativeSpeed < 0) {
                            first.userData.velocity.addScaledVector(normal, relativeSpeed * 0.7);
                            second.userData.velocity.addScaledVector(normal, -relativeSpeed * 0.7);
                        }
                    }
                }
            }
        }

        // Keep the nucleus cohesive: each nucleon is gently drawn to its closest
        // neighbour until their solid surfaces meet, without allowing overlap.
        nucleons.forEach((nucleon) => {
            let closest = null;
            let closestDistance = Infinity;
            nucleons.forEach((other) => {
                if (other === nucleon) return;
                const distance = nucleon.position.distanceTo(other.position);
                if (distance < closestDistance) {
                    closest = other;
                    closestDistance = distance;
                }
            });
            if (closest && closestDistance > minimumDistance) {
                const towardNeighbour = closest.position.clone().sub(nucleon.position).normalize();
                const pull = Math.min(closestDistance - minimumDistance, 0.18) * 3.2;
                nucleon.userData.velocity.addScaledVector(towardNeighbour, pull * delta);
            }
        });

        // Nucleus pulse
        const nucleusPulse = Math.sin(elapsedTime * 1.2) * 0.2 + 3.2;
        nucleusGlowSprite.scale.set(nucleusPulse, nucleusPulse, nucleusPulse);

        electronInstances.forEach((e) => {
            e.angle += 0.003 * e.speed;

            const headX = Math.cos(e.angle) * e.radius;
            const headZ = Math.sin(e.angle) * e.radius;
            e.pivot.position.set(headX, 0, headZ);

            const trailArcLength = 1.8;

            for (let i = 0; i < e.trailParticlesCount; i++) {
                const t = i / (e.trailParticlesCount - 1);
                const trailAngle = e.angle - t * trailArcLength;

                const px = Math.cos(trailAngle) * e.radius;
                const py = 0;
                const pz = Math.sin(trailAngle) * e.radius;

                e.trailPositions[i * 3] = px;
                e.trailPositions[i * 3 + 1] = py;
                e.trailPositions[i * 3 + 2] = pz;

                let color = new THREE.Color();
                if (t < 0.1) {
                    color.set(0xffffff).lerp(e.baseColor, t / 0.1);
                } else {
                    const blendFactor = (t - 0.1) / 0.9;
                    color.copy(e.baseColor).lerp(e.warmTailColor, blendFactor);
                }

                const fade = Math.sin((1.0 - t) * Math.PI * 0.5);
                const alphaCurve = Math.pow(fade, 2.2);

                e.trailColors[i * 3] = color.r * alphaCurve;
                e.trailColors[i * 3 + 1] = color.g * alphaCurve;
                e.trailColors[i * 3 + 2] = color.b * alphaCurve;

                const taper = Math.sin(Math.pow(1.0 - t, 0.5) * Math.PI) * 0.6;
                e.trailSizes[i] = Math.max(taper, 0.01);
            }

            e.trailPoints.geometry.attributes.position.needsUpdate = true;
            e.trailPoints.geometry.attributes.color.needsUpdate = true;
        });

        if (controls) controls.update();
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateCameraView();
    });
}
}

// --- THREE.JS PROCEDURAL SUN ---
const sunCanvas = document.getElementById('sun-canvas');
if (sunCanvas && heroModel === 1 && typeof THREE !== 'undefined') {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas: sunCanvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const sun = new THREE.Group();
    scene.add(sun);

    const surfaceMaterial = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, activeDirection: { value: new THREE.Vector3(0, 0, 1) } },
        vertexShader: `
            varying vec3 vNormal; varying vec3 vPosition;
            uniform float time;
            float hash(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
            float noise(vec3 p) { vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
            void main() {
                vNormal = normal;
                float ripple = noise(normal * 3.2 + time * .08) * .055 + noise(normal * 9.0 - time * .12) * .018;
                vec3 p = position + normal * ripple;
                vPosition = p;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }`,
        fragmentShader: `
            uniform float time; uniform vec3 activeDirection; varying vec3 vNormal; varying vec3 vPosition;
            float hash(vec3 p) { p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
            float noise(vec3 p) { vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
            float fbm(vec3 p) { float n=0.,a=.55; for(int i=0;i<5;i++){n+=a*noise(p);p=p*2.03+3.1;a*=.5;} return n; }
            void main() {
                vec3 p = normalize(vPosition);
                vec3 flow = p * 2.4 + vec3(time*.024, -time*.018, time*.011);
                float broad = fbm(flow);
                float granules = fbm(p * 15. - vec3(time*.055, time*.025, 0.));
                float filaments = fbm(p * 33. + vec3(0., time*.13, 0.));
                float plasma = smoothstep(.31,.70,broad) + smoothstep(.55,.88,granules)*.42;
                float brightBeat = .075 * sin(time * 1.35 + broad * 17. + filaments * 9.);
                float darkBeat = .09 * sin(time * .95 + granules * 14. - broad * 8.);
                float hotThreads = smoothstep(.69 + brightBeat,.86 + brightBeat, filaments) * smoothstep(.36,.78,broad);
                vec3 ember = vec3(.10,.001,.0002), red=vec3(.72,.012,.001), orange=vec3(1.,.105,.003), gold=vec3(1.,.62,.055);
                vec3 color = mix(ember, red, smoothstep(.15,.57,broad));
                color = mix(color, orange, plasma*.72);
                float sunspots = smoothstep(.61 + darkBeat, .83 + darkBeat, 1.0 - granules) * smoothstep(.18,.72,broad);
                color = mix(color, ember * .55, sunspots * (.42 + .34 * sin(time * .95 + filaments * 18.)));
                float activeRegion = pow(max(0., dot(p, activeDirection)), 24.);
                float regionA = pow(max(0., dot(p, normalize(vec3(-.32, -.24, .92)))), 38.);
                float regionB = pow(max(0., dot(p, normalize(vec3(.38, .30, .88)))), 45.);
                float solarLoops = sin((p.x * 31. + p.y * 19. + filaments * 8.) * 2.2) * .5 + .5;
                float activeFire = (activeRegion * (.45 + solarLoops) + regionA + regionB) * (0.45 + hotThreads);
                color = mix(color, gold, hotThreads*.82 + smoothstep(.95,1.22,plasma)*.42 + activeFire*.9);
                float flarePulse = .68 + .32 * sin(time * 1.7 + filaments * 20. + broad * 11.);
                color += vec3(1., .15, .002) * activeFire * flarePulse * .62;
                color *= .78 + granules*.42;
                float limb = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.,0.,1.))), 2.2);
                color += orange * limb * .4;
                gl_FragColor = vec4(color, 1.0);
            }`
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(4.15, 128, 96), surfaceMaterial);
    sun.add(sphere);

    const corona = new THREE.Mesh(new THREE.SphereGeometry(4.52, 96, 64), new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
        vertexShader: 'varying vec3 n; varying vec3 v; void main(){ n=normalize(normalMatrix*normal); v=normalize(-vec3(modelViewMatrix*vec4(position,1.))); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: 'uniform float time; varying vec3 n; varying vec3 v; void main(){ float rim=pow(1.-abs(dot(n,v)),2.35); float bands=sin(n.x*42.+sin(n.y*18.+time*1.7)*5.+time*2.); float flicker=.48+.52*smoothstep(-.25,.9,bands); gl_FragColor=vec4(1.,.055,.002,rim*flicker*.62); }'
    }));
    sun.add(corona);

    const flarePositions = [];
    for (let i = 0; i < 110; i++) {
        const a = Math.random() * Math.PI * 2;
        const z = (Math.random() - .5) * .45;
        const r = Math.sqrt(1 - z * z);
        const direction = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z).normalize();
        const start = direction.clone().multiplyScalar(4.08);
        const end = direction.clone().multiplyScalar(4.28 + Math.pow(Math.random(), 3) * 1.35);
        flarePositions.push(start.x,start.y,start.z,end.x,end.y,end.z);
    }
    const flareGeometry = new THREE.BufferGeometry();
    flareGeometry.setAttribute('position', new THREE.Float32BufferAttribute(flarePositions, 3));
    const flares = new THREE.LineSegments(flareGeometry, new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
            varying float vOuterFade;
            void main() {
                // Each flare begins at the photosphere and becomes transparent beyond it.
                vOuterFade = 1.0 - smoothstep(4.06, 5.62, length(position));
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
        fragmentShader: `
            varying float vOuterFade;
            void main() {
                gl_FragColor = vec4(1.0, 0.11, 0.004, vOuterFade * 0.76);
            }`
    }));
    sun.add(flares);
    const baseFlarePositions = flarePositions.slice();

    // Broken, close-fitting rings read as magnetic plasma paths rather than geometric orbit lines.
    const plasmaRings = [];
    [[0.22, 0.10, 0.16], [-0.35, 0.42, -0.28], [0.58, -0.18, 0.32]].forEach((tilt, index) => {
        const ringPoints = [];
        const segments = 180;
        for (let point = 0; point <= segments; point++) {
            const angle = point / segments * Math.PI * 2;
            const turbulence = Math.sin(angle * 7 + index * 2.1) * .11 + Math.sin(angle * 15 - index) * .045;
            const radius = 4.38 + turbulence;
            ringPoints.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * .94, Math.sin(angle * 3 + index) * .1));
        }
        const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPoints), new THREE.LineBasicMaterial({
            color: index === 1 ? 0xff3b05 : 0xff9410, transparent: true, opacity: .23,
            blending: THREE.AdditiveBlending, depthWrite: false
        }));
        ring.rotation.set(tilt[0], tilt[1], tilt[2]);
        sun.add(ring); plasmaRings.push(ring);
    });

    const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 128;
    const glowContext = glowCanvas.getContext('2d'); const gradient = glowContext.createRadialGradient(64,64,0,64,64,64);
    gradient.addColorStop(0,'rgba(255,190,50,.6)'); gradient.addColorStop(.25,'rgba(255,65,0,.22)'); gradient.addColorStop(1,'rgba(255,20,0,0)');
    glowContext.fillStyle=gradient; glowContext.fillRect(0,0,128,128);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .85 }));
    halo.scale.set(15,15,1); halo.position.z=-.7; sun.add(halo);

    // Distant stars and tiny planet lights create depth behind the solar model.
    const starCanvas = document.createElement('canvas'); starCanvas.width = starCanvas.height = 64;
    const starContext = starCanvas.getContext('2d'); const starGlow = starContext.createRadialGradient(32, 32, 0, 32, 32, 32);
    starGlow.addColorStop(0, 'rgba(255,255,255,1)'); starGlow.addColorStop(.16, 'rgba(255,220,155,.95)'); starGlow.addColorStop(.48, 'rgba(255,130,55,.18)'); starGlow.addColorStop(1, 'rgba(255,90,10,0)');
    starContext.fillStyle = starGlow; starContext.fillRect(0, 0, 64, 64);
    const starTexture = new THREE.CanvasTexture(starCanvas);
    const space = new THREE.Group(); scene.add(space);
    const starCount = 190, starPositions = new Float32Array(starCount * 3), starColors = new Float32Array(starCount * 3);
    const starPalette = [new THREE.Color(0xfff0c2), new THREE.Color(0xff9c78), new THREE.Color(0xffd4a0)];
    for (let i = 0; i < starCount; i++) {
        const x = (Math.random() - .5) * 36, y = (Math.random() - .5) * 22;
        starPositions.set([x, y, -9 - Math.random() * 7], i * 3);
        const color = starPalette[Math.floor(Math.random() * starPalette.length)];
        starColors.set([color.r, color.g, color.b], i * 3);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ map: starTexture, size: .18, vertexColors: true, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending }));
    space.add(stars);
    const backgroundPlanets = new THREE.Group(); space.add(backgroundPlanets);
    [[-10, 4.4, -7, .22, 0x6389b8], [-6.8, -4.2, -8, .68, 0xf04722], [9.4, 3.7, -9, .24, 0xdc3a20], [5.2, -4.6, -8, .16, 0xb82d1d], [11, -3.8, -9, .25, 0x62857a], [13.2, 5.4, -8, .14, 0xc29d5a], [-14, -1.4, -9, .12, 0x7c6aa8]].forEach(([x, y, z, size, color]) => {
        const planet = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTexture, color, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending }));
        planet.position.set(x, y, z); planet.scale.set(size * 5, size * 5, 1); backgroundPlanets.add(planet);
    });

    let mouseX = 0, mouseY = 0, pointerEnergy = 0;
    const hero = document.getElementById('hero');
    hero.addEventListener('mousemove', (event) => {
        const rect=hero.getBoundingClientRect();
        mouseX=((event.clientX-rect.left)/rect.width-.5); mouseY=((event.clientY-rect.top)/rect.height-.5);
        pointerEnergy = 1;
    });
    hero.addEventListener('mouseleave', () => { mouseX=0; mouseY=0; pointerEnergy=0; });
    const clock = new THREE.Clock();
    let autoRotation = 0;
    function resizeSun() {
        const rect = hero.getBoundingClientRect(), mobile = window.innerWidth < 850;
        renderer.setSize(rect.width, rect.height, false); camera.aspect=rect.width/rect.height;
        camera.position.set(0,0,22); sun.position.set(mobile ? 0 : 6.65, mobile ? -.4 : 0, 0); sun.scale.setScalar(mobile ? .78 : 1.08);
        camera.updateProjectionMatrix();
    }
    function animateSun() {
        requestAnimationFrame(animateSun); const t=clock.getElapsedTime();
        surfaceMaterial.uniforms.time.value=t; corona.material.uniforms.time.value=t;
        pointerEnergy += (Math.min(1, Math.abs(mouseX) + Math.abs(mouseY)) - pointerEnergy) * .05;
        const activeDirection = new THREE.Vector3(mouseX * 1.15, -mouseY * 1.15, 1).normalize();
        surfaceMaterial.uniforms.activeDirection.value.lerp(activeDirection, .16);
        autoRotation += .0028;
        sun.rotation.y += (autoRotation + mouseX * 1.22 - sun.rotation.y) * .12;
        sun.rotation.x += (-mouseY * .92 - sun.rotation.x) * .12;
        sun.rotation.z += (mouseX * .24 - sun.rotation.z) * .09;
        flares.rotation.y += (mouseX * .95 + t*.035 - flares.rotation.y) * .10;
        flares.rotation.x += (-mouseY * .72 - flares.rotation.x) * .12;
        const flareAttribute = flareGeometry.attributes.position;
        for (let i = 0; i < flarePositions.length; i += 6) {
            const directionX = baseFlarePositions[i + 3], directionY = baseFlarePositions[i + 4], directionZ = baseFlarePositions[i + 5];
            const facingPointer = Math.max(0, directionX * mouseX * .8 - directionY * mouseY * .8 + directionZ * .34);
            const pulse = 1 + (facingPointer * pointerEnergy + Math.sin(t * 3.2 + i) * .08) * .28;
            flareAttribute.array[i + 3] = directionX * pulse;
            flareAttribute.array[i + 4] = directionY * pulse;
            flareAttribute.array[i + 5] = directionZ * pulse;
        }
        flareAttribute.needsUpdate = true;
        plasmaRings.forEach((ring, index) => {
            ring.rotation.z += .0007 * (index + 1) + mouseX * .0009;
            ring.rotation.x += (-mouseY * .24 - ring.rotation.x * .02) * .075;
        });
        space.rotation.y += (mouseX * .045 - space.rotation.y) * .02;
        space.rotation.x += (-mouseY * .03 - space.rotation.x) * .02;
        backgroundPlanets.rotation.y += .00055;
        backgroundPlanets.rotation.z = Math.sin(t * .16) * .025;
        halo.material.opacity=.74+Math.sin(t*1.8)*.1 + pointerEnergy*.08;
        renderer.render(scene,camera);
    }
    resizeSun(); animateSun(); window.addEventListener('resize',resizeSun);
}

// Retired black-hole experiment (not loaded or included in hero rotation).
if (false && sunCanvas && typeof THREE !== 'undefined') {
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas: sunCanvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    const hole = new THREE.Group(); scene.add(hole);
    hole.add(new THREE.Mesh(new THREE.SphereGeometry(2.25,80,64),new THREE.MeshBasicMaterial({color:0x010306})));
    hole.add(new THREE.Mesh(new THREE.SphereGeometry(2.43,80,64),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,vertexShader:'varying vec3 n;varying vec3 v;void main(){n=normalize(normalMatrix*normal);v=normalize(-vec3(modelViewMatrix*vec4(position,1.)));gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 n;varying vec3 v;void main(){float r=pow(1.-abs(dot(n,v)),4.);gl_FragColor=vec4(.12,.72,1.,r*.72);}'})));
    const disk = new THREE.Mesh(new THREE.RingGeometry(2.32,7.15,256,12),new THREE.ShaderMaterial({uniforms:{time:{value:0},pointer:{value:0}},transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:'varying float r;varying float a;uniform float time;void main(){r=length(position.xy);a=atan(position.y,position.x);vec3 p=position;p.z+=sin(a*9.+time*2.)*.08*(1.-smoothstep(2.3,7.1,r));gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'uniform float time;uniform float pointer;varying float r;varying float a;void main(){float edge=smoothstep(2.32,2.75,r)*(1.-smoothstep(5.,7.15,r));float stripe=.42+.58*sin(a*36.-r*10.+time*4.+sin(a*7.)*3.);float f=smoothstep(.35,.9,stripe);vec3 c=mix(vec3(.015,.16,.29),vec3(.35,.9,1.),f);c+=vec3(.18,.65,1.)*pointer*.25;gl_FragColor=vec4(c,edge*(.16+.72*f));}'}));
    disk.rotation.x=1.22; hole.add(disk);
    const rings=new THREE.Group(); hole.add(rings);
    [2.62,2.86,3.16].forEach((radius,index)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.018+index*.011,10,180),new THREE.MeshBasicMaterial({color:index===0?0xd5f8ff:0x3baee8,transparent:true,opacity:.65-index*.15,blending:THREE.AdditiveBlending,depthWrite:false}));ring.scale.y=1.2;rings.add(ring);});
    const starsGeo=new THREE.BufferGeometry(), count=175, positions=new Float32Array(count*3), colors=new Float32Array(count*3);
    for(let i=0;i<count;i++){positions.set([(Math.random()-.5)*35,(Math.random()-.5)*22,-8-Math.random()*6],i*3);const c=.45+Math.random()*.45;colors.set([c,c*.9,1],i*3);} starsGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));starsGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({size:.09,vertexColors:true,transparent:true,opacity:.72,depthWrite:false}));scene.add(stars);
    [[-11,4,-7,.22,0xe04c45],[10,-3,-8,.17,0x6289d6],[-14,-4,-9,.13,0xd0a05a]].forEach(([x,y,z,size,color])=>{const planet=new THREE.Mesh(new THREE.SphereGeometry(size,16,16),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8}));planet.position.set(x,y,z);scene.add(planet);});
    let mouseX=0,mouseY=0,spin=0; const hero=document.getElementById('hero'),clock=new THREE.Clock();
    hero.addEventListener('mousemove',event=>{const rect=hero.getBoundingClientRect();mouseX=(event.clientX-rect.left)/rect.width-.5;mouseY=(event.clientY-rect.top)/rect.height-.5;});hero.addEventListener('mouseleave',()=>{mouseX=0;mouseY=0;});
    function resizeHole(){const rect=hero.getBoundingClientRect(),mobile=window.innerWidth<850;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.position.set(0,0,22);hole.position.set(mobile?0:6.45,mobile?-.35:0,0);hole.scale.setScalar(mobile?.8:1.08);camera.updateProjectionMatrix();}
    function animateHole(){requestAnimationFrame(animateHole);const time=clock.getElapsedTime();spin+=.0027;disk.material.uniforms.time.value=time;disk.material.uniforms.pointer.value=Math.min(1,Math.abs(mouseX)+Math.abs(mouseY));hole.rotation.y+=(spin+mouseX*1.25-hole.rotation.y)*.12;hole.rotation.x+=(-mouseY*.82-hole.rotation.x)*.12;hole.rotation.z+=(mouseX*.2-hole.rotation.z)*.08;disk.rotation.z+=.01+mouseX*.012;rings.rotation.y+=(mouseX*.4-rings.rotation.y)*.08;rings.rotation.x+=(-mouseY*.26-rings.rotation.x)*.08;stars.rotation.y+=(mouseX*.035-stars.rotation.y)*.015;renderer.render(scene,camera);}
    resizeHole();animateHole();window.addEventListener('resize',resizeHole);
}

document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('execTrack');
    const prevBtn = document.getElementById('execPrev');
    const nextBtn = document.getElementById('execNext');
    if (!track || !prevBtn || !nextBtn) return;
    const cards = track.querySelectorAll('.exec-card');

    let currentIndex = 0;

    function getVisibleCardsCount() {
        return window.innerWidth <= 768 ? 1 : 3;
    }

    function updateSliderPosition() {
        if (cards.length === 0) return;
        const visibleCards = getVisibleCardsCount();
        const maxIndex = cards.length - visibleCards;

        if (currentIndex < 0) currentIndex = 0;
        if (currentIndex > maxIndex) currentIndex = maxIndex;

        const cardWidth = cards[0].getBoundingClientRect().width;
        const gap = 20; // Matches flex gap
        const offset = currentIndex * (cardWidth + gap);

        track.style.transform = `translateX(-${offset}px)`;
    }

    nextBtn.addEventListener('click', () => {
        const visibleCards = getVisibleCardsCount();
        if (currentIndex < cards.length - visibleCards) {
            currentIndex += visibleCards; // Advance by 3 cards
            updateSliderPosition();
        }
    });

    prevBtn.addEventListener('click', () => {
        const visibleCards = getVisibleCardsCount();
        if (currentIndex > 0) {
            currentIndex -= visibleCards; // Retreat by 3 cards
            updateSliderPosition();
        }
    });

    window.addEventListener('resize', updateSliderPosition);
});

document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.exec-slider-wrapper');
    const track = document.getElementById('execTrack');
    const prevBtn = document.getElementById('execPrev');
    const nextBtn = document.getElementById('execNext');
    const dotsContainer = document.getElementById('execDots');
    if (!track || !wrapper || !prevBtn || !nextBtn || !dotsContainer) return;
    const cards = track.querySelectorAll('.exec-card');

    let currentStep = 0;
    let autoSlideInterval = null;
    let execIsOnScreen = false;

    function getVisibleCardsCount() {
        return window.innerWidth <= 768 ? 1 : 3;
    }

    function getTotalSteps() {
        return Math.ceil(cards.length / getVisibleCardsCount());
    }

    function createDots() {
        dotsContainer.innerHTML = '';
        const totalSteps = getTotalSteps();

        for (let i = 0; i < totalSteps; i++) {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (i === currentStep) dot.classList.add('active');
            dot.addEventListener('click', () => {
                currentStep = i;
                updateSliderPosition();
                resetAutoSlide();
            });
            dotsContainer.appendChild(dot);
        }
    }

    function updateSliderPosition() {
        if (cards.length === 0) return;
        const visibleCards = getVisibleCardsCount();
        const cardWidth = cards[0].getBoundingClientRect().width;
        const gap = 20;

        const offset = currentStep * visibleCards * (cardWidth + gap);
        track.style.transform = `translateX(-${offset}px)`;

        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentStep);
        });
    }

    function nextSlide() {
        if (currentStep < getTotalSteps() - 1) {
            currentStep++;
        } else {
            currentStep = 0;
        }
        updateSliderPosition();
    }

    function prevSlide() {
        if (currentStep > 0) {
            currentStep--;
        } else {
            currentStep = getTotalSteps() - 1;
        }
        updateSliderPosition();
    }

    function startAutoSlide() {
        if (!execIsOnScreen) return;
        if (!autoSlideInterval) {
            autoSlideInterval = setInterval(nextSlide, 3000);
        }
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }

    function resetAutoSlide() {
        stopAutoSlide();
        startAutoSlide();
    }

    nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoSlide();
    });

    prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoSlide();
    });

    wrapper.addEventListener('mouseenter', stopAutoSlide);
    wrapper.addEventListener('mouseleave', startAutoSlide);
    wrapper.addEventListener('touchstart', stopAutoSlide, { passive: true });
    wrapper.addEventListener('touchend', startAutoSlide, { passive: true });
    wrapper.addEventListener('touchcancel', startAutoSlide, { passive: true });

    window.addEventListener('resize', () => {
        createDots();
        updateSliderPosition();
    });

    const execVisibilityObserver = new IntersectionObserver((entries) => {
        execIsOnScreen = entries[0].isIntersecting;
        if (execIsOnScreen) {
            startAutoSlide();
        } else {
            stopAutoSlide();
        }
    }, { threshold: 0.2 });

    execVisibilityObserver.observe(wrapper);

    createDots();
});

// Carousel Autoplay & Viewport Intersection Controls
document.addEventListener('DOMContentLoaded', () => {
    /**
     * Helper Function to setup auto-scrolling carousels that start 
     * sliding only after their respective section is visible in the viewport.
     */
    function setupViewportCarousel({
        sectionId,
        trackId,
        prevBtnId,
        nextBtnId,
        dotsId,
        itemSelector,
        autoScrollInterval = 4000
    }) {
        const section = document.getElementById(sectionId);
        const track = document.getElementById(trackId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        const dotsContainer = document.getElementById(dotsId);

        if (!section || !track) return;

        let currentIndex = 0;
        let timer = null;
        let isHovered = false;

        const getItemsPerPage = () => {
            if (window.innerWidth <= 768) return 1;
            if (window.innerWidth <= 968 && sectionId === 'gallery-section') return 2;
            return 3;
        };

        const getItems = () => track.querySelectorAll(itemSelector);

        const getMaxIndex = () => {
            const items = getItems();
            const itemsPerPage = getItemsPerPage();
            return Math.max(0, items.length - itemsPerPage);
        };

        // Render Dots
        const renderDots = () => {
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';
            const maxIdx = getMaxIndex();

            for (let i = 0; i <= maxIdx; i++) {
                const dot = document.createElement('button');
                dot.classList.add(dotsId.includes('exec') || dotsId.includes('gallery') ? 'dot' : 'msg-dot');
                if (i === currentIndex) dot.classList.add('active');
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.addEventListener('click', () => {
                    currentIndex = i;
                    updateCarousel();
                    resetTimer();
                });
                dotsContainer.appendChild(dot);
            }
        };

        // Update Slide Position
        const updateCarousel = () => {
            const items = getItems();
            if (!items.length) return;

            const itemsPerPage = getItemsPerPage();
            const gap = 20; // Default gap matching CSS
            const itemWidth = items[0].getBoundingClientRect().width;
            const moveAmount = (itemWidth + gap) * currentIndex;

            track.style.transform = `translateX(-${moveAmount}px)`;

            // Update Dot Active States
            if (dotsContainer) {
                const dots = dotsContainer.children;
                Array.from(dots).forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === currentIndex);
                });
            }

            // Disable/Enable Buttons
            if (prevBtn) prevBtn.disabled = currentIndex === 0;
            if (nextBtn) nextBtn.disabled = currentIndex >= getMaxIndex();
        };

        const nextSlide = () => {
            const maxIdx = getMaxIndex();
            if (currentIndex < maxIdx) {
                currentIndex++;
            } else {
                currentIndex = 0; // Loop back to start
            }
            updateCarousel();
        };

        const prevSlide = () => {
            if (currentIndex > 0) {
                currentIndex--;
            } else {
                currentIndex = getMaxIndex();
            }
            updateCarousel();
        };

        // Auto Rotation Timer Management
        const startTimer = () => {
            if (!timer && !isHovered) {
                timer = setInterval(nextSlide, autoScrollInterval);
            }
        };

        const stopTimer = () => {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        };

        const resetTimer = () => {
            stopTimer();
            startTimer();
        };

        // Event Listeners
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                resetTimer();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                resetTimer();
            });
        }

        // Pause rotation when user hovers or touches the section
        section.addEventListener('mouseenter', () => {
            isHovered = true;
            stopTimer();
        });

        section.addEventListener('mouseleave', () => {
            isHovered = false;
            startTimer();
        });

        section.addEventListener('touchstart', () => {
            isHovered = true;
            stopTimer();
        }, { passive: true });

        const resumeAfterTouch = () => {
            isHovered = false;
            startTimer();
        };
        section.addEventListener('touchend', resumeAfterTouch, { passive: true });
        section.addEventListener('touchcancel', resumeAfterTouch, { passive: true });

        // Intersection Observer: Start auto-scrolling ONLY when section becomes visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startTimer();
                } else {
                    stopTimer();
                }
            });
        }, { threshold: 0.2 });

        observer.observe(section);

        // Handle Responsive Resizing
        window.addEventListener('resize', () => {
            if (currentIndex > getMaxIndex()) {
                currentIndex = getMaxIndex();
            }
            renderDots();
            updateCarousel();
        });

        // Initial setup
        renderDots();
        updateCarousel();
    }

    // Initialize Auto-Scrolling for Photos Gallery Section
    setupViewportCarousel({
        sectionId: 'gallery-section',
        trackId: 'galleryTrack',
        prevBtnId: 'galleryPrev',
        nextBtnId: 'galleryNext',
        dotsId: 'galleryDots',
        itemSelector: '.gallery-item',
        autoScrollInterval: 3500
    });

    // Initialize Auto-Scrolling for Messages Leader Section
    setupViewportCarousel({
        sectionId: 'messages-section',
        trackId: 'msgTrack',
        prevBtnId: 'msgPrev',
        nextBtnId: 'msgNext',
        dotsId: 'msgDots',
        itemSelector: '.message-card',
        autoScrollInterval: 5000
    });

    // Auto-Scrolling configuration for Executive Committee Section
    setupViewportCarousel({
        sectionId: 'executive-committee-section',
        trackId: 'execTrack',
        prevBtnId: 'execPrev',
        nextBtnId: 'execNext',
        dotsId: 'execDots',
        itemSelector: '.exec-card',
        autoScrollInterval: 4000
    });

    // Make sure starting index defaults to 0
    let currentExecIndex = 0;
});


function renderExecDots() {
    const dotsContainer = document.getElementById('execDots');
    if (!dotsContainer) return;

    // Clear previous dots before generating new ones
    dotsContainer.innerHTML = '';

    const cards = document.querySelectorAll('.exec-card');
    const isMobile = window.innerWidth <= 768;
    const cardsPerPage = isMobile ? 1 : 3;
    const totalPages = Math.ceil(cards.length / cardsPerPage);

    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToPage(i));
        dotsContainer.appendChild(dot);
    }
}

function updateCarouselDots(activeIndex) {
    const dotsContainer = document.getElementById('execDots');
    if (!dotsContainer) return;

    // 1. Clear existing dots to prevent infinite stacking
    dotsContainer.innerHTML = '';

    const cards = document.querySelectorAll('.exec-card');
    const cardsPerPage = window.innerWidth <= 768 ? 1 : 3;
    const totalPages = Math.ceil(cards.length / cardsPerPage);

    // 2. Generate exactly totalPages dots
    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('span');
        dot.className = `dot ${i === activeIndex ? 'active' : ''}`;
        dot.addEventListener('click', () => scrollToPage(i));
        dotsContainer.appendChild(dot);
    }
}

// Skip loader if the user is just refreshing the page in the same session
if (sessionStorage.getItem('hasSeenLoaderThisSession')) {
    document.documentElement.classList.add('skip-loader');
}
// Record the start time of the load
window.loaderStartTime = Date.now();

// The event title in events.html controls whether the running-event card is shown.
document.addEventListener('DOMContentLoaded', () => {
    const title = document.getElementById('runningEventTitle');
    const card = document.getElementById('runningEventCard');
    const emptyState = document.getElementById('runningEventEmpty');

    if (!title || !card || !emptyState) return;

    const hasRunningEvent = title.textContent.trim().length > 0;
    card.hidden = !hasRunningEvent;
    emptyState.hidden = hasRunningEvent;
});
