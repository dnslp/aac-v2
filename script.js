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
    let systems = [...new Set(items.map(item => item.system))];

    // Define custom priority order
    const priorityOrder = ["Alphabet", "Number", "LAMP", "Proloquo2Go"];

    // 🔥 Remove "Body-People" from the list
    systems = systems.filter(system => system !== "Body-People");

    // Sort: Priority first, then alphabetical
    systems.sort((a, b) => {
        const aPriority = priorityOrder.includes(a) ? priorityOrder.indexOf(a) : priorityOrder.length;
        const bPriority = priorityOrder.includes(b) ? priorityOrder.indexOf(b) : priorityOrder.length;
        return aPriority !== bPriority ? aPriority - bPriority : a.localeCompare(b);
    });

    // Clear existing options
    filterSystemSelect.innerHTML = '';

    // ✅ Add "All" as the default first option
    const allOption = document.createElement('option');
    allOption.value = "all";
    allOption.textContent = "All";
    allOption.selected = true; // Default selection
    filterSystemSelect.appendChild(allOption);

    // ✅ Add system options (excluding "Body-People")
    systems.forEach(system => {
        const option = document.createElement('option');
        option.value = system;
        option.textContent = system;
        filterSystemSelect.appendChild(option);
    });

    // ✅ Force dropdown to reset to "All"
    setTimeout(() => {
        filterSystemSelect.value = "all";
    }, 100);

    // 🔥 Ensure dropdown initializes correctly
    if (typeof MultiselectDropdown === "function") {
        MultiselectDropdown(filterSystemSelect);
    }
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
function customSortOrder(a, b) {
    const priorityOrder = ["Alphabet", "Number", "LAMP", "Proloquo2Go"];

    // Get the priority of each system
    const aPriority = priorityOrder.includes(a.system) ? priorityOrder.indexOf(a.system) : priorityOrder.length;
    const bPriority = priorityOrder.includes(b.system) ? priorityOrder.indexOf(b.system) : priorityOrder.length;

    // Sort by priority first
    if (aPriority !== bPriority) {
        return aPriority - bPriority;
    }

    // If same priority, sort alphabetically by system name
    return a.system.localeCompare(b.system);
}

// 🔥 Ensure items are sorted before rendering
function renderItems() {
    symbolContainer.innerHTML = ''; // Clear the container before rendering

    let selectedSystems = Array.from(filterSystemSelect.selectedOptions).map(opt => opt.value);

    // 🔥 If "All" is selected or nothing is selected, show everything except "Body-People"
    if (selectedSystems.includes("all") || selectedSystems.length === 0) {
        selectedSystems = [...new Set(items.map(item => item.system))].filter(system => system !== "Body-People");
    }

    // 🔥 Ensure "Body-People" is fully removed from displayed items
    let filteredItems = currentItems
        .filter(item => selectedSystems.includes(item.system))
        .filter(item => item.system !== "Body-People"); // Double-check filtering

    // 🔥 If no items match, restore everything except "Body-People"
    if (filteredItems.length === 0) {
        filteredItems = items.filter(item => item.system !== "Body-People");
    }

    // Group and render items
    const groupedItems = filteredItems.reduce((groups, item) => {
        if (!groups[item.system]) {
            groups[item.system] = [];
        }
        groups[item.system].push(item);
        return groups;
    }, {});

    Object.entries(groupedItems).forEach(([system, itemsInSystem]) => {
        const section = document.createElement('div');
        section.classList.add('category');

        // Create a header for each system
        const header = document.createElement('h2');
        header.textContent = system;
        section.appendChild(header);

        // Create a container for the system's items
        const symbolSection = document.createElement('div');
        symbolSection.classList.add('symbol-section');

        // Add sorted items in the system
        itemsInSystem.forEach(item => createSymbolItem(item, symbolSection));

        section.appendChild(symbolSection);
        symbolContainer.appendChild(section);
    });
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
        content.style.width = '70%';
        content.style.height = '70%';
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
    isGlossaryView = false;  // Reset glossary view mode
    currentItems = [...originalOrder].filter(item => item.system !== "Body-People");  // Restore original order without "Body-People"

    // 🔥 Reset dropdown selections: Select "All" and deselect others
    filterSystemSelect.querySelectorAll("option").forEach(option => {
        option.selected = option.value === "all";
    });

    // 🔥 Ensure dropdown refreshes correctly
    handleSystemSelection();

    // 🔥 Re-render items
    setTimeout(() => {
        renderItems(); // Ensure "Body-People" remains hidden after reset
    }, 100);
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