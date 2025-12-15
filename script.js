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
    // Only set display for elements with ID suffixes, allowing CSS to manage other styles
    el.style.display = (newLang === 'en') ? '' : 'none';
  });
  
  esElements.forEach(el => {
    // Only set display for elements with ID suffixes, allowing CSS to manage other styles
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

  // NOTE: The logic for 'toggle-label-en' and 'toggle-label-es' has been removed
  // as the general 'enElements' and 'esElements' loops handle these elements automatically.

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
// FAQ ACCORDION TOGGLE FUNCTION
// ============================================
function toggleFaq(element) {
  // Find the parent .faq-item (which is the <details> element)
  const faqItem = element.closest('.faq-item');
  
  if (!faqItem) return;

  const answer = faqItem.querySelector('.faq-answer');
  const question = faqItem.querySelector('.faq-question');
  
  // Get the current state
  const isOpen = faqItem.hasAttribute('open');

  // *** FIX: Explicitly toggle the 'open' attribute on the <details> element ***
  if (isOpen) {
    faqItem.removeAttribute('open');
  } else {
    faqItem.setAttribute('open', '');
  }

  // Toggle custom classes for styling/visual cues
  faqItem.classList.toggle('active', !isOpen);
  if (question) question.classList.toggle('active', !isOpen);
  
  // Toggle the answer visibility class for custom animations/transitions (optional)
  if (answer) {
    answer.classList.toggle('open', !isOpen); 
    
    // Set aria-expanded for accessibility
    question.setAttribute('aria-expanded', !isOpen);
  }
}

// ============================================
// INITIALIZE FAQ ACCORDION
// (Updated: Removed check for 'onclick' attribute to enforce JS event handling)
// ============================================
function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    // Ensure only one listener is attached if running on pages that reload via history API
    if (question.hasAttribute('data-listener')) return;

    question.addEventListener('click', (e) => {
      e.preventDefault();
      toggleFaq(question);
    });
    
    // Add accessibility attribute
    question.setAttribute('aria-expanded', 'false');
    question.setAttribute('data-listener', 'true'); // Mark as initialized
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
  // Added hamburger check to closeMobileMenuOnOutsideClick to prevent header click issues
  closeMobileMenuOnOutsideClick(); 
  
  // Initialize smooth scrolling
  initSmoothScroll();
  
  // Initialize FAQ accordion if any FAQ items exist
  if (document.querySelector('.faq-item')) {
    initFaqAccordion();
  }
  
  // Initialize lazy loading for images
  initLazyLoading();
  
  // Handle window resize
  window.addEventListener('resize', debounce(handleResize, 250));
  
  console.log('Quintana Notary & Signing - Initialized');
});
