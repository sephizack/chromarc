
'use strict';

import { NanoReact, h } from '../../nanoreact.js';

export class NewTab extends NanoReact.Component {
    constructor({ tabList }) {
        super();
        this.tabList = tabList;
        this.pendingNewTabId = null;
    }

    static isNewTab(tab) {
        return tab.url === 'chrome://newtab/' || tab.pendingUrl === 'chrome://newtab/';
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
                    chrome.tabs.create({}, (tab) => {
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

    setPendingNewTab(tab) {
        if (tab.active) {
            console.log('Detected new tab:', tab.id);
            this.setActive(true);
            if (this.pendingNewTabId) {
                // We already have a pending new tab, switch to it
                console.info('We already have a pending new tab, switch to it:', this.pendingNewTabId);
                chrome.tabs.update(this.pendingNewTabId, { active: true });
                this._closeTab(tab.id);
            } else {
                // Set this tab as the pending new tab
                this.pendingNewTabId = tab.id;
                this.tabList.tabs.set(tab.id, this);
            }
        } else {
            console.log('Detected new tab but not active, ignoring:', tab.id);
        }
    }

    updateTab(changeInfo, tab) {
        // console.warn('NewTab does not support updates');
        if (tab.id === this.pendingNewTabId) {
            if (NewTab.isNewTab(tab)) {
                // Nothing to do, still pending
                return;
            }
            console.info('Extracting pending new tab:', tab);
            this.pendingNewTabId = null;
            this.tabList.addTab(tab);
            this.setActive(false);
        }
    }

    removeTab() {
        // Nothing to do, we don't remove the New Tab component
    }

    setActive(isActive) {
        if (isActive) {
            this.ref.classList.add('active');
        } else {
            this.ref.classList.remove('active');
            // If there was a pending new tab, close it
            if (this.pendingNewTabId) {
                console.log('Deactivated tab was pending new tab, closing it now.');
                this._closeTab(this.pendingNewTabId);
                this.pendingNewTabId = null;
            }
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
