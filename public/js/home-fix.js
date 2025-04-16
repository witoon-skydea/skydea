// Clean Home Page with Carousel JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Initialize carousel
  initializeImageCarousel();
  
  // Fix for home navigation issue
  const homeLinks = document.querySelectorAll('a[href="' + window.appBasePath + '"]');
  
  homeLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      console.log('Attempting to navigate to home:', window.appBasePath);
      window.location.href = window.appBasePath;
    });
  });
  
  console.log('Found', homeLinks.length, 'home links on page');
});

// Function to initialize image carousel
function initializeImageCarousel() {
  const carouselInner = document.querySelector('#featureCarousel .carousel-inner');
  
  if (carouselInner) {
    // Array of carousel images with captions
    const carouselImages = [
      {
        src: 'images/backgrounds/bg1.png',
        caption: 'Plan your adventures with ease'
      },
      {
        src: 'images/backgrounds/bg2.png',
        caption: 'Discover amazing destinations'
      },
      {
        src: 'images/backgrounds/bg3.png',
        caption: 'Create unforgettable memories'
      },
      {
        src: 'images/main_photo.png',
        caption: 'Your journey starts here'
      }
    ];
    
    // Get the base path from the page
    let basePath = '/';
    if (typeof window.appBasePath !== 'undefined') {
      basePath = window.appBasePath;
    }
    
    // Create carousel items
    carouselImages.forEach((image, index) => {
      const isActive = index === 0 ? 'active' : '';
      const fullImagePath = basePath + image.src;
      
      const carouselItem = document.createElement('div');
      carouselItem.className = `carousel-item ${isActive}`;
      carouselItem.style.backgroundImage = `url('${fullImagePath}')`;
      
      const caption = document.createElement('div');
      caption.className = 'carousel-caption d-none d-md-block';
      caption.innerHTML = `<h5>${image.caption}</h5>`;
      
      carouselItem.appendChild(caption);
      carouselInner.appendChild(carouselItem);
    });
    
    // Initialize Bootstrap carousel
    new bootstrap.Carousel(document.getElementById('featureCarousel'), {
      interval: 5000,
      wrap: true
    });
    
    console.log('Carousel initialized with', carouselImages.length, 'images');
  } else {
    console.log('Carousel element not found');
  }
}
