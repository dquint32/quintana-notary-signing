// Global JavaScript for Quintana Notary & Signing
// Handles language switching, mobile menu, and interactive elements

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

    try {
        localStorage.setItem('preferredLanguage', newLang);
    } catch (e) {
        console.warn('Could not save language preference:', e);
    }
    
    console.log('Language switched to:', newLang); // Debug log
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
        document.documentElement.lang = 'es'; // Default fallback
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
        document.body.style.overflow = 'hidden'; 
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
    document.body.style.overflow = '';
}

// ============================================
// FAQ ACCORDION LOGIC
// ============================================
function toggleFaq(element) {
    const question = element;
    const answer = question.nextElementSibling;
    const accordionContainer = question.closest('.faq-accordion-container');
    
    if (!answer || !accordionContainer) return;

    const isOpening = !question.classList.contains('active');

    // Close others
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

    // Toggle current
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

function expandAllFaqs() {
    const questions = document.querySelectorAll('.faq-question');
    questions.forEach(q => {
        const answer = q.nextElementSibling;
        const item = q.closest('.faq-item');
        
        if (!q.classList.contains('active')) {
            q.classList.add('active');
            q.setAttribute('aria-expanded', 'true');
            if(item) item.classList.add('active');
            if(answer) answer.style.maxHeight = answer.scrollHeight + "px";
        }
    });
}

function collapseAllFaqs() {
    const questions = document.querySelectorAll('.faq-question');
    questions.forEach(q => {
        const answer = q.nextElementSibling;
        const item = q.closest('.faq-item');
        
        q.classList.remove('active');
        q.setAttribute('aria-expanded', 'false');
        if(item) item.classList.remove('active');
        if(answer) answer.style.maxHeight = null;
    });
}

// ============================================
// INITIALIZE ALL FUNCTIONALITY
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing...');
    
    // 1. Initialize language
    initLanguage();
    
    // 2. Initialize Language Toggle Button
    const langToggleButtons = document.querySelectorAll('.toggle-btn, #lang-toggle');
    langToggleButtons.forEach(btn => {
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
        
        const newHamburger = hamburger.cloneNode(true);
        hamburger.parentNode.replaceChild(newHamburger, hamburger);
        
        newHamburger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
        console.log('Hamburger menu initialized');
    } else {
        console.warn('Hamburger button ID="hamburger" not found in HTML');
    }
    
    // 4. Close menu when clicking nav links
    const navLinks = document.querySelectorAll('#main-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
    
    // 5. Initialize FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFaq(question);
        });
    });

    // 6. Handle Resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeMobileMenu();
    });
});
