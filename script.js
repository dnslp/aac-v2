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
let currentSize = 140;
const minSize = 100;
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
    symbolContainer.innerHTML = '';  // Clear the container before rendering

    let selectedSystems = Array.from(filterSystemSelect.selectedOptions).map(opt => opt.value);

    // 🔥 If "All" is selected OR nothing is selected, show everything except "Body-People"
    if (selectedSystems.includes("all") || selectedSystems.length === 0) {
        selectedSystems = [...new Set(items.map(item => item.system))].filter(system => system !== "Body-People");
    }

    let filteredItems = currentItems.filter(item => selectedSystems.includes(item.system));

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
        content.classList.add('alphabet');
        content.textContent = item.symbol;
        content.style.fontSize = '1.5vw'
    } else if (item.type === 'image') {
        content = document.createElement('img');
        content.src = item.symbol;
        content.alt = item.label;
        content.style.width = '70%';  // ✅ Adjusts dynamically
        content.style.height = '70%';
    } else if (item.type === 'svg') {
        content = document.createElement('div');
        content.innerHTML = item.symbol;
        content.style.width = '100%';  // ✅ Adjusts dynamically
        content.style.height = '70%';
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
    currentItems = [...originalOrder].filter(item => item.system !== "Body-People");  // Restore without "Body-People"

    // 🔥 Reset dropdown selections: Select "All" and deselect others
    filterSystemSelect.querySelectorAll("option").forEach(option => {
        option.selected = option.value === "all";
    });

    // 🔥 Force the dropdown to visually reset
    setTimeout(() => {
        filterSystemSelect.value = "all";
        renderItems(); // ✅ Ensure items reload after reset
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
// Function to change background color

function changeBackgroundColor() {
    const selectedColor = document.getElementById('backgroundColorPicker').value;

    if (selectedColor === "rainbow") {
        document.body.style.background = "linear-gradient(180deg, rgba(255, 0, 0, 1) 0%, rgba(255, 154, 0, 1) 10%, rgba(208, 222, 33, 1) 20%, rgba(79, 220, 74, 1) 30%, rgba(63, 218, 216, 1) 40%, rgba(47, 201, 226, 1) 50%, rgba(28, 127, 238, 1) 60%, rgba(95, 21, 242, 1) 70%, rgba(186, 12, 248, 1) 80%, rgba(251, 7, 217, 1) 90%, rgba(255, 0, 0, 1) 100%)";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
        
        // Save "rainbow" as a string, so we know to reapply gradient on reload
        localStorage.setItem("backgroundColor", "rainbow");
    } else {
        document.body.style.background = selectedColor;
        localStorage.setItem("backgroundColor", selectedColor);
    }
}


// Attach event listener
document.getElementById('backgroundColorPicker').addEventListener('change', changeBackgroundColor);

// 🔥 Apply saved background color on page load
document.addEventListener("DOMContentLoaded", function () {
    const dyslexiaButton = document.getElementById("toggleDyslexiaMode");
    const increaseSizeButton = document.getElementById("increaseSize");
    const decreaseSizeButton = document.getElementById("decreaseSize");
    const body = document.body;

    let currentSize = 140; // Default icon size
    const minSize = 50;
    const maxSize = 300;
    const savedColor = localStorage.getItem("backgroundColor");

    if (savedColor) {
        document.getElementById("backgroundColorPicker").value = savedColor;

        if (savedColor === "rainbow") {
            document.body.style.background = "linear-gradient(180deg, rgba(255, 0, 0, 1) 0%, rgba(255, 154, 0, 1) 10%, rgba(208, 222, 33, 1) 20%, rgba(79, 220, 74, 1) 30%, rgba(63, 218, 216, 1) 40%, rgba(47, 201, 226, 1) 50%, rgba(28, 127, 238, 1) 60%, rgba(95, 21, 242, 1) 70%, rgba(186, 12, 248, 1) 80%, rgba(251, 7, 217, 1) 90%, rgba(255, 0, 0, 1) 100%)";
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundAttachment = "fixed";
        } else {
            document.body.style.background = savedColor;
        }
    }

    
    // Function to update sizes based on mode
    function updateSizes() {
        if (body.classList.contains("opendyslexic-font")) {
            document.documentElement.style.setProperty("--symbol-size", `${currentSize + 50}px`); // Larger size for Dyslexia Mode
            document.body.style.fontSize = "18px";
        } else {
            document.documentElement.style.setProperty("--symbol-size", `${currentSize}px`); // Normal size
            document.body.style.fontSize = "16px";
        }
    }

    // Function to enable Dyslexia Mode
    function enableDyslexiaMode() {
        body.classList.add("opendyslexic-font");
        currentSize += 50; // Adjust icon size for better readability
        updateSizes();
        localStorage.setItem("dyslexiaMode", "enabled");
    }

    // Function to disable Dyslexia Mode
    function disableDyslexiaMode() {
        body.classList.remove("opendyslexic-font");
        currentSize -= 50; // Reset icon size
        updateSizes();
        localStorage.setItem("dyslexiaMode", "disabled");
    }

    // Check stored preference on page load
    if (localStorage.getItem("dyslexiaMode") === "enabled") {
        enableDyslexiaMode();
    }

    // Toggle Dyslexia Mode on button click
    dyslexiaButton.addEventListener("click", function () {
        if (body.classList.contains("opendyslexic-font")) {
            disableDyslexiaMode();
        } else {
            enableDyslexiaMode();
        }
    });

    // Adjust Font & Icon Size Dynamically
    function adjustSize(amount) {
        currentSize = Math.max(minSize, Math.min(maxSize, currentSize + amount));
        updateSizes();
    }

    // Attach event listeners to font size buttons
    increaseSizeButton.addEventListener("click", function () {
        adjustSize(10);
    });

    decreaseSizeButton.addEventListener("click", function () {
        adjustSize(-10);
    });
});





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

