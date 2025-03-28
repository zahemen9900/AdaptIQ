/**
 * ODF Exporter Module
 * 
 * This module provides functions for exporting the learning schedule to ODF format
 * and ensures Firebase compatibility for the exported data.
 */

import { TextDocument, Paragraph, Style, ParagraphStyle, TableStyle, Table, TableRow, TableCell, TableColumn, TextProperties, ParagraphProperties, TableProperties, TableColumnProperties, TableRowProperties, TableCellProperties, Color } from 'simple-odf';

/**
 * Exports the schedule to an ODF file
 * @param {Object} schedule - The schedule object to export
 * @param {string} userName - The user's name to display in the document
 * @returns {Blob} - The ODF file as a Blob
 */
export const exportScheduleToODF = (schedule, userName = 'Student') => {
  // Create a new text document
  const document = new TextDocument();
  
  // Add styles
  const titleStyle = new ParagraphStyle();
  titleStyle.setProperty(ParagraphProperties.TextAlign, 'center');
  titleStyle.setProperty(TextProperties.FontSize, 20);
  titleStyle.setProperty(TextProperties.Color, new Color(41, 128, 185)); // AdaptIQ blue color
  document.addStyle(titleStyle, 'TitleStyle');
  
  const subtitleStyle = new ParagraphStyle();
  subtitleStyle.setProperty(ParagraphProperties.TextAlign, 'center');
  subtitleStyle.setProperty(TextProperties.FontSize, 14);
  document.addStyle(subtitleStyle, 'SubtitleStyle');
  
  const dateStyle = new ParagraphStyle();
  dateStyle.setProperty(ParagraphProperties.TextAlign, 'center');
  dateStyle.setProperty(TextProperties.FontSize, 10);
  dateStyle.setProperty(TextProperties.Color, new Color(100, 100, 100));
  document.addStyle(dateStyle, 'DateStyle');
  
  const dayHeaderStyle = new ParagraphStyle();
  dayHeaderStyle.setProperty(TextProperties.FontSize, 14);
  dayHeaderStyle.setProperty(TextProperties.Bold, true);
  dayHeaderStyle.setProperty(TextProperties.Color, new Color(41, 128, 185));
  document.addStyle(dayHeaderStyle, 'DayHeaderStyle');
  
  const tableHeaderStyle = new TableCellProperties();
  tableHeaderStyle.setProperty(TableCellProperties.BackgroundColor, new Color(41, 128, 185));
  tableHeaderStyle.setProperty(TextProperties.Color, new Color(255, 255, 255));
  tableHeaderStyle.setProperty(TextProperties.Bold, true);
  
  const tableStyle = new TableStyle();
  tableStyle.setProperty(TableProperties.Width, '100%');
  tableStyle.setProperty(TableProperties.Align, 'center');
  document.addStyle(tableStyle, 'TableStyle');
  
  // Add title
  const title = document.addParagraph('AdaptIQ Learning Schedule');
  title.setStyle('TitleStyle');
  
  // Add user name
  const subtitle = document.addParagraph(`Schedule for: ${userName}`);
  subtitle.setStyle('SubtitleStyle');
  
  // Add date
  const currentDate = new Date().toLocaleDateString();
  const date = document.addParagraph(`Generated on: ${currentDate}`);
  date.setStyle('DateStyle');
  
  // Add empty paragraph for spacing
  document.addParagraph('');
  
  // Add schedule for each day
  const days = Object.keys(schedule);
  
  days.forEach(day => {
    // Add day header
    const dayHeader = document.addParagraph(day);
    dayHeader.setStyle('DayHeaderStyle');
    
    // Create table for this day's sessions
    const sessions = schedule[day];
    if (sessions.length > 0) {
      const table = document.addTable();
      table.setStyle('TableStyle');
      
      // Add table header row
      const headerRow = table.addRow();
      
      const timeHeader = headerRow.addCell('Time');
      timeHeader.setProperties(tableHeaderStyle);
      
      const courseHeader = headerRow.addCell('Course');
      courseHeader.setProperties(tableHeaderStyle);
      
      const typeHeader = headerRow.addCell('Type');
      typeHeader.setProperties(tableHeaderStyle);
      
      const difficultyHeader = headerRow.addCell('Difficulty');
      difficultyHeader.setProperties(tableHeaderStyle);
      
      // Add rows for each session
      sessions.forEach(session => {
        const row = table.addRow();
        
        row.addCell(`${session.startTime} - ${session.endTime}`);
        row.addCell(session.course);
        row.addCell(session.type || '');
        row.addCell(session.difficulty || '');
      });
    } else {
      // No sessions for this day
      const noSessions = document.addParagraph('No study sessions scheduled');
      noSessions.setProperty(TextProperties.Color, new Color(100, 100, 100));
    }
    
    // Add empty paragraph for spacing
    document.addParagraph('');
  });
  
  // Add footer
  const footer = document.addParagraph('AdaptIQ Learning Platform - Personalized Learning Schedule');
  footer.setProperty(TextProperties.Color, new Color(150, 150, 150));
  footer.setProperty(TextProperties.FontSize, 8);
  footer.setProperty(ParagraphProperties.TextAlign, 'center');
  
  // Return the document as a blob
  return document.saveAsBlob();
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