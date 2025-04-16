// Enhanced Home Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Initialize random feature image for home page
  initializeRandomFeatureImage();
  
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

// Enhanced random feature image function
function initializeRandomFeatureImage() {
  const featureImageElement = document.getElementById('random-feature-image');
  const captionElement = document.getElementById('feature-image-caption');
  
  if (featureImageElement) {
    // Array of background images
    const featureImages = [
      'images/backgrounds/bg1.png',
      'images/backgrounds/bg2.png',
      'images/backgrounds/bg3.png',
      'images/main_photo.png'
    ];
    
    // Get the base path from the page
    let basePath = '/';
    if (typeof window.appBasePath !== 'undefined') {
      basePath = window.appBasePath;
    }
    
    // Select a random background
    const randomIndex = Math.floor(Math.random() * featureImages.length);
    const selectedImage = featureImages[randomIndex];
    
    // Apply the selected image with the correct base path
    const fullPath = basePath + selectedImage;
    featureImageElement.src = fullPath;
    featureImageElement.alt = `Skydea Feature Image ${randomIndex + 1}`;
    
    // Add custom captions based on the image
    const captions = [
      "Plan your adventures with ease",
      "Discover amazing destinations",
      "Create unforgettable memories",
      "Your journey starts here"
    ];
    
    // Set the caption text if element exists
    if (captionElement) {
      captionElement.textContent = captions[randomIndex];
    }
    
    console.log('Random feature image set:', fullPath);
  } else {
    console.log('Feature image element not found');
  }
}
