# Web-to-Sheet Logger

A Chrome extension that allows users to highlight text on any webpage and save it to a Google Sheet.

## Features

- Highlight text on any webpage and save it to Google Sheets
- Floating "Save to Sheet" button appears when text is selected
- Add tags to categorize your saved content
- Choose between two different Google Sheets
- Context menu integration for right-click saving
- Stores page title, URL, and timestamp along with selected text

## Setup Instructions

### 1. Set up the Google Apps Script

1. Go to [Google Apps Script](https://script.google.com/home)
2. Create a new project
3. Copy the contents of the `code.gs` file from this repository into the script editor
4. Save the project with a name like "Web-to-Sheet Logger"
5. Click on "Deploy" > "New deployment"
6. Select "Web app" as the deployment type
7. Configure the deployment:
   - Execute as: Me (your Google account)
   - Who has access: Anyone
8. Click "Deploy" and authorize the script
9. Copy the Web App URL that is provided after deployment

### 2. Load the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked" and select the folder containing this extension
4. The extension should now appear in your Chrome toolbar

### 3. Configure the Extension

1. Click on the extension icon in the Chrome toolbar
2. Paste the Google Apps Script Web App URL you copied earlier
3. Select which sheet you want to use (Default or Secondary)
4. Click "Save Settings"

## Usage

### Method 1: Using the Floating Button

1. Highlight text on any webpage
2. A "Save to Sheet" button will appear near your selection
3. Click the button
4. Add optional tags in the popup
5. Click "Save to Sheet" to save the selection

### Method 2: Using the Context Menu

1. Highlight text on any webpage
2. Right-click on the selection
3. Select "Save to Google Sheet" from the context menu
4. Add optional tags in the popup
5. Click "Save to Sheet" to save the selection

## Permissions Used

- `activeTab`: Allows the extension to access the current tab
- `scripting`: Enables the extension to inject scripts into web pages
- `storage`: Allows the extension to store settings and temporary data

## Development

### Project Structure

- `manifest.json`: Chrome extension configuration
- `popup.html` & `popup.js`: Extension popup interface
- `content.js`: Script injected into webpages to handle text selection
- `styles.css`: Styling for the floating button
- `background.js`: Background script for context menu integration
- `code.gs`: Google Apps Script code for the server-side component

## License

This project is licensed under the MIT License.