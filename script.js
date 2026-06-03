// ============ SMOOTH SCROLLING & NAVIGATION ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ============ NAVBAR ACTIVE STATE ============
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollY >= sectionTop - 300) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// ============ CAROUSEL FUNCTIONALITY ============
const prevBtn = document.querySelector('.carousel-btn.prev');
const nextBtn = document.querySelector('.carousel-btn.next');
const reviewsContainer = document.querySelector('.reviews-container');

if (prevBtn && nextBtn && reviewsContainer) {
    prevBtn.addEventListener('click', () => {
        reviewsContainer.scrollBy({
            left: -200,
            behavior: 'smooth'
        });
    });

    nextBtn.addEventListener('click', () => {
        reviewsContainer.scrollBy({
            left: 200,
            behavior: 'smooth'
        });
    });
}

// ============ HAMBURGER MENU ============
const hamburgerMenu = document.querySelector('.hamburger-menu');
const mobileNavPanel = document.querySelector('.mobile-nav-panel');

if (hamburgerMenu && mobileNavPanel) {
    hamburgerMenu.addEventListener('click', () => {
        const isHidden = mobileNavPanel.getAttribute('aria-hidden') === 'true';
        mobileNavPanel.setAttribute('aria-hidden', !isHidden);
        hamburgerMenu.classList.toggle('active');
    });

    // Close menu on link click
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileNavPanel.setAttribute('aria-hidden', 'true');
            hamburgerMenu.classList.remove('active');
        });
    });
}
// ============ ADD SCROLL ANIMATIONS ============
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe service cards, testimonials, blog cards
document.querySelectorAll('.service-card, .testimonial-card, .blog-card, .doctor-card').forEach(element => {
    element.style.opacity = '0';
    observer.observe(element);
});

// Add animation styles
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(animationStyle);

// ============ COUNTER ANIMATION ============
function animateCounters() {
    const stats = document.querySelectorAll('.about-stats .stat h3');
    
    stats.forEach(stat => {
        const target = parseInt(stat.textContent);
        const isPercentage = stat.textContent.includes('%');
        const isK = stat.textContent.includes('K');
        const isDecimal = stat.textContent.includes('.');
        
        let current = 0;
        const increment = target / 50;
        
        const counter = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(counter);
            }
            
            if (isPercentage) {
                stat.textContent = Math.floor(current) + '%';
            } else if (isK) {
                stat.textContent = (current / 1000).toFixed(0) + 'K';
            } else if (isDecimal) {
                stat.textContent = current.toFixed(1);
            } else {
                stat.textContent = Math.floor(current);
            }
        }, 30);
    });
}

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const aboutSection = document.querySelector('.about-stats');
if (aboutSection) {
    statsObserver.observe(aboutSection);
}

// ============ PARALLAX EFFECT ============
window.addEventListener('scroll', () => {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.transform = `translateY(${window.scrollY * 0.5}px)`;
    }
});

// ============ MOBILE RESPONSIVE STYLES ============
if (window.innerWidth <= 768) {
    const style = document.createElement('style');
    style.textContent = `
        .navbar-menu {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            flex-direction: column;
            padding: 1rem;
            gap: 1rem;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
            display: none !important;
        }
    `;
    document.head.appendChild(style);
}

// ============ PAGE LOAD ANIMATION ============
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// Set initial opacity to 0 for fade-in effect
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.5s ease';
document.body.style.opacity = '1';
document.body.style.opacity = '1';