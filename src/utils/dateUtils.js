/**
 * Date utility functions for handling calendar date formats
 * 
 * This module provides helper functions to standardize date handling
 * between frontend and backend, particularly focusing on ensuring
 * DD/MM/YYYY format is properly interpreted.
 */

/**
 * Standardize a date to YYYY-MM-DD format for API consumption
 * This is the safest format for backend transmission
 * 
 * @param {Date|string|number} date - Date to standardize
 * @returns {string} Date in YYYY-MM-DD format
 */
function standardizeDate(date) {
  try {
    // Handle date object
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    
    // Handle string date in DD/MM/YYYY format
    if (typeof date === 'string') {
      const ddmmRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const ddmmMatch = date.match(ddmmRegex);
      
      if (ddmmMatch) {
        // If it matches DD/MM/YYYY pattern, convert to YYYY-MM-DD explicitly
        const [_, day, month, year] = ddmmMatch;
        const parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      }
      
      // If it's already YYYY-MM-DD format, ensure it's valid
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return date;
        }
      }
      
      // Otherwise try standard date parsing
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
    }
    
    // Handle timestamp
    if (typeof date === 'number') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
    }
    
    // Return the original if we can't parse it
    return date;
  } catch (error) {
    console.error('Error standardizing date:', error);
    return date;
  }
}

/**
 * Prepare calendar data for API submission
 * Ensures all dates are in a standard format
 * 
 * @param {Array} calendarData - Array of calendar entries { date, isAvailable, price, etc. }
 * @returns {Array} Processed calendar data with standardized dates
 */
function prepareCalendarDataForApi(calendarData) {
  if (!Array.isArray(calendarData)) {
    return [];
  }
  
  return calendarData.map(entry => {
    if (!entry || !entry.date) return null;
    
    return {
      ...entry,
      date: standardizeDate(entry.date)
    };
  }).filter(Boolean);
}

/**
 * Format a date string for display to users
 * 
 * @param {string|Date} date - Date to format
 * @param {string} format - Format to use (default: 'dd/MM/yyyy')
 * @returns {string} Formatted date string
 */
function formatDateForDisplay(date, format = 'DD/MM/YYYY') {
  if (!date) return '';
  
  try {
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return date; // Return original if not parseable
      }
    }
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    if (format === 'DD/MM/YYYY') {
      return `${day}/${month}/${year}`;
    } else if (format === 'MM/DD/YYYY') {
      return `${month}/${day}/${year}`;
    } else if (format === 'YYYY-MM-DD') {
      return `${year}-${month}-${day}`;
    }
    
    // Default to ISO format
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return date;
  }
}

module.exports = {
  standardizeDate,
  prepareCalendarDataForApi,
  formatDateForDisplay
}; 