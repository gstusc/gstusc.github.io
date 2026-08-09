// Universal Particle Engine configuration helper
function initializeParticles(containerElement, canvasElement) {
    if (!containerElement || !canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    let particlesArray = [];
    
    const mouse = {
        x: null,
        y: null,
        radius: 120 
    };

    function resizeCanvas() {
        canvasElement.width = containerElement.offsetWidth;
        canvasElement.height = containerElement.offsetHeight;
        initParticles();
    }

    containerElement.addEventListener('mousemove', (e) => {
        const rect = containerElement.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    containerElement.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

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
        if (numberOfParticles < 15) numberOfParticles = 15; 

        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1;
            let x = Math.random() * (canvasElement.width - size * 2) + size;
            let y = Math.random() * (canvasElement.height - size * 2) + size;
            
            // Random speed and unlinked 360-degree direction vector
            let speed = Math.random() * 0.6 + 0.2;
            let angle = Math.random() * Math.PI * 2;
            
            let directionX = Math.cos(angle) * speed;
            let directionY = Math.sin(angle) * speed;
            
            let color = 'rgba(0, 168, 255, ' + (Math.random() * 0.4 + 0.3) + ')';

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connectNodes();
    }

    function connectNodes() {
        let maxDistance = 65;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    let opacity = (1 - (distance / maxDistance)) * 0.12;
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

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
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
                <a href="index.html" class="logo"> <img src="image/logo.webp" height="35px" width="35px"> GSTU Science Club</a>
                
                <button class="menu-toggle" aria-label="Toggle Navigation Menu" style="display: none;">
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
                            <button class="theme-toggle-btn" id="themeToggleBtn" aria-label="Toggle Dark and Light Mode">
                                <span class="theme-icon"></span> <span class="theme-text">Dark</span>
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

        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            menuToggle.classList.toggle('open');
            navMenu.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
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
        });

        dropdownTrigger.addEventListener('click', (e) => {
            if (window.innerWidth <= 900) {
                e.preventDefault(); 
                dropdownMenu.classList.toggle('open');
                
                const arrow = dropdownTrigger.querySelector('.dropdown-arrow');
                if(arrow) {
                    arrow.style.transform = dropdownMenu.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            }
        });

        const themeBtn = this.querySelector('#themeToggleBtn');
        const themeIcon = themeBtn.querySelector('.theme-icon');
        const themeText = themeBtn.querySelector('.theme-text');
        
        const savedTheme = localStorage.getItem('gstu-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeButtonUI(savedTheme);

        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('gstu-theme', newTheme);
            updateThemeButtonUI(newTheme);
        });

        function updateThemeButtonUI(theme) {
            if (theme === 'dark') {
                themeIcon.innerHTML = sunIcon;
                themeText.textContent = 'Light';
            } else {
                themeIcon.innerHTML = moonIcon;
                themeText.textContent = 'Dark';
            }
        }

        const links = this.querySelectorAll('#nav-links a');
        let currentPath = window.location.pathname.split('/').pop();
        if (currentPath === "" || currentPath === "index.html") {
            currentPath = "index.html";
        }
        
        let isSubPageActive = false;
        const committeeSubPages = ["advisor.html", "standing-committee.html", "committee.html", "alumni.html", "teams.html"];

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
        initializeParticles(headerContainer, headerCanvas);
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
            dot.setAttribute('aria-label', `Go to leader slide ${i + 1}`);
            dot.addEventListener('click', () => {
                currentMsgIndex = i;
                updateMsgSlider();
                resetMsgAutoSlide();
            });
            msgDotsContainer.appendChild(dot);
        });
    }

    function updateMsgSlider() {
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

    msgViewport.addEventListener('touchstart', touchStart);
    msgViewport.addEventListener('touchend', touchEnd);
    msgViewport.addEventListener('touchmove', touchMove);

    msgViewport.addEventListener('mousedown', touchStart);
    msgViewport.addEventListener('mouseup', touchEnd);
    msgViewport.addEventListener('mouseleave', () => { if (isDragging) touchEnd(); });
    msgViewport.addEventListener('mousemove', touchMove);

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

    setTimeout(() => {
        updateMsgSlider();
        startMsgAutoSlide();
    }, 100);
}

class UniversalFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <style>
            .footer-logo-link {
                display: flex !important;
                justify-content: flex-start;
                margin-bottom: 15px;
            }
            @media (max-width: 900px) {
                .footer-logo-link {
                    justify-content: center !important;
                }
            }
        </style>
        <footer>
            <canvas class="particle-canvas"></canvas>
            <div class="footer-container">
                <div class="footer-col">
                    <a href="index.html" class="logo footer-logo-link"> 
                        <img src="image/logo.webp" height="60px" width="60px">
                    </a>
                    <h3>GSTU Science Club</h3>
                    <p>Inspiring innovation, research, and technical excellence among the bright minds of GSTU. Your workspace to shape tomorrow.</p>
                </div>
                
                <div class="footer-col">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="index.html">Home</a></li>
                        <li><a href="about.html">About Club</a></li>
                        <li><a href="events.html">Events & Fairs</a></li>
                        <li><a href="teams.html">Our Divisions</a></li>
                    </ul>
                </div>
                
                <div class="footer-col">
                    <h3>Resources</h3>
                    <ul>
                        <li><a href="committee.html">Executive Committee</a></li>
                        <li><a href="advisor.html">Advisor Panel</a></li>
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
                        <a href="https://www.facebook.com/GSTUSC" target="_blank" aria-label="Facebook"><img src="image/facebook.webp" width="35px" height="35px"></a>
                        <a href="https://www.linkedin.com/company/gstu-science-club" target="_blank" aria-label="LinkedIn"><img src="image/linkedin.webp" width="35px" height="35px"></a>
                        <a href="https://www.youtube.com/@gstuscienceclub" target="_blank" aria-label="YouTube"><img src="image/youtube.webp" width="35px" height="35px"></a>
                        <a href="https://www.facebook.com/groups/bsmrstusc" target="_blank" aria-label="Facebook Group"><img src="image/facebook.webp" width="35px" height="35px"></a>
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
        initializeParticles(footerContainer, footerCanvas);
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
        startAutoSlide();
    }, 150);
}

// --- GALLERY FULL-SIZE IMAGE MODAL HANDLER ---
const galleryModal = document.getElementById('galleryModal');
const modalImg = document.getElementById('modalImg');
const modalCaption = document.getElementById('modalCaption');
const modalClose = document.getElementById('modalClose');

if (galleryModal && modalImg && modalClose) {
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const caption = item.querySelector('.gallery-caption');

            if (img) {
                modalImg.src = img.src;
                modalImg.alt = img.alt || 'Full View Image';
                modalCaption.textContent = caption ? caption.textContent : (img.alt || '');

                galleryModal.classList.add('show');
                galleryModal.setAttribute('aria-hidden', 'false');
            }
        });
    });

    const closeModal = () => {
        galleryModal.classList.remove('show');
        galleryModal.setAttribute('aria-hidden', 'true');
    };

    modalClose.addEventListener('click', closeModal);

    galleryModal.addEventListener('click', (e) => {
        if (e.target === galleryModal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && galleryModal.classList.contains('show')) {
            closeModal();
        }
    });
}

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

    counters.forEach((counter) => {
        if (counter.classList.contains('counted')) return;
        counter.classList.add('counted');

        const target = +counter.getAttribute('data-target');
        const suffix = counter.getAttribute('data-suffix') || '';
        const duration = 2000; 
        const frameDuration = 1000 / 60; 
        const totalFrames = Math.round(duration / frameDuration);

        let frame = 0;

        const countUp = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const currentCount = Math.round(target * (1 - Math.pow(1 - progress, 3)));

            counter.innerText = currentCount + suffix;

            if (frame >= totalFrames) {
                counter.innerText = target + suffix;
                clearInterval(countUp);
            }
        }, frameDuration);
    });
}

// --- INTERSECTION OBSERVER & GENERAL SCROLL REVEAL ---
document.addEventListener('DOMContentLoaded', () => {
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

    const elementsToReveal = document.querySelectorAll('.reveal-on-scroll');
    elementsToReveal.forEach(el => scrollObserver.observe(el));
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

const glowTexture = createGlowTexture();
const particleTexture = createParticleTexture();

// --- THREE.JS ATOM CANVAS INITIALIZATION ---
const canvas = document.getElementById('atom-canvas');
if (canvas && typeof THREE !== 'undefined') {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    28,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;

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
  atomGroup.position.set(0, -0.5, 0);

  // Scale down the atom model to 90% of original size
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
  const particleGeo = new THREE.SphereGeometry(0.32, 16, 16);

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

  const count = 26;
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(particleGeo, i % 2 === 0 ? mat1 : mat2);
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    const r = 0.75;

    mesh.position.set(
      r * Math.cos(theta) * Math.sin(phi) + (Math.random() - 0.5) * 0.15,
      r * Math.sin(theta) * Math.sin(phi) + (Math.random() - 0.5) * 0.15,
      r * Math.cos(phi) + (Math.random() - 0.5) * 0.15
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

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    atomGroup.rotation.y = elapsedTime * 0.12;
    quantumCloud.rotation.x = elapsedTime * 0.05;
    quantumCloud.rotation.y = -elapsedTime * 0.08;

    nucleusGroup.rotation.x = elapsedTime * 0.4;
    nucleusGroup.rotation.y = elapsedTime * 0.5;

    const nucleusPulse = Math.sin(elapsedTime * 2.5) * 0.2 + 3.2;
    nucleusGlowSprite.scale.set(nucleusPulse, nucleusPulse, nucleusPulse);

    electronInstances.forEach((e) => {
      e.angle += 0.007 * e.speed;

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

    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateCameraView();
  });
}