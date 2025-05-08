# GamersClub Scraper Chrome Extension

This Chrome extension allows you to scrape data from GamersClub match pages.

## Setup Instructions

1. **Clone or download this repository**

2. **Load the extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the directory containing this extension

## Usage

1. Click the extension icon in your Chrome toolbar
2. Navigate to a GamersClub match page
3. Click "Scrape Data" to collect player data

## Customizing the Scraper

To modify what data is scraped:
1. Open `content.js`
2. Modify the `scrapedData` object in the scraping logic
3. Add your own selectors to target specific elements on the webpage

## Files Structure

- `manifest.json`: Extension configuration
- `popup.html`: Extension popup interface
- `popup.js`: Popup interaction logic
- `content.js`: Web scraping logic
- `background.js`: Background script
- `icons/`: Extension icons

## Requirements

- Google Chrome browser 