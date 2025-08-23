
'use strict';

import { NanoReact, h } from '../../nanoreact.js';

export class NewTab extends NanoReact.Component {
    constructor({ tabs, onTabCreated }) {
        super();
        this.tabs = tabs;
        this.onTabCreated = onTabCreated;
    }

    static isNewTab(tab) {
        return tab.url === 'chrome://newtab/' || tab.pendingUrl === 'chrome://newtab/';
    }

    static isNewTabLoading(tab) {
        return tab.status === 'loading' && tab.pendingUrl && tab.pendingUrl != 'chrome://newtab/';
    }

    render() {
        return h(
            'li',
            {
                class: 'tab-item',
                id: 'new-tab',
                tabIndex: 0, // Make accessible
                'aria-label': 'Open a new tab',
                onClick: (e) => {
                    console.log('New tab clicked');
                    e.preventDefault();
                    chrome.tabs.create({}, (_tab) => {
                        if (chrome.runtime.lastError) {
                            console.error('Failed to create new tab:', chrome.runtime.lastError.message);
                        }
                    });
                }
            },
            [
                h('span', {
                    class: 'tab-favicon',
                }, '+'),
                h('span', {
                    class: 'tab-title',
                }, 'New Tab'),
                h('span', { class: 'tab-shortcut' },
                    h('kbd', {}, navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'),
                    h('kbd', {}, 'T')
                )
            ]
        );
    }

    async cleanPendingAndSet(curNewTab) {
        this.setActive(true);
        this.tabs.set(curNewTab.id, this);
        chrome.tabs.query({}, tabs => {
            tabs.map(async t => {
                if (t.id === curNewTab.id || !NewTab.isNewTab(t)) {
                    return; // Skip the current new tab or non-new tabs
                }
                try {
                    let tabDetails = await chrome.tabs.get(t.id);
                    if (NewTab.isNewTabLoading(tabDetails)) {
                        return; // We don't close tabs that are still loading
                    }
                } catch (error) {
                    // If we can't get the pending tab, we close by default
                    console.error('Failed to get pending new tab:', error);
                }
                this._closeTab(t.id);
            });
        });
    }

    onTabUpdated(changeInfo, tab) {
        if (NewTab.isNewTab(tab) && tab.active) {
            this.setActive(true);
        } else {
            this.setActive(false);
            this.onTabCreated(tab);
        }
    }

    onTabRemoved() {
        this.setActive(false);
    }

    setActive(isActive) {
        if (isActive) {
            this.ref.classList.add('active');
        } else {
            this.ref.classList.remove('active');
        }
    }

    _closeTab(id) {
        console.trace(`_closeTab(${id})`);
        chrome.tabs.remove(id, () => {
            console.trace(`chrome.tabs.remove(${id})`);
            if (chrome.runtime.lastError) {
                // See https://issues.chromium.org/issues/40769041
                if (chrome.runtime.lastError.message === "Tabs cannot be edited right now (user may be dragging a tab).") {
                    console.warn('Pending new tab is being dragged, will close it after a short delay.');
                    setTimeout(() => {
                        this._closeTab(id);
                    }, 100);
                } else {
                    console.error('Failed to close pending new tab:', chrome.runtime.lastError.message);
                }
            }
        });
    }
}
