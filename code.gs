// Google Apps Script code to handle incoming data from Chrome extension
// Deploy this as a web app with "Execute as: Me" and "Who has access: Anyone"

function getSpreadsheetId() {
  const scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty('SPREADSHEET_ID');
}

function setSpreadsheetId(id) {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('SPREADSHEET_ID', id);
}

function createInitialSpreadsheet() {
  // First check if we already have a stored spreadsheet ID
  let spreadsheetId = getSpreadsheetId();
  
  if (spreadsheetId) {
    try {
      // Try to access the existing spreadsheet
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      return spreadsheet;
    } catch (e) {
      // If the spreadsheet was deleted, we'll create a new one
      console.log('Stored spreadsheet not found, creating new one');
    }
  }
  
  // Create new spreadsheet if none exists or if the stored one was deleted
  const spreadsheet = SpreadsheetApp.create('Web-to-Sheet Logger');
  setSpreadsheetId(spreadsheet.getId());
  return spreadsheet;
}

function findSpreadsheet() {
  const spreadsheets = DriveApp.getFilesByType(MimeType.GOOGLE_SHEETS);
  while (spreadsheets.hasNext()) {
    const file = spreadsheets.next();
    Logger.log('Found spreadsheet: ' + file.getName() + ' - URL: ' + file.getUrl());
  }
}

function doGet(e) {
  if (e.parameter.test === 'true') {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'API is running'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('Invalid request');
}

function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    console.log('Received data:', data);
    
    // Get or create the spreadsheet
    const spreadsheet = createInitialSpreadsheet();
    console.log('Using spreadsheet:', spreadsheet.getUrl());
    
    // Determine which sheet to use
    let sheet;
    if (data.sheetId === 'secondary') {
      sheet = spreadsheet.getSheetByName('Secondary') || spreadsheet.insertSheet('Secondary');
    } else {
      sheet = spreadsheet.getSheetByName('Primary') || spreadsheet.insertSheet('Primary');
    }
    
    // Check if headers exist, if not add them
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Text', 'Page Title', 'URL', 'Tags']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }
    
    // Format timestamp
    const timestamp = new Date(data.timestamp);
    const formattedTimestamp = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    
    // Append the data
    sheet.appendRow([
      formattedTimestamp,
      data.text,
      data.title,
      data.url,
      data.tags || ''
    ]);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 5);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data saved successfully',
      spreadsheetUrl: spreadsheet.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}