// Global JavaScript for Quintana Notary & Signing
// Handles language switching, mobile menu, and interactive elements

// ============================================
// LANGUAGE TOGGLE FUNCTION
// ============================================
function toggleLanguage() {
  const enElements = document.querySelectorAll('[id$="-en"]');
  const esElements = document.querySelectorAll('[id$="-es"]');
  const currentLang = document.documentElement.lang;
  const newLang = currentLang === 'es' ? 'en' : 'es';
  
  // Update HTML lang attribute
  document.documentElement.lang = newLang;
  
  // Show/hide elements based on language
  enElements.forEach(el => {
    el.style.display = (newLang === 'en') ? '' : 'none';
  });
  
  esElements.forEach(el => {
    el.style.display = (newLang === 'es') ? '' : 'none';
  });
  
  // Save language preference to localStorage
  try {
    localStorage.setItem('preferredLanguage', newLang);
  } catch (e) {
    // Handle localStorage errors (e.g., private browsing mode)
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
  
  // If saved language exists and differs from current, toggle
  if (savedLang && savedLang !== document.documentElement.lang) {
    toggleLanguage();
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
    
    if (window.innerWidth <= 768 && nav && hamburger) {
      if (!header.contains(e.target) && nav.classList.contains('active')) {
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
  const faqItem = element.parentElement;
  
  // Optional: Uncomment the lines below if you want only one question open at a time
  /*
  const wasActive = faqItem.classList.contains('active');
  document.querySelectorAll('.faq-item').forEach(item => {
    if (item !== faqItem) {
      item.classList.remove('active');
    }
  });
  */
  
  // Toggle current item
  faqItem.classList.toggle('active');
}

// ============================================
// INITIALIZE FAQ ACCORDION
// ============================================
function initFaqAccordion() {
  // Since the HTML elements have onclick="toggleFaq(this)", 
  // we do not need to add event listeners here. 
  // Adding them would cause the function to fire twice (open then close immediately).
  
  // This function is kept empty to preserve structure or 
  // in case you want to add purely JS-based logic later.
  console.log('FAQ Accordion ready (using inline handlers)');
}

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      
      // Skip if href is just "#"
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
  
  // Initialize mobile menu
  closeMobileMenuOnClick();
  closeMobileMenuOnOutsideClick();
  
  // Initialize smooth scrolling
  initSmoothScroll();
  
  // Initialize FAQ accordion if on FAQ page
  if (document.querySelector('.faq-item')) {
    initFaqAccordion();
  }
  
  // Initialize lazy loading for images
  initLazyLoading();
  
  // Handle window resize
  window.addEventListener('resize', debounce(handleResize, 250));
  
  // Log initialization (optional - remove in production)
  console.log('Quintana Notary & Signing - Initialized');
});