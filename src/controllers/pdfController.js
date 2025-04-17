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
  
  // Places section
  generatePlacesSection(doc, places);
  
  // Daily itinerary
  generateDailyItinerary(doc, itemsByDay, places);
  
  // Footer with page numbers
  generateFooter(doc);
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
 * Generate the places section
 */
function generatePlacesSection(doc, places) {
  if (places.length === 0) {
    return;
  }
  
  doc.fontSize(18)
     .font('Helvetica-Bold')
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
       .text(capitalizeFirstLetter(category), { continued: true })
       .text(` (${placesByCategory[category].length})`)
       .moveDown(0.3);
    
    placesByCategory[category].forEach(place => {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(`• ${place.name}`, { continued: true });
      
      if (place.address) {
        doc.font('Helvetica')
           .text(`: ${place.address}`);
      } else {
        doc.text('');
      }
      
      if (place.description) {
        doc.fontSize(10)
           .font('Helvetica-Italic')
           .text(`  ${place.description}`, { indent: 10 });
      }
      
      doc.moveDown(0.3);
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
     .text('Daily Itinerary', { underline: true })
     .moveDown(0.5);
  
  // Function to get place details by ID
  const getPlaceById = (placeId) => {
    return places.find(place => place.id === placeId) || null;
  };
  
  // Process each day
  Object.keys(itemsByDay).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
    // Add page break if needed
    if (doc.y > doc.page.height - 150) {
      doc.addPage();
    }
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(`Day ${day}`, { underline: true })
       .moveDown(0.5);
    
    // Timeline for each activity
    itemsByDay[day].forEach((item, index) => {
      const startTime = formatTime(item.start_time);
      const endTime = formatTime(item.end_time);
      const place = item.place_id ? getPlaceById(item.place_id) : null;
      
      // Activity timeframe
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#3498db')
         .text(`${startTime} - ${endTime}`, { continued: true })
         .fillColor('#2c3e50')
         .text(`: ${item.title}`);
      
      // Location if available
      if (place) {
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Location: ${place.name}`, { indent: 15 });
        
        if (place.address) {
          doc.text(`Address: ${place.address}`, { indent: 15 });
        }
      }
      
      // Description if available
      if (item.description) {
        doc.fontSize(10)
           .font('Helvetica-Italic')
           .text(item.description, { indent: 15 });
      }
      
      // Tags if available
      if (item.tags) {
        const tags = typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags;
        if (Array.isArray(tags) && tags.length > 0) {
          doc.fontSize(9)
             .font('Helvetica')
             .fillColor('#7f8c8d')
             .text(`Tags: ${tags.join(', ')}`, { indent: 15 });
        }
      }
      
      // Add spacing between activities
      doc.moveDown(0.5);
      
      // Add connector line except for the last activity
      if (index < itemsByDay[day].length - 1) {
        doc.moveTo(100, doc.y)
           .lineTo(100, doc.y + 10)
           .stroke('#cccccc');
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
       .stroke('#cccccc')
       .moveDown(0.5);
    
    // Page numbers
    doc.fontSize(10)
       .font('Helvetica')
       .text(
         `Page ${currentPage} of ${totalPages}`,
         72,
         doc.page.height - 40,
         { align: 'center', width: doc.page.width - 144 }
       );
    
    // Copyright notice
    doc.fontSize(8)
       .font('Helvetica')
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