document.addEventListener('DOMContentLoaded', () => {
    function handleSuccess(response) {
        status.textContent = 'Data scraped successfully!';
        status.className = 'success';

        // Ordenar os dados por rating em ordem decrescente
        response.data.sort((a, b) => {
            const ratingDiff = parseFloat(b.rating) - parseFloat(a.rating);
            if (ratingDiff !== 0) return ratingDiff;
            // Se os ratings forem iguais, usar DIFF como critério de desempate
            return parseInt(b.diff) - parseInt(a.diff);
        });

        // Display the data in the table
        if (response.data && response.data.length > 0) {
            // Definir a ordem das colunas manualmente
            const columnOrder = ['name', 'level', 'diff', 'adr', 'kdr', 'kast', 'rp', 'rating'];
            let tableHTML = '<tr>';
            columnOrder.forEach(header => {
                tableHTML += `<th>${header.toUpperCase()}</th>`;
            });
            tableHTML += '</tr>';

            // Gerar as linhas da tabela na ordem correta
            response.data.forEach(row => {
                tableHTML += '<tr>';
                columnOrder.forEach(header => {
                    // Format ADR to always show 2 decimal places
                    if (header === 'adr') {
                        const adrValue = parseFloat(row[header]).toFixed(2);
                        tableHTML += `<td>${adrValue}</td>`;
                    } else {
                        tableHTML += `<td>${row[header]}</td>`;
                    }
                });
                tableHTML += '</tr>';
            });

            // Atualizar o conteúdo da tabela
            dataTable.innerHTML = tableHTML;
        } else {
            status.textContent = 'No data found';
            status.className = 'error';
        }
        button.disabled = false;
    }

    const button = document.getElementById('scrapeButton');
    const status = document.getElementById('status');
    const dataTable = document.getElementById('dataTable');

    // Check if we're on a valid GamersClub match page
    async function checkValidPage() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Current URL:', tab.url); // Debug log

        // More permissive check for GamersClub match pages
        return tab.url.includes('gamersclub.com.br') &&
            (tab.url.includes('/match/') || tab.url.includes('/lobby/'));
    }

    // Initialize popup state
    async function initializePopup() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Checking page:', tab.url); // Debug log

        const isValidPage = await checkValidPage();
        console.log('Is valid page:', isValidPage); // Debug log

        button.disabled = !isValidPage;
        if (!isValidPage) {
            status.textContent = 'Please navigate to a GamersClub match page';
            status.className = 'error';
        }
    }

    // Initialize on popup open
    initializePopup();

    button.addEventListener('click', async () => {
        button.disabled = true;
        status.textContent = 'Scraping data...';
        status.className = 'loading';
        dataTable.innerHTML = ''; // Clear previous results

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                throw new Error('No active tab found');
            }

            // Check if we can inject the content script
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
            } catch (error) {
                console.log('Content script already injected or failed to inject:', error);
            }

            // Send message to content script with timeout
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timeout - please refresh the page')), 5000)
            );

            const messagePromise = chrome.tabs.sendMessage(tab.id, { action: "scrapeData" });

            const response = await Promise.race([messagePromise, timeout]);

            if (response.success) {
                console.log('Data scraped successfully:', response.data);
                handleSuccess(response);
            } else {
                throw new Error(response.error || 'Failed to scrape data');
            }
        } catch (error) {
            console.error('Error:', error);
            status.textContent = error.message || 'Failed to scrape data';
            status.className = 'error';
            button.disabled = false;
        }
    });
});