// Global variables
let selectionTimeout;
let floatingButton = null;
let isButtonVisible = false;
let currentSelection = null;

// Create floating button element
function createFloatingButton() {
  const button = document.createElement('div');
  button.className = 'web-to-sheet-floating-button';
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-save">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
    <span>Save to Sheet</span>
  `;
  
  // Add click event listener
  button.addEventListener('click', handleSaveButtonClick);
  
  // Append to body
  document.body.appendChild(button);
  
  return button;
}

// Show floating button near selection
function showFloatingButton(selection) {
  if (!floatingButton) {
    floatingButton = createFloatingButton();
  }
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Store the current selection
  currentSelection = {
    text: selection.toString().trim(),
    title: document.title,
    url: window.location.href
  };
  
  // Position the button
  floatingButton.style.top = `${window.scrollY + rect.bottom + 10}px`;
  floatingButton.style.left = `${window.scrollX + rect.left + (rect.width / 2) - (floatingButton.offsetWidth / 2)}px`;
  
  // Make sure button is within viewport
  const rightEdge = window.scrollX + window.innerWidth;
  const buttonRight = parseFloat(floatingButton.style.left) + floatingButton.offsetWidth;
  
  if (buttonRight > rightEdge) {
    floatingButton.style.left = `${rightEdge - floatingButton.offsetWidth - 10}px`;
  }
  
  if (parseFloat(floatingButton.style.left) < window.scrollX) {
    floatingButton.style.left = `${window.scrollX + 10}px`;
  }
  
  // Show the button
  floatingButton.classList.add('visible');
  isButtonVisible = true;
}

// Hide floating button
function hideFloatingButton() {
  if (floatingButton) {
    floatingButton.classList.remove('visible');
    isButtonVisible = false;
    currentSelection = null;
  }
}

// Handle text selection
function handleTextSelection() {
  console.log('Text selection event triggered');
  clearTimeout(selectionTimeout);
  
  selectionTimeout = setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    console.log('Selection timeout - Text length:', selectedText.length);
    
    if (selectedText.length > 0) {
      console.log('Text selected, showing button');
      showFloatingButton(selection);
    } else if (isButtonVisible) {
      console.log('No text selected, hiding button');
      hideFloatingButton();
    }
  }, 200);
}

// Handle save button click
function handleSaveButtonClick() {
  console.log('Save button clicked');
  
  if (currentSelection && currentSelection.text.length > 0) {
    console.log('Using stored selection:', currentSelection);
    
    try {
      console.log('Attempting to send message to background script...');
      chrome.runtime.sendMessage({
        action: 'saveSelection',
        text: currentSelection.text,
        title: currentSelection.title,
        url: currentSelection.url
      }, (response) => {
        console.log('Message callback executed');
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
        } else {
          console.log('Message sent successfully, response:', response);
        }
      });
      console.log('Message send attempt completed');
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
    
    // Hide the button
    hideFloatingButton();
  } else {
    console.log('No stored selection available');
  }
}

// Handle clicks outside of selection
function handleDocumentClick(event) {
  // Check if click is outside the floating button
  if (isButtonVisible && floatingButton && !floatingButton.contains(event.target)) {
    const selection = window.getSelection();
    
    // If no text is selected or click is outside selection, hide the button
    if (selection.toString().trim().length === 0) {
      hideFloatingButton();
    }
  }
}

// Initialize
function init() {
  // Listen for text selection
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keyup', handleTextSelection);
  
  // Listen for clicks outside selection
  document.addEventListener('click', handleDocumentClick);
  
  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSelection') {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      sendResponse({
        text: selectedText,
        title: document.title,
        url: window.location.href
      });
    }
  });
}

// Start the extension
init();