import { DEFAULT_TAB_TIMEOUT } from './common.js';

// Listen for messages from popup.js to provide last visited time for a tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'getLastVisited' && message.tabId !== undefined) {
        sendResponse({ lastVisited: tabLastVisited[message.tabId] });
        return true; // Keep the message channel open for async response
    }
});
// Open the side panel when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
    if (chrome.sidePanel) {
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});

// Open the side panel automatically at browser startup for all windows
chrome.windows.getAll({}, (windows) => {
    if (chrome.sidePanel) {
        windows.forEach(win => {
            chrome.sidePanel.open({ windowId: win.id });
        });
    }
});

chrome.runtime.onStartup.addListener(() => {
    chrome.windows.getAll({}, (windows) => {
        if (chrome.sidePanel) {
            windows.forEach(win => {
                chrome.sidePanel.open({ windowId: win.id });
            });
        }
    });
});

// Open the side panel automatically when the extension is installed or reloaded
chrome.runtime.onInstalled.addListener(() => {
    chrome.windows.getAll({}, (windows) => {
        if (chrome.sidePanel) {
            windows.forEach(win => {
                chrome.sidePanel.open({ windowId: win.id });
            });
        }
    });
});

// background.js
// Tracks tab activity and closes tabs not visited in the last 6 hours


const CHECK_INTERVAL_MINUTES = 5;

// Store last visit time for each tabId
let tabLastVisited = {};


// Update last visited time when a tab is activated and when leaving a tab
let lastActiveTabId = null;
chrome.tabs.onActivated.addListener(activeInfo => {
    const now = Date.now();
    // Mark the previous tab as 'left'
    if (lastActiveTabId !== null && lastActiveTabId !== activeInfo.tabId) {
        tabLastVisited[lastActiveTabId] = now;
    }
    // Mark the new tab as 'visited'
    tabLastVisited[activeInfo.tabId] = now;
    lastActiveTabId = activeInfo.tabId;
});

// Update last visited time when a tab is updated (e.g., reloaded)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        tabLastVisited[tabId] = Date.now();
    }
});

// Remove closed tabs from tracking
chrome.tabs.onRemoved.addListener(tabId => {
    delete tabLastVisited[tabId];
});


// Periodically check and close old tabs
function closeOldTabs() {
    chrome.storage.sync.get({tabTimeout: DEFAULT_TAB_TIMEOUT}, function(items) {
        const timeoutMs = items.tabTimeout;
        chrome.tabs.query({}, tabs => {
            const now = Date.now();
            tabs.forEach(tab => {
                // Don't close pinned tabs or the active tab in any window
                if (tab.pinned || tab.active) return;
                const lastVisited = tabLastVisited[tab.id] || now;
                if (now - lastVisited > timeoutMs) {
                    chrome.tabs.remove(tab.id);
                }
            });
        });
    });
}

// Set up periodic check
chrome.alarms.create('closeOldTabs', { periodInMinutes: CHECK_INTERVAL_MINUTES });
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'closeOldTabs') {
        closeOldTabs();
    }
});

// Initialize last visited times for all tabs on startup
chrome.runtime.onStartup.addListener(() => {
    chrome.tabs.query({}, tabs => {
        const now = Date.now();
        tabs.forEach(tab => {
            tabLastVisited[tab.id] = now;
        });
    });
});

// Also initialize when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({}, tabs => {
        const now = Date.now();
        tabs.forEach(tab => {
            tabLastVisited[tab.id] = now;
        });
    });
});
