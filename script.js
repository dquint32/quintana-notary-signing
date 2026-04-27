// ============================================
// QUINTANA NOTARY & SIGNING - GLOBAL JAVASCRIPT
// Handles language switching, mobile menu, and interactive elements
// ============================================

// ============================================
// LANGUAGE TOGGLE FUNCTION
// ============================================
function toggleLanguage(specificLang) {
    const enElements = document.querySelectorAll('[id$="-en"]');
    const esElements = document.querySelectorAll('[id$="-es"]');
    
    // Determine new language: use passed argument OR toggle current
    const currentLang = document.documentElement.lang || 'es';
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

    // Save preference to local storage
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
    } catch (e) {}
    
    if (!document.documentElement.lang) {
        document.documentElement.lang = 'es'; // Default fallback to Spanish
    }

    if (savedLang && savedLang !== document.documentElement.lang) {
        toggleLanguage(savedLang);
    } else {
        // Run once to ensure initial display matches the lang attribute
        toggleLanguage(document.documentElement.lang);
    }
}

// ============================================
// MOBILE HAMBURGER MENU TOGGLE
// ============================================
function toggleMenu() {
    const nav = document.getElementById('main-nav');
    const hamburger = document.getElementById('hamburger');
    
    if (!nav || !hamburger) {
        console.error('Nav or hamburger element not found. Check HTML IDs.');
        return;
    }
    
    const isActive = nav.classList.contains('active');
    
    if (isActive) {
        closeMobileMenu();
    } else {
        nav.classList.add('active');
        hamburger.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

// ============================================
// CLOSE MOBILE MENU
// ============================================
function closeMobileMenu() {
    const nav = document.getElementById('main-nav');
    const hamburger = document.getElementById('hamburger');
    
    if (nav) nav.classList.remove('active');
    if (hamburger) {
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = ''; // Restore background scrolling
}

// ============================================
// FAQ ACCORDION LOGIC (For future use/expansion)
// ============================================
function toggleFaq(element) {
    const question = element;
    const answer = question.nextElementSibling;
    const accordionContainer = question.closest('.faq-accordion-container');
    
    if (!answer || !accordionContainer) return;

    const isOpening = !question.classList.contains('active');

    // Close other open FAQs
    accordionContainer.querySelectorAll('.faq-question.active').forEach(activeQuestion => {
        if (activeQuestion !== question) {
            activeQuestion.classList.remove('active');
            
            const activeItem = activeQuestion.closest('.faq-item');
            if (activeItem) activeItem.classList.remove('active');
            
            activeQuestion.setAttribute('aria-expanded', 'false');
            
            const activeAnswer = activeQuestion.nextElementSibling;
            if (activeAnswer) activeAnswer.style.maxHeight = null; 
        }
    });

    // Toggle current FAQ
    if (isOpening) {
        question.classList.add('active');
        const item = question.closest('.faq-item');
        if (item) item.classList.add('active');
        
        answer.style.maxHeight = answer.scrollHeight + "px";
        question.setAttribute('aria-expanded', 'true');
    } else {
        question.classList.remove('active');
        const item = question.closest('.faq-item');
        if (item) item.classList.remove('active');
        
        answer.style.maxHeight = null;
        question.setAttribute('aria-expanded', 'false');
    }
}

// ============================================
// INITIALIZE ALL FUNCTIONALITY
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize language based on saved preferences
    initLanguage();
    
    // 2. Initialize Language Toggle Button
    const langToggleButtons = document.querySelectorAll('.toggle-btn, #lang-toggle');
    langToggleButtons.forEach(btn => {
        // Remove inline onclick if it exists to prevent double-firing
        if (btn.hasAttribute('onclick')) {
            btn.removeAttribute('onclick');
        }
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleLanguage();
        });
    });
    
    // 3. Initialize Hamburger Menu
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        if (hamburger.hasAttribute('onclick')) {
            hamburger.removeAttribute('onclick');
        }
        
        // Clone and replace to strip any old event listeners
        const newHamburger = hamburger.cloneNode(true);
        hamburger.parentNode.replaceChild(newHamburger, hamburger);
        
        newHamburger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
    }
    
    // 4. Close menu when clicking navigation links (Mobile)
    const navLinks = document.querySelectorAll('#main-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
    
    // 5. Initialize FAQ Accordions (if present on the page)
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFaq(question);
        });
    });

    // 6. Handle Window Resize (Close mobile menu if expanded to desktop)
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeMobileMenu();
    });

    // 7. Back to Top — Smooth Scroll Support
    document.querySelectorAll('a[href="#top"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
});
