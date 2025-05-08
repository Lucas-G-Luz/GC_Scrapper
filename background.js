// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrapeData") {
    sendResponse({ success: true });
  }
  return true; // Required for async response
}); 