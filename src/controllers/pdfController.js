const PDFDocument = require('pdfkit');
const Trip = require('../models/Trip');
const Place = require('../models/Place');
const ItineraryItem = require('../models/ItineraryItem');

/**
 * Generate a PDF export of a trip
 */
exports.exportTripToPdf = async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    
    // Get trip data
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).send('Trip not found');
    }
    
    // Get places for this trip
    const places = await Place.findByTripId(tripId);
    
    // Get itinerary items for this trip
    const itineraryItems = await ItineraryItem.findByTripId(tripId);
    
    // Render the print view
    res.render('trips/print-view', {
      trip,
      places,
      itineraryItems,
      layout: false
    });
  } catch (error) {
    console.error('Error generating trip PDF view:', error);
    res.status(500).send('Error generating print view');
  }
};

/**
 * Group itinerary items by day
 */
function groupItemsByDay(items) {
  const grouped = {};
  
  items.forEach(item => {
    if (!grouped[item.day_number]) {
      grouped[item.day_number] = [];
    }
    grouped[item.day_number].push(item);
  });
  
  // Sort items within each day by order_index
  Object.keys(grouped).forEach(day => {
    grouped[day].sort((a, b) => a.order_index - b.order_index);
  });
  
  return grouped;
}

/**
 * Generate the PDF content
 */
function generatePdfContent(doc, trip, places, itemsByDay) {
  // Header and metadata
  generateHeader(doc, trip);
  
  // Trip overview
  generateTripOverview(doc, trip);
  
  // Trip map overview - add a map showing all places
  generateTripMapOverview(doc, places);
  
  // Places section with images
  generatePlacesSection(doc, places);
  
  // Daily itinerary
  generateDailyItinerary(doc, itemsByDay, places);
  
  // Footer with page numbers
  generateFooter(doc);
}

/**
 * Generate a map overview section
 */
function generateTripMapOverview(doc, places) {
  const placesWithCoords = places.filter(place => place.latitude && place.longitude);
  
  if (placesWithCoords.length === 0) {
    return;
  }
  
  // Add a section title
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor('#2c3e50')
     .text('Trip Overview Map', { underline: true })
     .moveDown(0.5);
  
  // We can't actually generate a map image directly in the PDF,
  // but we can include a placeholder and instructions
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#2c3e50')
     .text('Your trip includes the following key locations:', { continued: false })
     .moveDown(0.5);
  
  // Create a list of the places with coordinates
  placesWithCoords.forEach((place, index) => {
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text(`${index + 1}. ${place.name}`, { continued: true })
       .font('Helvetica')
       .text(` (${place.latitude.toFixed(6)}, ${place.longitude.toFixed(6)})`)
       .moveDown(0.2);
  });
  
  doc.moveDown(1);
  
  // Add page break if needed
  if (doc.y > doc.page.height - 250) {
    doc.addPage();
  }
}

/**
 * Generate the PDF header
 */
function generateHeader(doc, trip) {
  // Logo and title
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .text('SKYDEA', { align: 'center' })
     .fontSize(14)
     .font('Helvetica')
     .text('Trip Planner', { align: 'center' })
     .moveDown(0.5);
  
  // Horizontal rule
  doc.moveTo(72, doc.y)
     .lineTo(doc.page.width - 72, doc.y)
     .stroke('#cccccc')
     .moveDown(0.5);
  
  // Trip title
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text(trip.title, { align: 'center' })
     .moveDown(0.5);
  
  // Date range
  const startDate = new Date(trip.start_date).toLocaleDateString();
  const endDate = new Date(trip.end_date).toLocaleDateString();
  
  doc.fontSize(14)
     .font('Helvetica')
     .text(`${startDate} to ${endDate}`, { align: 'center' })
     .moveDown(1);
     
  // Trip description if available
  if (trip.description) {
    doc.fontSize(12)
       .font('Helvetica-Italic')
       .text(trip.description, { align: 'center' })
       .moveDown(1);
  }
  
  // Horizontal rule
  doc.moveTo(72, doc.y)
     .lineTo(doc.page.width - 72, doc.y)
     .stroke('#cccccc')
     .moveDown(1);
}

/**
 * Generate trip overview section
 */
function generateTripOverview(doc, trip) {
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .text('Trip Overview', { underline: true })
     .moveDown(0.5);
  
  const days = Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24)) + 1;
  
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Duration: ${days} days`)
     .moveDown(0.3)
     .text(`Created on: ${new Date(trip.created_at).toLocaleDateString()}`)
     .moveDown(0.3)
     .text(`Last updated: ${new Date(trip.updated_at).toLocaleDateString()}`)
     .moveDown(1.5);
}

/**
 * Generate the places section with images
 */
function generatePlacesSection(doc, places) {
  if (places.length === 0) {
    return;
  }
  
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor('#2c3e50')
     .text('Places to Visit', { underline: true })
     .moveDown(0.5);
  
  // Group places by category
  const placesByCategory = {};
  places.forEach(place => {
    const category = place.category || 'Uncategorized';
    if (!placesByCategory[category]) {
      placesByCategory[category] = [];
    }
    placesByCategory[category].push(place);
  });
  
  // List places by category
  Object.keys(placesByCategory).sort().forEach(category => {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#3498db')
       .text(capitalizeFirstLetter(category), { continued: true })
       .text(` (${placesByCategory[category].length})`)
       .moveDown(0.3);
    
    placesByCategory[category].forEach(place => {
      const startY = doc.y;
      let contentHeight = 0;
      
      // Calculate if there's room for this place on current page
      const estimatedHeight = place.image_url ? 120 : 40;
      if (doc.y + estimatedHeight > doc.page.height - 100) {
        doc.addPage();
      }
      
      // If place has an image, try to include it
      let imageWidth = 80;
      if (place.image_url) {
        try {
          // Note: This is just a placeholder approach since we can't actually
          // fetch external images directly in this environment
          doc.save();
          doc.rect(doc.x, doc.y, imageWidth, 80).fill('#e0e0e0');
          doc.fontSize(8)
             .fillColor('#666666')
             .text('Image Placeholder', doc.x + 10, doc.y - 40, { width: 60, align: 'center' });
          doc.restore();
          
          doc.moveUp(4);
        } catch (err) {
          console.error('Error adding image:', err);
          imageWidth = 0;
        }
      } else {
        imageWidth = 0;
      }
      
      // Place details with appropriate offset if image exists
      const textX = imageWidth > 0 ? doc.x + imageWidth + 10 : doc.x;
      const textWidth = imageWidth > 0 ? doc.page.width - doc.x - imageWidth - 70 : doc.page.width - doc.x - 60;
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text(`• ${place.name}`, textX, doc.y, { continued: true, width: textWidth });
      
      if (place.address) {
        doc.font('Helvetica')
           .text(`: ${place.address}`, { width: textWidth });
      } else {
        doc.text('', { width: textWidth });
      }
      
      if (place.description) {
        doc.fontSize(10)
           .font('Helvetica-Italic')
           .text(`${place.description}`, textX, doc.y, { indent: 10, width: textWidth });
      }
      
      // Calculate the content height and ensure we move down by at least that amount
      contentHeight = doc.y - startY;
      if (contentHeight < 80 && imageWidth > 0) {
        // If we have an image and the content is shorter than the image height,
        // make sure we move down enough to clear the image
        doc.moveDown((80 - contentHeight) / doc.currentLineHeight());
      }
      
      doc.moveDown(0.7);
    });
    
    doc.moveDown(0.5);
  });
  
  doc.moveDown(1);
  
  // Add page break if needed
  if (doc.y > doc.page.height - 250) {
    doc.addPage();
  }
}

/**
 * Generate the daily itinerary section
 */
function generateDailyItinerary(doc, itemsByDay, places) {
  if (Object.keys(itemsByDay).length === 0) {
    return;
  }
  
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor('#2c3e50')
     .text('Daily Itinerary', { underline: true })
     .moveDown(0.5);
  
  // Function to get place details by ID
  const getPlaceById = (placeId) => {
    return places.find(place => place.id === placeId) || null;
  };
  
  // Process each day
  Object.keys(itemsByDay).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
    // Add page break for each day to ensure route map appears at the top
    doc.addPage();
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(`Day ${day}`, { underline: true })
       .moveDown(0.5);
    
    // Generate day's route map (placeholder)
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Day Route Overview:')
       .moveDown(0.3);
    
    // Get places with coordinates for this day
    const dayPlacesWithCoords = itemsByDay[day]
      .filter(item => item.place_id)
      .map(item => {
        const place = getPlaceById(item.place_id);
        return place && place.latitude && place.longitude ? place : null;
      })
      .filter(place => place !== null);
    
    // If we have places with coordinates, show route summary
    if (dayPlacesWithCoords.length > 0) {
      // Route map placeholder
      doc.save();
      doc.rect(doc.x, doc.y, 400, 150).fill('#f0f0f0');
      doc.fillColor('#666666')
         .fontSize(10)
         .text('Day Route Map', doc.x + 150, doc.y - 75, { width: 100, align: 'center' });
      doc.restore();
      
      doc.moveDown(0.7);
      
      // List route stops in order
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text('Route Stops:')
         .moveDown(0.2);
      
      dayPlacesWithCoords.forEach((place, idx) => {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#000000')  // Darker color for better readability
           .text(`${idx + 1}. ${place.name}`, { continued: true })
           .fillColor('#555555')  // Darker gray for address
           .font('Helvetica-Italic')
           .text(place.address ? ` - ${place.address}` : '')
           .moveDown(0.2);
      });
      
      doc.moveDown(1);
    } else {
      doc.fontSize(10)
         .font('Helvetica-Italic')
         .fillColor('#555555')
         .text('No places with location data available for routing.')
         .moveDown(1);
    }
    
    // Timeline for each activity
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Detailed Itinerary:')
       .moveDown(0.5);
    
    itemsByDay[day].forEach((item, index) => {
      const startTime = formatTime(item.start_time);
      const endTime = formatTime(item.end_time);
      const place = item.place_id ? getPlaceById(item.place_id) : null;
      
      // Activity timeframe
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#000000')  // Much darker blue for better readability
         .text(`${startTime} - ${endTime}`, { continued: true })
         .fillColor('#000000')  // Black for the title text
         .text(`: ${item.title}`);
      
      // Location if available
      if (place) {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#333333')  // Darker color for better readability
           .text(`Location: ${place.name}`, { indent: 15 });
        
        if (place.address) {
          doc.fillColor('#444444')
             .text(`Address: ${place.address}`, { indent: 15 });
        }
        
        // Add placeholder for place image if available
        if (place.image_url) {
          doc.save();
          doc.rect(doc.x + 15, doc.y + 5, 60, 40).fill('#e0e0e0');
          doc.fillColor('#666666')
             .fontSize(7)
             .text('Place Image', doc.x + 25, doc.y - 15, { width: 40, align: 'center' });
          doc.restore();
          doc.moveDown(2.5);
        }
      }
      
      // Description if available
      if (item.description) {
        doc.fontSize(10)
           .font('Helvetica-Italic')
           .fillColor('#333333')  // Darker color for description
           .text(item.description, { indent: 15 });
      }
      
      // Tags if available
      if (item.tags) {
        const tags = typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags;
        if (Array.isArray(tags) && tags.length > 0) {
          doc.fontSize(9)
             .font('Helvetica')
             .fillColor('#444444')  // Darker color for tags
             .text(`Tags: ${tags.join(', ')}`, { indent: 15 });
        }
      }
      
      // Add spacing between activities
      doc.moveDown(0.5);
      
      // Add connector line except for the last activity
      if (index < itemsByDay[day].length - 1) {
        doc.moveTo(100, doc.y)
           .lineTo(100, doc.y + 10)
           .stroke('#999999');  // Darker line color
        doc.moveDown(0.5);
      }
    });
    
    doc.moveDown(1);
  });
}

/**
 * Generate the PDF footer with page numbers
 */
function generateFooter(doc) {
  const totalPages = doc.bufferedPageRange().count;
  let currentPage = 1;
  
  // Add footer to each page
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    
    // Footer line
    doc.moveTo(72, doc.page.height - 50)
       .lineTo(doc.page.width - 72, doc.page.height - 50)
       .stroke('#999999')  // Darker line for better visibility
       .moveDown(0.5);
    
    // Page numbers
    doc.fontSize(10)
       .font('Helvetica-Bold')  // Bold font for better readability
       .fillColor('#333333')    // Darker text color
       .text(
         `Page ${currentPage} of ${totalPages}`,
         72,
         doc.page.height - 40,
         { align: 'center', width: doc.page.width - 144 }
       );
    
    // Copyright notice
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#555555')    // Darker text color
       .text(
         `Generated by Skydea Trip Planner - ${new Date().toISOString().split('T')[0]}`,
         72,
         doc.page.height - 25,
         { align: 'center', width: doc.page.width - 144 }
       );
    
    currentPage++;
  }
}

/**
 * Format time string (HH:MM:SS) to AM/PM format
 */
function formatTime(timeStr) {
  if (!timeStr) return 'N/A';
  
  // Handle different formats of time storage
  let hours, minutes;
  
  if (timeStr.includes(':')) {
    // HH:MM or HH:MM:SS format
    const parts = timeStr.split(':');
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
  } else {
    // Unix timestamp or other format
    try {
      const date = new Date(timeStr);
      hours = date.getHours();
      minutes = date.getMinutes();
    } catch (e) {
      return timeStr; // Return original if parsing fails
    }
  }
  
  // Convert to 12-hour format
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  
  // Format minutes with leading zero
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${hours}:${formattedMinutes} ${ampm}`;
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = exports;