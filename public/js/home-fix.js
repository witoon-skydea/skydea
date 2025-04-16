// Fix for home navigation issue
document.addEventListener('DOMContentLoaded', function() {
  // Directly attach event listeners to home links
  const homeLinks = document.querySelectorAll('a[href="' + window.appBasePath + '"]');
  
  homeLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Remove default prevention
      // e.preventDefault(); 
      
      // Log navigation attempt
      console.log('Attempting to navigate to home:', window.appBasePath);
      
      // Explicitly set the window location
      window.location.href = window.appBasePath;
      
      // For good measure, we reload in case something else is interfering
      // setTimeout(() => window.location.reload(), 100);
    });
  });
  
  // Log the number of home links found
  console.log('Found', homeLinks.length, 'home links on page');
});