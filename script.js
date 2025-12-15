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
        // Use default display ('') for visibility, 'none' for hidden
        el.style.display = (newLang === 'en') ? '' : 'none';
    });
    
    esElements.forEach(el => {
        // Use default display ('') for visibility, 'none' for hidden
        el.style.display = (newLang === 'es') ? '' : 'none';
    });
    
    // Update the language button specifically
    const langBtnEn = document.getElementById('lang-btn-en');
    const langBtnEs = document.getElementById('lang-btn-es');
    
    if (langBtnEn && langBtnEs) {
        if (newLang === 'es') {
            langBtnEs.style.display = '';    // Show "English" (option to switch to)
            langBtnEn.style.display = 'none';
        } else {
            langBtnEs.style.display = 'none';
            langBtnEn.style.display = '';    // Show "Español" (option to switch to)
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
    
    if (nav) {
        nav.classList.toggle('active');
    }
    
    if (hamburger) {
        hamburger.classList.toggle('active');
        
        // Accessibility: Update aria-expanded if applicable
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
            // Check for mobile screen size before closing (good for preventing issues on desktop)
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
        
        // Only execute if menu is currently active and screen is mobile
        if (window.innerWidth <= 768 && nav && hamburger && nav.classList.contains('active')) {
            // Check if the click was OUTSIDE the header/nav/hamburger
            if (!header.contains(e.target) && !hamburger.contains(e.target)) {
                nav.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });
}

// ============================================
// FAQ ACCORDION TOGGLE FUNCTION (Updated for smooth max-height transition)
// ============================================
function toggleFaq(element) {
    // The question is the element clicked. The answer is the immediate next sibling.
    const question = element;
    const answer = question.nextElementSibling; // Should be the .faq-answer container
    
    if (!answer) return;

    // Toggle custom classes for styling/visual cues (arrow rotation, etc.)
    question.classList.toggle('active');
    
    // Check if the answer is currently open (has a max-height value)
    if (answer.style.maxHeight) {
        // If open, close it (by setting max-height to null/0)
        answer.style.maxHeight = null;
        question.setAttribute('aria-expanded', 'false');
    } else {
        // If closed, open it (by setting max-height to its scrollHeight)
        // The answer content must be wrapped in a container where max-height can be applied.
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
        // Check if the question is within the expected structure (e.g., using a non-details tag)
        if (question.tagName.toLowerCase() === 'summary') {
            console.warn('FAQ Question is a <summary> tag. Using native <details> functionality is simpler or requires a different JS approach for smooth transitions. Applying custom click handler anyway.');
        }

        // Ensure only one listener is attached 
        if (question.hasAttribute('data-listener')) return;

        question.addEventListener('click', (e) => {
            e.preventDefault();
            // Call the toggler with the element that was clicked
            toggleFaq(question);
        });
        
        // Add accessibility attribute and mark as initialized
        question.setAttribute('aria-expanded', 'false');
        question.setAttribute('data-listener', 'true'); 
        
        // Ensure the answer starts closed for the max-height logic
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
                
                // Close mobile menu if open
                const nav = document.getElementById('main-nav');
                const hamburger = document.querySelector('.hamburger');
                if (nav && nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    if (hamburger) hamburger.classList.remove('active');
                    document.body.style.overflow = '';
                }
                
                // Smooth scroll to target
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
        // Only set if not already present, respecting existing attributes
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
    
    // Reset menu state when resizing above mobile breakpoint
    if (window.innerWidth > 768) {
        if (nav) nav.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Debounce function to limit resize event firing
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
    // Initialize language
    initLanguage();
    
    // Attach event listener to Hamburger Button
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
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
