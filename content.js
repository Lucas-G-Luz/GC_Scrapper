// Configuration for desired players
const DESIRED_PLAYERS = ["VitoX", "Luigui", "Rukithi", "LighT.", "xelA", "mr.K"];

// Function to check if a team contains any of the desired players
function containsDesiredPlayers(players) {
  return players.some(player => DESIRED_PLAYERS.includes(player.name));
}

// Function to scrape player data
function scrapePlayerData() {
  console.log('Starting to scrape player data...');

  // Try different selectors for the table
  const table = document.querySelector('table') || document.querySelector('.match-stats-table');
  if (!table) {
    console.error('No table found on the page');
    throw new Error('No table found on the page');
  }

  // Encontrar a linha de headers correta (primeira linha do tbody com abbr)
  let headerRow = null;
  let headerCols = [];
  const tbody = table.querySelector('tbody');
  if (tbody) {
    const possibleHeaderRow = Array.from(tbody.querySelectorAll('tr')).find(tr =>
      Array.from(tr.querySelectorAll('td')).some(td => td.querySelector('abbr'))
    );
    if (possibleHeaderRow) {
      headerRow = possibleHeaderRow;
      headerCols = Array.from(headerRow.querySelectorAll('td'));
    }
  }
  // Fallback para thead se não encontrar no tbody
  if (!headerRow) {
    headerRow = table.querySelector('thead tr') || table.querySelector('tr:first-child');
    headerCols = Array.from(headerRow.querySelectorAll('th, td'));
  }

  // Extrair texto dos headers (usando abbr se existir)
  const headerTexts = headerCols.map(th => {
    const abbr = th.querySelector('abbr');
    return abbr ? abbr.textContent.replace(/\s+/g, '').toUpperCase() : th.textContent.replace(/\s+/g, '').toUpperCase();
  });
  console.log('Header columns normalized:', headerTexts);

  // Função para buscar índice por possíveis variações
  const getIndex = (labels) => {
    if (!Array.isArray(labels)) labels = [labels];
    for (const label of labels) {
      const idx = headerTexts.findIndex(h => h.includes(label.replace(/\s+/g, '').toUpperCase()));
      if (idx >= 0) {
        console.log(`Looking for ${label}, found index:`, idx);
        return idx;
      }
    }
    console.log(`Looking for ${labels}, found index: -1`);
    return null;
  };

  const idxADR = getIndex(['ADR']);
  const idxKDR = getIndex(['K/D', 'KDR']);
  const idxKAST = getIndex(['KAST']);
  const idxRP = getIndex(['RP']);

  console.log('Column indices:', { idxADR, idxKDR, idxKAST, idxRP });

  // Try different selectors for player rows
  const rows = Array.from(table.querySelectorAll('tr')).filter(row => {
    const name = row.querySelector('.PlayerStatsProfile__nickname, .player-name, [data-player]');
    return name && !row.closest('thead');
  });

  if (rows.length === 0) {
    console.error('No player rows found');
    throw new Error('No player rows found');
  }

  console.log(`Found ${rows.length} player rows`);

  const jogadores = [];

  rows.forEach(row => {
    try {
      const cols = Array.from(row.querySelectorAll('td'));
      if (cols.length === 0) {
        console.log('No columns found in row');
        return;
      }

      // Get player name
      const nameElement = row.querySelector('.PlayerStatsProfile__nickname, .player-name, [data-player]');
      const name = nameElement ? nameElement.textContent.trim() : 'Desconhecido';
      
      // Get player level (badge number near the name)
      let level = 0;
      // Busca o badge próximo ao nome
      if (nameElement) {
        const badge = nameElement.closest('tr').querySelector('.PlayerAdditionalInfo__level, .player-level, .badge-level-value, [class*="level"]');
        if (badge) {
          const badgeNumber = badge.textContent.match(/\d+/);
          if (badgeNumber) level = parseInt(badgeNumber[0]);
        }
      }

      // Extract stats by column index
      const adr = idxADR !== null && cols[idxADR] ? 
        parseFloat(cols[idxADR].textContent.replace(',', '.').trim()) || 0 : 0;
      
      const kdr = idxKDR !== null && cols[idxKDR] ? 
        parseFloat(cols[idxKDR].textContent.replace(',', '.').trim()) || 0 : 0;
      
      const kast = idxKAST !== null && cols[idxKAST] ? 
        parseFloat(cols[idxKAST].textContent.replace('%', '').replace(',', '.').trim()) || 0 : 0;
      
      let rp = '';
      if (idxRP !== null && cols[idxRP]) {
        rp = cols[idxRP].textContent.trim();
        const hasDoubleRP = cols[idxRP].getAttribute('title') === 'Jogador com Desafio RP ativado';
        if (hasDoubleRP && /^[+-]?\d+$/.test(rp)) {
          rp = (parseInt(rp) / 2).toString();
          if (parseInt(rp) > 0) rp = '+' + rp;
        }
      }

      // Calculate rating
      const rating = (
        0.35 +
        0.2275  * kdr +
        0.00366 * adr +
        0.00186 * kast
      ).toFixed(2);

      console.log('Player data:', { name, level, adr, kdr, kast, rp, rating });

      jogadores.push({ 
        name, 
        level: level.toString(), 
        adr: adr.toFixed(2), 
        kdr: kdr.toFixed(2), 
        kast: kast.toString(), 
        rp, 
        rating 
      });
    } catch (error) {
      console.error('Error processing player row:', error);
    }
  });

  console.log('All players found:', jogadores);

  // Filter desired players
  const desiredPlayers = jogadores.filter(player => 
    DESIRED_PLAYERS.includes(player.name)
  );

  console.log('Desired players:', desiredPlayers);

  if (desiredPlayers.length === 0) {
    console.error('No desired players found');
    throw new Error('No desired players found');
  }

  return desiredPlayers;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  
  if (request.action === "scrapeData") {
    console.log('Starting data scraping process...');
    
    try {
      const playerData = scrapePlayerData();
      console.log('Sending data to popup...');
      
      sendResponse({ 
        success: true, 
        data: playerData,
        message: 'Data scraped successfully'
      });
    } catch (error) {
      console.error('Error in message listener:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
  }
  return true; // Required for async response
}); 