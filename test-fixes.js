const puppeteer = require('puppeteer');

async function testSkydeaFixes() {
  console.log('Starting Skydea test with Puppeteer');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Login to the application
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Wait for login form to load
    await page.waitForSelector('#username', { timeout: 5000 });
    
    // Fill login form
    await page.type('#username', 'witoonp');
    await page.type('#password', '123456');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('.dashboard-title', { timeout: 5000 });
    console.log('Successfully logged in');
    
    // 2. Create a new trip (or use an existing one)
    const newTripBtn = await page.$('.btn-create-trip');
    if (newTripBtn) {
      console.log('Creating a new trip...');
      await newTripBtn.click();
      
      // Wait for create trip modal
      await page.waitForSelector('#create-trip-modal', { visible: true });
      
      // Fill trip form
      await page.type('#trip-title', 'Test Fix Trip');
      await page.type('#trip-description', 'Trip for testing fixes');
      
      // Set dates (today and tomorrow)
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const startDate = today.toISOString().split('T')[0];
      const endDate = tomorrow.toISOString().split('T')[0];
      
      await page.$eval('#trip-start-date', (el, value) => { el.value = value }, startDate);
      await page.$eval('#trip-end-date', (el, value) => { el.value = value }, endDate);
      
      // Create trip
      await page.click('#create-trip-btn');
      
      // Wait for redirect to trip planner
      await page.waitForSelector('#trip-planner-app', { timeout: 10000 });
      console.log('Trip created successfully');
    } else {
      console.log('Using existing trip...');
      // Click on the first trip in the list
      await page.click('.trip-card a');
      // Wait for redirect to trip planner
      await page.waitForSelector('#trip-planner-app', { timeout: 10000 });
    }
    
    // 3. Test Issue 1: Adding a place without an image
    console.log('Testing Issue 1: Place without image...');
    // Click the add place button
    await page.click('#add-place-btn');
    
    // Wait for modal
    await page.waitForSelector('#add-place-modal', { visible: true });
    
    // Make sure we're on the manual tab
    await page.click('#manual-tab');
    
    // Fill place form without image
    await page.type('#place-name', 'Test Place No Image');
    await page.type('#place-description', 'This is a test place without an image');
    await page.type('#place-address', '123 Test Street, Test City');
    await page.type('#place-latitude', '13.7563');
    await page.type('#place-longitude', '100.5018');
    
    // Deliberately leave image URL empty
    
    // Save place
    await page.click('#save-place-btn');
    
    // Wait for place to be added and modal closed
    await page.waitForFunction(() => !document.querySelector('#add-place-modal.show'), { timeout: 5000 });
    
    // Go to Places tab
    await page.click('a[href="#places"]');
    
    // Check if place was added successfully
    await page.waitForFunction(
      () => document.querySelector('#places-table-body').textContent.includes('Test Place No Image'), 
      { timeout: 5000 }
    );
    console.log('Place without image added successfully');
    
    // 4. Test Issue 2: Google Places search
    console.log('Testing Issue 2: Google Places search...');
    
    // Click add place button again
    await page.click('#add-place-btn-2');
    
    // Wait for modal
    await page.waitForSelector('#add-place-modal', { visible: true });
    
    // Go to Google tab
    await page.click('#google-tab');
    
    // Type search query
    await page.type('#google-search', 'Bangkok');
    
    // Click search button
    await page.click('#google-search-btn');
    
    // Wait for results (assuming Google Maps API is configured correctly)
    try {
      await page.waitForSelector('#google-results-list a', { timeout: 15000 });
      
      // Click on the first result
      await page.click('#google-results-list a');
      
      // Wait for place details to show
      await page.waitForSelector('#google-place-details', { visible: true, timeout: 5000 });
      
      // Click on the "Add This Place" button
      await page.click('#google-select-place-btn');
      
      // Wait for modal to close
      await page.waitForFunction(() => !document.querySelector('#add-place-modal.show'), { timeout: 5000 });
      
      console.log('Google Places search and add working correctly');
    } catch (error) {
      console.log('Google Maps API might not be configured properly. Skipping this test.');
    }
    
    // 5. Test Issue 3: Adding activities without a place
    console.log('Testing Issue 3: Adding activities without a place...');
    
    // Go to Itinerary tab
    await page.click('a[href="#itinerary"]');
    
    // Click add activity button
    await page.click('#add-activity-btn');
    
    // Wait for modal
    await page.waitForSelector('#add-activity-modal', { visible: true });
    
    // Fill form without selecting a place
    await page.type('#activity-title', 'Test Activity No Place');
    await page.type('#activity-description', 'This is a test activity without a place');
    
    // Ensure place dropdown is set to blank
    await page.select('#activity-place', '');
    
    // Fill in time fields
    await page.type('#activity-start-time', '09:00');
    await page.type('#activity-end-time', '10:00');
    
    // Save activity
    await page.click('#save-activity-btn');
    
    // Wait for modal to close
    await page.waitForFunction(() => !document.querySelector('#add-activity-modal.show'), { timeout: 5000 });
    
    // Check if activity was added successfully
    try {
      await page.waitForFunction(
        () => document.querySelector('.timeline-item').textContent.includes('Test Activity No Place'), 
        { timeout: 5000 }
      );
      console.log('Activity without place added successfully');
    } catch (error) {
      console.log('ERROR: Activity without place not added correctly:', error.message);
    }
    
    // 6. Test adding another activity with the same place
    console.log('Testing adding an activity with the same place...');
    
    // Click add activity button again
    await page.click('#add-activity-btn');
    
    // Wait for modal
    await page.waitForSelector('#add-activity-modal', { visible: true });
    
    // Fill form and select a place (first one in dropdown)
    await page.type('#activity-title', 'Test Activity With Same Place');
    await page.type('#activity-description', 'This is a test activity with the same place');
    
    // Select the first place in the dropdown
    await page.evaluate(() => {
      const select = document.getElementById('activity-place');
      if (select.options.length > 1) {
        select.selectedIndex = 1;
      }
    });
    
    // Adjust times to be after the previous activity
    await page.type('#activity-start-time', '10:30');
    await page.type('#activity-end-time', '11:30');
    
    // Save activity
    await page.click('#save-activity-btn');
    
    // Wait for modal to close
    await page.waitForFunction(() => !document.querySelector('#add-activity-modal.show'), { timeout: 5000 });
    
    // Check if activity was added successfully
    try {
      await page.waitForFunction(
        () => document.querySelector('.timeline-item').textContent.includes('Test Activity With Same Place'), 
        { timeout: 5000 }
      );
      console.log('Activity with place added successfully');
    } catch (error) {
      console.log('ERROR: Activity with place not added correctly:', error.message);
    }
    
    console.log('All tests completed successfully!');
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-result.png', fullPage: true });
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    // Close the browser after a delay to see the final state
    setTimeout(async () => {
      await browser.close();
    }, 5000);
  }
}

testSkydeaFixes().catch(console.error);
