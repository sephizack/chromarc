
'use strict';

export class NewTab {
    constructor(tabList) {
        this.tabList = tabList;
        this.pendingNewTabId = null;
    }

    static isNewTab(tab) {
        return tab.url === 'chrome://newtab/' || tab.pendingUrl === 'chrome://newtab/';
    }

    render() {
        let shortcutLabel = crel('span', { class: 'tab-shortcut' },
            crel('kbd', {}, navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'),
            crel('kbd', {}, 'T')
        );
        this.ref = crel(
            'li',
            {
                class: 'tab-item',
                id: 'new-tab',
                tabIndex: 0, // Make accessible
                'aria-label': 'Open a new tab',
            },
            crel('span', {
                class: 'tab-favicon',
            }, '+'),
            crel('span', {
                class: 'tab-title',
            }, 'New Tab'),
            shortcutLabel
        );
        // Add click event to open a new tab
        this.ref.addEventListener('click', (e) => {
            console.log('New tab clicked');
            e.preventDefault();
            chrome.tabs.create({}, (tab) => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to create new tab:', chrome.runtime.lastError.message);
                }
            });
        });
        return this.ref;
    }

    setPendingNewTab(tab) {
        if (tab.active) {
            console.log('Detected new tab:', tab.id);
            this.setActive(true);
            this.pendingNewTabId = tab.id;
            this.tabList.tabs.set(tab.id, this);
        } else {
            console.log('Detected new tab but not active, ignoring:', tab.id);
        }
    }

    update(changeInfo, tab) {
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

    setActive(isActive) {
        if (isActive) {
            this.ref.classList.add('active');
        } else {
            this.ref.classList.remove('active');
            // If there was a pending new tab, close it
            if (this.pendingNewTabId) {
                console.log('Deactivated tab was pending new tab, closing it now.');
                chrome.tabs.remove(this.pendingNewTabId, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Failed to close pending new tab:', chrome.runtime.lastError.message);
                    }
                });
            }
        }
    }
}
