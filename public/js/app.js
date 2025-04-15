// Skydea Application JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Initialize random background for home page
  initializeRandomBackground();
  
  // Initialize Bootstrap tooltips
  const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltips.forEach(tooltip => {
    new bootstrap.Tooltip(tooltip);
  });
  
  // Initialize Bootstrap popovers
  const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
  popovers.forEach(popover => {
    new bootstrap.Popover(popover);
  });
  
  // Handle password visibility toggle
  const passwordToggles = document.querySelectorAll('.password-toggle');
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const passwordInput = document.getElementById(this.getAttribute('data-target'));
      const icon = this.querySelector('i');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });
  
  // Form validation
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      form.classList.add('was-validated');
    });
  });
  
  // Password confirmation validation
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');
  
  if (password && confirmPassword) {
    const validatePasswordMatch = function() {
      if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords do not match');
      } else {
        confirmPassword.setCustomValidity('');
      }
    };
    
    password.addEventListener('input', validatePasswordMatch);
    confirmPassword.addEventListener('input', validatePasswordMatch);
  }
  
  // Auto-dismiss alerts
  const autoAlerts = document.querySelectorAll('.alert.auto-dismiss');
  autoAlerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, 5000);
  });
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      if (this.getAttribute('href') !== '#') {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 70,
            behavior: 'smooth'
          });
        }
      }
    });
  });
  
  // Add loading spinner to buttons when clicked
  const actionButtons = document.querySelectorAll('.btn-action');
  actionButtons.forEach(button => {
    button.addEventListener('click', function() {
      const originalContent = this.innerHTML;
      this.setAttribute('data-original-content', originalContent);
      this.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...`;
      this.disabled = true;
      
      // For demo purposes, re-enable the button after 2 seconds
      // In a real application, this would be handled by the form submission
      setTimeout(() => {
        this.innerHTML = this.getAttribute('data-original-content');
        this.disabled = false;
      }, 2000);
    });
  });
  
  // Navbar scroll behavior
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 100) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
    });
  }
  
  // Initialize any carousels
  const carousels = document.querySelectorAll('.carousel');
  carousels.forEach(carousel => {
    new bootstrap.Carousel(carousel, {
      interval: 5000
    });
  });
  
  // Add animation on scroll for certain elements
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  const checkIfInView = () => {
    animatedElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      const elementVisible = 150;
      
      if (elementTop < window.innerHeight - elementVisible) {
        element.classList.add('active');
      }
    });
  };
  
  // Run on page load
  checkIfInView();
  
  // Run on scroll
  window.addEventListener('scroll', checkIfInView);
});

// Handle random background image for home page hero section
function initializeRandomBackground() {
  const heroElement = document.getElementById('random-hero-background');
  
  if (heroElement) {
    // Array of background images
    const backgrounds = [
      'images/backgrounds/bg1.png',
      'images/backgrounds/bg2.png',
      'images/backgrounds/bg3.png'
    ];
    
    // Get the base path from the page
    let basePath = '/';
    if (typeof window.appBasePath !== 'undefined') {
      basePath = window.appBasePath;
    }
    
    // Select a random background
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    const selectedBackground = backgrounds[randomIndex];
    
    // Apply the background image with the correct base path
    const fullPath = basePath + selectedBackground;
    heroElement.style.backgroundImage = `url('${fullPath}')`;
  }
}