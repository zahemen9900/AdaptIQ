/**
 * Schedule Exporter Module
 * 
 * This module provides functions for exporting the learning schedule to PDF format
 * and ensures Firebase compatibility for the exported data.
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Exports the schedule to a PDF file
 * @param {Object} schedule - The schedule object to export
 * @param {string} userName - The user's name to display in the PDF
 * @returns {Blob} - The PDF file as a Blob
 */
export const exportScheduleToPDF = (schedule, userName = 'Student') => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185); // AdaptIQ blue color
  doc.text('AdaptIQ Learning Schedule', 105, 15, { align: 'center' });
  
  // Add user name
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Schedule for: ${userName}`, 105, 25, { align: 'center' });
  
  // Add date
  const currentDate = new Date().toLocaleDateString();
  doc.setFontSize(10);
  doc.text(`Generated on: ${currentDate}`, 105, 30, { align: 'center' });
  
  // Add schedule for each day
  let yPosition = 40;
  const days = Object.keys(schedule);
  
  days.forEach(day => {
    // Add day header
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text(day, 14, yPosition);
    yPosition += 7;
    
    // Check if we need to add a new page
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Create table data for this day's sessions
    const sessions = schedule[day];
    if (sessions.length > 0) {
      const tableData = sessions.map(session => [
        `${session.startTime} - ${session.endTime}`,
        session.course,
        session.type || '',
        session.difficulty || ''
      ]);
      
      // Add table for this day's sessions
      doc.autoTable({
        startY: yPosition,
        head: [['Time', 'Course', 'Type', 'Difficulty']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        margin: { left: 14, right: 14 },
        styles: { overflow: 'linebreak' },
      });
      
      // Update yPosition after the table
      yPosition = doc.autoTable.previous.finalY + 15;
    } else {
      // No sessions for this day
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No study sessions scheduled', 20, yPosition);
      yPosition += 15;
    }
    
    // Check if we need to add a new page for the next day
    if (yPosition > 250 && day !== days[days.length - 1]) {
      doc.addPage();
      yPosition = 20;
    }
  });
  
  // Add footer with AdaptIQ branding
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('AdaptIQ Learning Platform - Personalized Learning Schedule', 105, 285, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
  }
  
  try {
    // Return the PDF as a blob
    // Using a string output and converting to blob for better browser compatibility
    const pdfData = doc.output('datauristring');
    const base64Data = pdfData.split(',')[1];
    const binaryData = atob(base64Data);
    const array = new Uint8Array(binaryData.length);
    
    for (let i = 0; i < binaryData.length; i++) {
      array[i] = binaryData.charCodeAt(i);
    }
    
    return new Blob([array], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
};

/**
 * Prepares schedule data for Firebase storage
 * @param {Object} schedule - The schedule object to prepare
 * @returns {Object} - Firebase-compatible schedule object
 */
export const prepareScheduleForFirebase = (schedule) => {
  // Create a deep copy of the schedule
  const firebaseSchedule = JSON.parse(JSON.stringify(schedule));
  
  // Ensure there are no circular references or invalid data types
  // Firebase supports: strings, numbers, booleans, null, arrays, and objects
  Object.keys(firebaseSchedule).forEach(day => {
    firebaseSchedule[day].forEach(session => {
      // Convert any complex objects to strings if needed
      Object.keys(session).forEach(key => {
        const value = session[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          session[key] = JSON.stringify(value);
        }
      });
      
      // Add timestamp for Firebase
      session.lastUpdated = new Date().toISOString();
    });
  });
  
  return firebaseSchedule;
};

/**
 * Saves the schedule to Firebase
 * @param {Object} schedule - The schedule object to save
 * @param {string} userId - The user ID to associate with the schedule
 * @returns {Promise} - Promise that resolves when the schedule is saved
 */
export const saveScheduleToFirebase = async (schedule, userId) => {
  // This is a placeholder function that would be implemented when Firebase is integrated
  // For now, we'll just return a resolved promise with the prepared schedule
  const firebaseSchedule = prepareScheduleForFirebase(schedule);
  return Promise.resolve(firebaseSchedule);
};