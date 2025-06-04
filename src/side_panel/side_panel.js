'use strict';

import { SidePanel } from '../components/SidePanel.js';

// Initialize SidePanel on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const sidePanel = new SidePanel();
    sidePanel.render();

    const clearTabs = document.getElementById('clear-tabs');
    if (clearTabs) {
        // Hide by default
        clearTabs.style.display = 'none';
        clearTabs.style.pointerEvents = 'none';

        // Show on mouse enter, hide on mouse leave
        const sidePanelDiv = document.getElementById('side_panel');
        if (sidePanelDiv) {
            sidePanelDiv.addEventListener('mouseenter', () => {
                clearTabs.style.display = 'block';
                clearTabs.style.pointerEvents = 'auto';
            });
            sidePanelDiv.addEventListener('mouseleave', () => {
                clearTabs.style.display = 'none';
                clearTabs.style.pointerEvents = 'none';
            });
        }

        clearTabs.addEventListener('click', () => {
            chrome.tabs.query({ currentWindow: true }, (tabs) => {
                const tabIds = tabs.map(tab => tab.id);
                if (tabIds.length > 0) {
                    chrome.tabs.remove(tabIds, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Error closing tabs:', chrome.runtime.lastError.message);
                        }
                    });
                }
            });
        });
    }
});
