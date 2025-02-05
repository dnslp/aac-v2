import { items } from './items.js'; // Importing symbols

console.log('version 4');

const symbolContainer = document.getElementById('symbolContainer');
const decreaseSizeButton = document.getElementById('decreaseSize');
const increaseSizeButton = document.getElementById('increaseSize');
const sortAscendingButton = document.getElementById('sortAscending');
const sortDescendingButton = document.getElementById('sortDescending');
const filterSystemSelect = document.getElementById('filterSystem');
const filterTagSelect = document.getElementById('filterTag');
const resetButton = document.getElementById('reset');

let voices = [];
let currentSize = 100;
const minSize = 50;
const maxSize = 300;

let originalOrder = [...items];
let currentItems = [...items];
let isGlossaryView = false;

// Populate dropdown options
function populateFilterOptions() {
    const systems = [...new Set(items.map(item => item.system))];
    filterSystemSelect.innerHTML = '<option value="all">All</option>';
    systems.forEach(system => {
        const option = document.createElement('option');
        option.value = system;
        option.textContent = system;
        filterSystemSelect.appendChild(option);
    });
}

function populateTagOptions() {
    const allTags = new Set(items.flatMap(item => item.tags || []));
    filterTagSelect.innerHTML = '<option value="all">All</option>';
    allTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        filterTagSelect.appendChild(option);
    });
}

// Renders items dynamically based on filters
function renderItems(filterSystem = "all", filterTag = "all") {
    symbolContainer.innerHTML = '';

    let filteredItems = currentItems.filter(item => {
        return (filterSystem === "all" || item.system === filterSystem) &&
               (filterTag === "all" || (item.tags && item.tags.includes(filterTag)));
    });

    if (isGlossaryView) {
        filteredItems.forEach(item => createSymbolItem(item));
    } else {
        const groupedItems = filteredItems.reduce((groups, item) => {
            if (!groups[item.system]) groups[item.system] = [];
            groups[item.system].push(item);
            return groups;
        }, {});

        for (const [system, systemItems] of Object.entries(groupedItems)) {
            const section = document.createElement('div');
            section.classList.add('category');

            const header = document.createElement('h2');
            header.textContent = system.charAt(0).toUpperCase() + system.slice(1);
            header.className = "header";
            section.appendChild(header);

            const symbolSection = document.createElement('div');
            symbolSection.classList.add('symbol-section');
            systemItems.forEach(item => createSymbolItem(item, symbolSection));

            section.appendChild(symbolSection);
            symbolContainer.appendChild(section);
        }
    }
}

// Creates a single symbol item
function createSymbolItem(item, container = symbolContainer) {
    const symbolItem = document.createElement('div');
    symbolItem.classList.add('symbol-item');
    symbolItem.setAttribute('data-label', item.label);

    let content;
    if (item.type === 'emoji' || item.type === 'text') {
        content = document.createElement('div');
        content.classList.add('symbol');
        content.textContent = item.symbol;
    } else if (item.type === 'image') {
        content = document.createElement('img');
        content.src = item.symbol;
        content.alt = item.label;
        content.style.width = '80%';
        content.style.height = '80%';
    } else if (item.type === 'svg') {
        content = document.createElement('div');
        content.innerHTML = item.symbol;
        content.style.width = '80%';
        content.style.height = '80%';
    }

    symbolItem.appendChild(content);

    const label = document.createElement('div');
    label.classList.add('label');
    label.textContent = item.label;
    symbolItem.appendChild(label);

    symbolItem.addEventListener('click', () => speakText(item.label));

    container.appendChild(symbolItem);
}

// Adjusts symbol size
function adjustSize(amount) {
    currentSize = Math.max(minSize, Math.min(maxSize, currentSize + amount));
    document.documentElement.style.setProperty('--symbol-size', `${currentSize}px`);
}

// Sorting symbols
function sortSymbols(order) {
    isGlossaryView = true;
    currentItems.sort((a, b) => order === 'asc' 
        ? a.label.localeCompare(b.label) 
        : b.label.localeCompare(a.label));
    renderItems();
}

// Resets the symbols to the original order
function resetSymbols() {
    isGlossaryView = false;
    currentItems = [...originalOrder];
    renderItems();
}

// Populate voices for text-to-speech
function populateVoices() {
    voices = window.speechSynthesis.getVoices().filter(voice =>
        voice.lang.startsWith('en') && /US|GB|AU/.test(voice.lang)
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
    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoiceIndex = document.getElementById('voiceSelect').value;
    if (voices[selectedVoiceIndex]) utterance.voice = voices[selectedVoiceIndex];
    window.speechSynthesis.speak(utterance);
}

// Event listeners
decreaseSizeButton.addEventListener('click', () => adjustSize(-10));
increaseSizeButton.addEventListener('click', () => adjustSize(10));
sortAscendingButton.addEventListener('click', () => sortSymbols('asc'));
sortDescendingButton.addEventListener('click', () => sortSymbols('desc'));
resetButton.addEventListener('click', resetSymbols);
filterSystemSelect.addEventListener('change', () => renderItems(filterSystemSelect.value, filterTagSelect.value));
filterTagSelect.addEventListener('change', () => renderItems(filterSystemSelect.value, filterTagSelect.value));
window.speechSynthesis.onvoiceschanged = populateVoices;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    populateFilterOptions();
    populateTagOptions();
    renderItems();
    populateVoices();
});
