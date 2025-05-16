import { DEFAULT_TAB_TIMEOUT } from './common.js';

function msToTime(duration) {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)));
    return `${hours}h ${minutes}m ${seconds}s`;
}

function updateTimeoutInput(tabTimeout) {
    const input = document.getElementById('timeoutHoursInput');
    if (input) input.value = Math.round(tabTimeout / (60 * 60 * 1000));
}

function updateTimerText(tabTimeout) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const tab = tabs[0];
        chrome.runtime.sendMessage({type: 'getLastVisited', tabId: tab.id}, function(response) {
            const lastVisited = response && response.lastVisited;
            const now = Date.now();
            let remaining = tabTimeout;
            if (lastVisited) {
                remaining = tabTimeout - (now - lastVisited);
            }
            const timerText = document.getElementById('timerText');
            if (!timerText) return;
            if (remaining > 0) {
                timerText.innerHTML = `Time before this tab is auto-closed:<div class=\"timer\">${msToTime(remaining)}</div>`;
                timerText.classList.remove('danger');
            } else {
                timerText.textContent = 'This tab is eligible to be closed soon!';
                timerText.classList.add('danger');
            }
        });
    });
}

// Run immediately since script is loaded at end of body
let currentTabTimeout = DEFAULT_TAB_TIMEOUT;
function refreshAll() {
    chrome.storage.sync.get({tabTimeout: DEFAULT_TAB_TIMEOUT}, function(items) {
        currentTabTimeout = items.tabTimeout;
        updateTimeoutInput(currentTabTimeout);
        updateTimerText(currentTabTimeout);
    });
}

refreshAll();
setInterval(function() {
    updateTimerText(currentTabTimeout);
}, 7000);

const input = document.getElementById('timeoutHoursInput');
if (input) {
    input.addEventListener('change', function() {
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 168) val = 168;
        const ms = val * 60 * 60 * 1000;
        chrome.storage.sync.set({tabTimeout: ms}, function() {
            currentTabTimeout = ms;
            updateTimeoutInput(ms);
            updateTimerText(ms);
        });
    });
}
