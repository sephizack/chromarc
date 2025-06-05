'use strict';

import { Settings } from '../settings.js';

function renderSettings(settings) {
    const container = document.getElementById('settings-container');
    container.innerHTML = '';

    // Tab Expiration Setting
    const units = [
        { label: 'Minutes', unit: 'minute', ms: 60 * 1000 },
        { label: 'Hours', unit: 'hour', ms: 60 * 60 * 1000 },
        { label: 'Days', unit: 'day', ms: 24 * 60 * 60 * 1000 }
    ];

    // Determine current value and unit
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

    // Create elements with crel
    const enableCheckbox = crel('input', {
        type: 'checkbox',
        id: 'enableTabExpiration',
        checked: currentMs > 0
    });
    const enableLabel = crel('label', { for: 'enableTabExpiration' }, 'Enable Tab Expiration');
    const valueInput = crel('input', {
        type: 'number',
        id: 'tabExpirationValue',
        min: 1,
        class: 'tab-expiration-value',
        value: value
    });
    const unitSelect = crel('select', { id: 'tabExpirationUnit', class: 'tab-expiration-unit' },
        ...units.map(u => crel('option', { value: u.unit }, u.label))
    );
    unitSelect.value = selectedUnit;
    const wrapper = crel('div', { class: 'setting-group' },
        enableCheckbox,
        enableLabel,
        valueInput,
        unitSelect
    );
    container.appendChild(wrapper);

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
});
