// Global JavaScript for Quintana Notary & Signing
// Handles language switching, mobile menu, and interactive elements

// ============================================
// LANGUAGE TOGGLE FUNCTION
// ============================================
function toggleLanguage(specificLang) {
    const enElements = document.querySelectorAll('[id$="-en"]');
    const esElements = document.querySelectorAll('[id$="-es"]');
    
    // Determine new language: use passed argument OR toggle current
    const currentLang = document.documentElement.lang;
    const newLang = specificLang ? specificLang : (currentLang === 'es' ? 'en' : 'es');
    
    // Update HTML lang attribute
    document.documentElement.lang = newLang;
    
    // Show/hide elements based on language
    enElements.forEach(el => {
        el.style.display = (newLang === 'en') ? '' : 'none';
    });
    
    esElements.forEach(el => {
        el.style.display = (newLang === 'es') ? '' : 'none';
    });
    
    // Update the language button specifically
    const langBtnEn = document.getElementById('lang-btn-en');
    const langBtnEs = document.getElementById('lang-btn-es');
    
    if (langBtnEn && langBtnEs) {
        if (newLang === 'es') {
            langBtnEs.style.display = '';
            langBtnEn.style.display = 'none';
        } else {
            langBtnEs.style.display = 'none';
            langBtnEn.style.display = '';
        }
    }

    // Save language preference to localStorage
    try {
        localStorage.setItem('preferredLanguage', newLang);
    } catch (e) {
        console.warn('Could not save language preference:', e);
    }
}

// ============================================
// INITIALIZE LANGUAGE ON PAGE LOAD
// ============================================
function initLanguage() {
    let savedLang = null;
    
    try {
        savedLang = localStorage.getItem('preferredLanguage');
    } catch (e) {
        console.warn('Could not access localStorage:', e);
    }
    
    // Set initial language to 'es' if not set
    if (!document.documentElement.lang) {
        document.documentElement.lang = 'es';
    }

    // If saved language exists and differs from current, toggle
    if (savedLang && savedLang !== document.documentElement.lang) {
        toggleLanguage(savedLang);
    }
}

// ============================================
// MOBILE HAMBURGER MENU TOGGLE
// ============================================
function toggleMenu() {
    const nav = document.getElementById('main-nav');
    const hamburger = document.querySelector('.hamburger');
    
    console.log('Toggle menu called'); // Debug log
    
    if (nav) {
        const isActive = nav.classList.contains('active');
        console.log('Menu active before toggle:', isActive); // Debug log
        
        nav.classList.toggle('active');
        
        console.log('Menu active after toggle:', nav.classList.contains('active')); // Debug log
    }
    
    if (hamburger) {
        hamburger.classList.toggle('active');
        
        // Accessibility: Update aria-expanded
        const expanded = hamburger.getAttribute('aria-expanded') === 'true' || false;
        hamburger.setAttribute('aria-expanded', !expanded);
    }
    
    // Prevent body scroll when menu is open on mobile
    if (nav && nav.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// ============================================
// CLOSE MOBILE MENU ON LINK CLICK
// ============================================
function closeMobileMenuOnClick() {
    const navLinks = document.querySelectorAll('#main-nav a');
    const nav = document.getElementById('main-nav');
    const hamburger = document.querySelector('.hamburger');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                if (nav) nav.classList.remove('active');
                if (hamburger) hamburger.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
}

// ============================================
// CLOSE MOBILE MENU ON OUTSIDE CLICK
// ============================================
function closeMobileMenuOnOutsideClick() {
    document.addEventListener('click', (e) => {
        const nav = document.getElementById('main-nav');
        const hamburger = document.querySelector('.hamburger');
        const header = document.querySelector('header');
        
        if (window.innerWidth <= 768 && nav && hamburger && nav.classList.contains('active')) {
            if (!header.contains(e.target) && !hamburger.contains(e.target)) {
                nav.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });
}

// ============================================
// FAQ ACCORDION TOGGLE FUNCTION
// ============================================
function toggleFaq(element) {
    const question = element;
    const answer = question.nextElementSibling;
    
    if (!answer) return;

    question.classList.toggle('active');
    
    if (answer.style.maxHeight) {
        answer.style.maxHeight = null;
        question.setAttribute('aria-expanded', 'false');
    } else {
        answer.style.maxHeight = answer.scrollHeight + "px";
        question.setAttribute('aria-expanded', 'true');
    }
}

// ============================================
// INITIALIZE FAQ ACCORDION
// ============================================
function initFaqAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        if (question.tagName.toLowerCase() === 'summary') {
            console.warn('FAQ Question is a <summary> tag. Using native <details> functionality.');
        }

        if (question.hasAttribute('data-listener')) return;

        question.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFaq(question);
        });
        
        question.setAttribute('aria-expanded', 'false');
        question.setAttribute('data-listener', 'true'); 
        
        const answer = question.nextElementSibling;
        if (answer && !answer.style.maxHeight) {
             answer.style.maxHeight = null;
        }
    });
}

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            if (href === '#' || href === '#!') {
                e.preventDefault();
                return;
            }
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                
                const nav = document.getElementById('main-nav');
                const hamburger = document.querySelector('.hamburger');
                if (nav && nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    if (hamburger) hamburger.classList.remove('active');
                    document.body.style.overflow = '';
                }
                
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// ADD LOADING ATTRIBUTE TO IMAGES
// ============================================
function initLazyLoading() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
    });
}

// ============================================
// HANDLE WINDOW RESIZE
// ============================================
function handleResize() {
    const nav = document.getElementById('main-nav');
    const hamburger = document.querySelector('.hamburger');
    
    if (window.innerWidth > 768) {
        if (nav) nav.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Debounce function
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

// ============================================
// INITIALIZE ALL FUNCTIONALITY
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing...'); // Debug log
    
    // Initialize language
    initLanguage();
    
    // Attach event listener to Hamburger Button
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        console.log('Hamburger found, attaching click listener'); // Debug log
        
        hamburger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Hamburger clicked!'); // Debug log
            toggleMenu();
        });
    } else {
        console.warn('Hamburger button not found!'); // Debug log
    }
    
    // Attach event listener to Language Toggle Button
    const toggleBtn = document.querySelector('.toggle-btn');
    if (toggleBtn) {
        console.log('Toggle button found, attaching click listener'); // Debug log
        
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Language toggle clicked!'); // Debug log
            toggleLanguage();
        });
    }

    // Initialize mobile menu interactions
    closeMobileMenuOnClick();
    closeMobileMenuOnOutsideClick();    
    
    // Initialize smooth scrolling
    initSmoothScroll();
    
    // Initialize FAQ accordion if any FAQ items exist
    if (document.querySelector('.faq-question')) {
        initFaqAccordion();
    }
    
    // Initialize lazy loading for images
    initLazyLoading();
    
    // Handle window resize
    window.addEventListener('resize', debounce(handleResize, 250));
    
    console.log('Quintana Notary & Signing - Initialized');
});
