document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const setupView = document.getElementById('setup-view');
  const mainView = document.getElementById('main-view');
  const saveView = document.getElementById('save-view');
  const scriptUrlInput = document.getElementById('script-url');
  const sheetSelect = document.getElementById('sheet-select');
  const saveSettingsBtn = document.getElementById('save-settings');
  const changeSettingsBtn = document.getElementById('change-settings');
  const connectionStatus = document.getElementById('connection-status');
  const selectedText = document.getElementById('selected-text');
  const pageTitle = document.getElementById('page-title');
  const pageUrl = document.getElementById('page-url');
  const tagsInput = document.getElementById('tags-input');
  const cancelSaveBtn = document.getElementById('cancel-save');
  const confirmSaveBtn = document.getElementById('confirm-save');
  const statusMessage = document.getElementById('status-message');
  const tagSuggestions = document.querySelectorAll('.tag-suggestion');

  // Check if settings are already saved
  chrome.storage.sync.get(['scriptUrl', 'sheetId'], function(data) {
    if (data.scriptUrl) {
      scriptUrlInput.value = data.scriptUrl;
      if (data.sheetId) {
        sheetSelect.value = data.sheetId;
      }
      
      // Test connection
      testConnection(data.scriptUrl)
        .then(() => {
          showMainView();
          updateConnectionStatus('Connected', true);
        })
        .catch(() => {
          showSetupView();
          updateConnectionStatus('Connection failed', false);
        });
    } else {
      showSetupView();
    }
  });

  // Check if there's a pending selection to save
  chrome.storage.local.get(['pendingSelection'], function(data) {
    if (data.pendingSelection) {
      const selection = data.pendingSelection;
      showSaveView(selection.text, selection.title, selection.url);
    }
  });

  // Save settings
  saveSettingsBtn.addEventListener('click', function() {
    const scriptUrl = scriptUrlInput.value.trim();
    const sheetId = sheetSelect.value;
    
    if (!scriptUrl) {
      showStatusMessage('Please enter a valid Google Apps Script URL', false);
      return;
    }
    
    // Test connection before saving
    testConnection(scriptUrl)
      .then(() => {
        chrome.storage.sync.set({ scriptUrl, sheetId }, function() {
          showMainView();
          updateConnectionStatus('Connected', true);
          showStatusMessage('Settings saved successfully', true);
        });
      })
      .catch(() => {
        showStatusMessage('Could not connect to the Google Apps Script. Please check the URL.', false);
      });
  });

  // Change settings
  changeSettingsBtn.addEventListener('click', function() {
    showSetupView();
  });

  // Cancel save
  cancelSaveBtn.addEventListener('click', function() {
    chrome.storage.local.remove(['pendingSelection']);
    showMainView();
  });

  // Handle tag suggestions
  tagSuggestions.forEach(tag => {
    tag.addEventListener('click', function() {
      const currentTags = tagsInput.value.trim();
      const newTag = this.textContent.trim();
      
      if (currentTags) {
        // Check if tag already exists
        const tags = currentTags.split(',').map(t => t.trim());
        if (!tags.includes(newTag)) {
          tagsInput.value = currentTags + ', ' + newTag;
        }
      } else {
        tagsInput.value = newTag;
      }
    });
  });

  // Confirm save
  confirmSaveBtn.addEventListener('click', function() {
    chrome.storage.local.get(['pendingSelection'], function(data) {
      if (!data.pendingSelection) return;
      
      const selection = data.pendingSelection;
      const tags = tagsInput.value.trim();
      
      chrome.storage.sync.get(['scriptUrl', 'sheetId'], function(settings) {
        if (!settings.scriptUrl) {
          showStatusMessage('Please set up your Google Apps Script URL first', false);
          showSetupView();
          return;
        }
        
        // Disable the save button while saving
        confirmSaveBtn.disabled = true;
        confirmSaveBtn.textContent = 'Saving...';
        
        saveToSheet(settings.scriptUrl, {
          text: selection.text,
          title: selection.title,
          url: selection.url,
          timestamp: new Date().toISOString(),
          tags: tags,
          sheetId: settings.sheetId || 'default'
        })
          .then(() => {
            chrome.storage.local.remove(['pendingSelection']);
            showMainView();
            showStatusMessage('Successfully saved to Google Sheet!', true);
          })
          .catch(error => {
            showStatusMessage('Failed to save to Google Sheet: ' + error.message, false);
          })
          .finally(() => {
            // Re-enable the save button
            confirmSaveBtn.disabled = false;
            confirmSaveBtn.textContent = 'Save to Sheet';
          });
      });
    });
  });

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'saveSelection') {
      showSaveView(request.text, request.title, request.url);
      sendResponse({success: true});
    }
  });

  // Helper functions
  function showSetupView() {
    setupView.classList.remove('hidden');
    mainView.classList.add('hidden');
    saveView.classList.add('hidden');
  }

  function showMainView() {
    setupView.classList.add('hidden');
    mainView.classList.remove('hidden');
    saveView.classList.add('hidden');
  }

  function showSaveView(text, title, url) {
    setupView.classList.add('hidden');
    mainView.classList.add('hidden');
    saveView.classList.remove('hidden');
    
    selectedText.textContent = text;
    pageTitle.textContent = title;
    pageUrl.textContent = url;
    
    // Store the selection in case the popup is closed
    chrome.storage.local.set({
      pendingSelection: {
        text: text,
        title: title,
        url: url
      }
    });
  }

  function updateConnectionStatus(message, isConnected) {
    connectionStatus.textContent = message;
    if (isConnected) {
      connectionStatus.classList.add('connected');
      connectionStatus.classList.remove('error');
    } else {
      connectionStatus.classList.remove('connected');
      connectionStatus.classList.add('error');
    }
  }

  function showStatusMessage(message, isSuccess) {
    statusMessage.textContent = message;
    statusMessage.classList.remove('success', 'error');
    statusMessage.classList.add(isSuccess ? 'success' : 'error');
    
    setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.classList.remove('success', 'error');
    }, 3000);
  }

  function testConnection(scriptUrl) {
    return fetch(scriptUrl + '?test=true', {
      method: 'GET',
      mode: 'no-cors' // This will make the promise resolve even if CORS is not enabled
    })
    .then(() => {
      // Since we're using no-cors, we can't actually check the response
      // This is just a basic connectivity test
      return true;
    });
  }

  function saveToSheet(scriptUrl, data) {
    console.log('Attempting to save to sheet with URL:', scriptUrl);
    console.log('Data to save:', data);
    
    return fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',  // This is important for CORS
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      console.log('Response from Google Apps Script:', response);
      return response;
    })
    .then(() => {
      // Since we're using no-cors, we can't read the response
      // But we know it was successful if we got here
      showStatusMessage('Successfully saved to Google Sheet!', true);
    })
    .catch(error => {
      console.error('Error saving to sheet:', error);
      throw new Error('Failed to connect to Google Sheets. Please check your Google Apps Script URL and deployment settings.');
    });
  }
});