'use strict';

import { Settings } from '../settings.js';
import { ArcSidebarImporter } from './ArcSidebarImporter.js';

function renderSettings(settings) {

    // Use existing DOM elements from HTML
    const units = [
        { unit: 'minute', ms: 60 * 1000 },
        { unit: 'hour', ms: 60 * 60 * 1000 },
        { unit: 'day', ms: 24 * 60 * 60 * 1000 }
    ];

    let currentMs = settings.tabExpirationMs;
    let selectedUnit = 'hour';
    let value = 1;
    if (currentMs > 0) {
        for (const u of units.slice().reverse()) {
            if (currentMs % u.ms === 0) {
                selectedUnit = u.unit;
                value = currentMs / u.ms;
                break;
            }
        }
    }

    console.debug('Current tab expiration settings:', {
        currentMs,
        selectedUnit,
        value
    });

    const enableCheckbox = document.getElementById('enableTabExpiration');
    const valueInput = document.getElementById('tabExpirationValue');
    const unitSelect = document.getElementById('tabExpirationUnit');

    // Set initial values
    enableCheckbox.checked = currentMs > 0;
    valueInput.value = value;
    unitSelect.value = selectedUnit;

    // Enable/disable inputs based on checkbox
    function updateInputsState() {
        const enabled = enableCheckbox.checked;
        valueInput.disabled = !enabled;
        unitSelect.disabled = !enabled;
    }
    updateInputsState();

    // Save logic
    async function saveTabExpiration() {
        if (!enableCheckbox.checked) {
            settings.tabExpirationMs = 0;
        } else {
            const num = parseInt(valueInput.value, 10);
            const unit = units.find(u => u.unit === unitSelect.value);
            if (isNaN(num) || num < 1 || !unit) {
                alert('Please enter a valid number and unit.');
                return;
            }
            settings.tabExpirationMs = num * unit.ms;
        }
        await saveSettings(settings);
    }

    enableCheckbox.addEventListener('change', () => {
        updateInputsState();
        saveTabExpiration();
    });
    valueInput.addEventListener('change', saveTabExpiration);
    unitSelect.addEventListener('change', saveTabExpiration);

    // Enable/disable inputs based on checkbox
    function updateInputsState() {
        const enabled = enableCheckbox.checked;
        valueInput.disabled = !enabled;
        unitSelect.disabled = !enabled;
    }
    updateInputsState();

    // Save logic
    async function saveTabExpiration() {
        if (!enableCheckbox.checked) {
            settings.tabExpirationMs = 0;
        } else {
            const num = parseInt(valueInput.value, 10);
            const unit = units.find(u => u.unit === unitSelect.value);
            if (isNaN(num) || num < 1 || !unit) {
                alert('Please enter a valid number and unit.');
                return;
            }
            settings.tabExpirationMs = num * unit.ms;
        }
        await saveSettings(settings);
    }

    enableCheckbox.addEventListener('change', () => {
        updateInputsState();
        saveTabExpiration();
    });
    valueInput.addEventListener('change', saveTabExpiration);
    unitSelect.addEventListener('change', saveTabExpiration);
}

// Save settings to storage
async function saveSettings(settings) {
    try {
        await settings.saveToStorage();
        console.info('Settings saved successfully:', settings);
    } catch (err) {
        console.error('Failed to save settings:', err);
    }
}

// Load settings and render on page load
window.addEventListener('DOMContentLoaded', async () => {
    let settings = await Settings.loadFromStorage();
    console.info('Loaded settings:', settings);
    renderSettings(settings);

    // ArcSidebarImporter file upload logic
    let importer = null;
    const importBtn = document.getElementById('importArcSidebarBtn');
    const fileInput = document.getElementById('arcSidebarImportFile');
    const selectInput = document.getElementById('arcSidebarSpace');
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        // Clear previous options
        selectInput.innerHTML = '';
        selectInput.disabled = true;
        if (file) {
            importer = await ArcSidebarImporter.fromFile(file);
            for (const space of importer.getSpaces()) {
                const option = document.createElement('option');
                option.value = space.id;
                option.textContent = space.title;
                selectInput.appendChild(option);
            }
            selectInput.disabled = false;
        }
    });
    importBtn.addEventListener('click', async () => {
        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Please select a file to import.');
            return;
        }
        const file = fileInput.files[0];
        let folderIdMap = new Map();
        try {
            await importer.visitSpace(
                selectInput.value,
                async (folder, parent) => {
                    if (parent === null) {
                        folderIdMap.set(folder.id, '1'); // Set the root folder to Bookmarks Bar
                        return;
                    }
                    let res = await chrome.bookmarks.create({
                        parentId: folderIdMap.get(parent.id),
                        title: folder.title
                    });
                    if (chrome.runtime.lastError) {
                        console.error('Failed to create folder:', chrome.runtime.lastError);
                        return;
                    }
                    folderIdMap.set(folder.id, res.id);
                },
                async (tab, parent) => {
                    let res = await chrome.bookmarks.create({
                        parentId: folderIdMap.get(parent.id),
                        title: tab.title || tab.data?.tab?.savedTitle || tab.data?.tab?.savedURL,
                        url: tab.data?.tab?.savedURL,
                    });
                    if (chrome.runtime.lastError) {
                        console.error('Failed to create bookmark:', chrome.runtime.lastError);
                        return;
                    }
                }
            );
            alert('File imported successfully.');
        } catch (err) {
            console.error('Failed to import file:', err);
            alert('Failed to import file: ' + err.message);
        }
    });
});
