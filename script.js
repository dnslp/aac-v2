
import { items } from './items.js'; // Import items.js
    console.log('version 3')
    const symbolContainer = document.getElementById('symbolContainer');
    const decreaseSizeButton = document.getElementById('decreaseSize');
    const increaseSizeButton = document.getElementById('increaseSize');
    const sortAscendingButton = document.getElementById('sortAscending');
    const sortDescendingButton = document.getElementById('sortDescending');
    const filterSystemSelect = document.getElementById('filterSystem');
    const filterTagSelect = document.getElementById('filterTag');

    let voices = [];
    let currentSize = 100;
    const minSize = 50;
    const maxSize = 300;

    // Preserve original order and current working items
    let originalOrder = [...items];
    let currentItems = [...items];
    let isGlossaryView = false; // Tracks whether we are in glossary mode


    // Populate filter options
    function populateFilterOptions() {
        const systems = [...new Set(items.map(item => item.system))];
        systems.forEach(system => {
            const option = document.createElement('option');
            option.value = system;
            option.textContent = system;
            filterSystemSelect.appendChild(option);
        });
    }

    function populateTagOptions() {
        const allTags = new Set(items.flatMap(item => item.tags || []));
        allTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            filterTagSelect.appendChild(option);
        });
    }

    // Render items based on the current view (grouped or glossary)
    function renderItems(filterSystem = "all", filterTag = "all") {
        symbolContainer.innerHTML = '';

        if (isGlossaryView) {
            // Render a flat sorted view (glossary mode)
            const filteredItems = currentItems.filter(item => {
                const systemMatch = filterSystem === "all" || item.system === filterSystem;
                const tagMatch = filterTag === "all" || (item.tags && item.tags.includes(filterTag));
                return systemMatch && tagMatch;
            });

            filteredItems.forEach(item => createSymbolItem(item));
        } else {
            // Render grouped view (default mode)
            const groupedItems = currentItems.reduce((groups, item) => {
                if (filterSystem !== "all" && item.system !== filterSystem) return groups;
                if (filterTag !== "all" && !(item.tags && item.tags.includes(filterTag))) return groups;

                if (!groups[item.system]) {
                    groups[item.system] = [];
                }
                groups[item.system].push(item);
                return groups;
            }, {});

            for (const [system, systemItems] of Object.entries(groupedItems)) {
                const section = document.createElement('div');
                section.classList.add('category');

                const header = document.createElement('h2');
                header.textContent = system.charAt(0).toUpperCase() + system.slice(1);
                header.className = "header"
                section.appendChild(header);

                const symbolSection = document.createElement('div');
                symbolSection.classList.add('symbol-section');
                systemItems.forEach(item => createSymbolItem(item, symbolSection));

                section.appendChild(symbolSection);
                symbolContainer.appendChild(section);
            }
        }
    }

    // Create a single symbol item and add to the container
    function createSymbolItem(item, container = symbolContainer) {
        const symbolItem = document.createElement('div');
        symbolItem.classList.add('symbol-item');
        symbolItem.setAttribute('data-label', item.label);

        if (item.type === 'emoji' || item.type === 'text') {
            const symbol = document.createElement('div');
            symbol.classList.add('symbol');
            symbol.textContent = item.symbol;
            symbolItem.appendChild(symbol);
        } else if (item.type === 'image') {
            const img = document.createElement('img');
            img.src = item.symbol;
            img.alt = item.label;
            img.style.width = '80%';
            img.style.height = '80%';
            symbolItem.appendChild(img);
        } else if (item.type === 'svg') {
            const svgContainer = document.createElement('div');
            svgContainer.innerHTML = item.symbol;
            svgContainer.style.width = '80%';
            svgContainer.style.height = '80%';
            symbolItem.appendChild(svgContainer);
        }

        const label = document.createElement('div');
        label.classList.add('label');
        label.textContent = item.label;
        symbolItem.appendChild(label);

        // Add click event to speak the label
        symbolItem.addEventListener('click', () => {
            speakText(item.label);
        });

        container.appendChild(symbolItem);
    }

    // Adjust symbol size
    function adjustSize(amount) {
        currentSize = Math.max(minSize, Math.min(maxSize, currentSize + amount));
        document.documentElement.style.setProperty('--symbol-size', `${currentSize}px`);
    }

    // Sort symbols
    function sortSymbols(order) {
        isGlossaryView = true; // Switch to glossary view
        currentItems.sort((a, b) => {
            const labelA = a.label.toLowerCase();
            const labelB = b.label.toLowerCase();
            return order === 'asc' ? labelA.localeCompare(labelB) : labelB.localeCompare(labelA);
        });
        renderItems(); // Re-render the items in glossary mode
    }

    // Reset symbols to original order
    function resetSymbols() {
        isGlossaryView = false; // Return to grouped view
        currentItems = [...originalOrder]; // Reset to original order
        renderItems(); // Re-render the items in grouped view
    }

    // Populate voices for text-to-speech
    function populateVoices() {
        voices = window.speechSynthesis.getVoices().filter(voice =>
            voice.lang.startsWith('en') &&
            (voice.lang.includes('US') || voice.lang.includes('GB') || voice.lang.includes('AU'))
        );
        const voiceSelect = document.getElementById('voiceSelect');
        voiceSelect.innerHTML = '';
        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
    }

    // Speak text
    function speakText(text) {
        const utterance = new SpeechSynthesisUtterance();
        const selectedVoiceIndex = document.getElementById('voiceSelect').value;

        if (/^[A-Z]$/.test(text)) {
            utterance.text = text.toLowerCase();
        } else {
            utterance.text = text;
        }

        if (voices[selectedVoiceIndex]) {
            utterance.voice = voices[selectedVoiceIndex];
        }
        window.speechSynthesis.speak(utterance);
    }

    // Event listeners
    decreaseSizeButton.addEventListener('click', () => adjustSize(-10));
    increaseSizeButton.addEventListener('click', () => adjustSize(10));
    sortAscendingButton.addEventListener('click', () => sortSymbols('asc'));
    sortDescendingButton.addEventListener('click', () => sortSymbols('desc'));

    // Add Reset Button
    const resetButton = document.getElementById('reset');
  
    resetButton.addEventListener('click', resetSymbols);

    filterSystemSelect.addEventListener('change', () => renderItems(filterSystemSelect.value, filterTagSelect.value));
    filterTagSelect.addEventListener('change', () => renderItems(filterSystemSelect.value, filterTagSelect.value));

    window.speechSynthesis.onvoiceschanged = populateVoices;

    document.addEventListener('DOMContentLoaded', () => {
        populateFilterOptions();
        populateTagOptions();
        renderItems();
        populateVoices();
    });

    document.addEventListener('DOMContentLoaded', () => {
        const filterBar = document.querySelector('.filter-bar');
        const toggleButton = document.getElementById('toggleFilterBar');
    
        // Toggle visibility on button click
        toggleButton.addEventListener('click', () => {
            if (filterBar.style.display === 'none' || !filterBar.style.display) {
                filterBar.style.display = 'inline-grid';
                toggleButton.textContent = 'Hide';
            } else {
                filterBar.style.display = 'none';
                toggleButton.textContent = '⛭';
            }
        });
    });
    