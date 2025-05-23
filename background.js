// Add context menu item on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'saveToSheet',
      title: 'Save to Google Sheet',
      contexts: ['selection']
    });
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  
  if (request.action === 'saveSelection') {
    console.log('Processing saveSelection action');
    
    // Store the selection data
    chrome.storage.local.set({
      pendingSelection: {
        text: request.text,
        title: request.title,
        url: request.url
      }
    }, () => {
      console.log("Selection saved to storage");
      sendResponse({ success: true });

      // Create popup window
      chrome.windows.create({
        url: 'popup.html',
        type: 'popup',
        width: 400,
        height: 600,
        focused: true
      });
    });

    return true; // Keep the message channel open
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'saveToSheet') {
    // Ask content script to get selected text
    chrome.tabs.sendMessage(tab.id, { action: 'getSelection' }, (response) => {
      if (response) {
        // Store the selection data
        chrome.storage.local.set({
          pendingSelection: {
            text: response.text,
            title: response.title,
            url: response.url
          }
        }, () => {
          console.log("Context menu selection saved to storage");

          // Create popup window
          chrome.windows.create({
            url: 'popup.html',
            type: 'popup',
            width: 400,
            height: 600,
            focused: true
          });
        });
      }
    });
  }
});
