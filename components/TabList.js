'use strict';

import { NewTab } from './NewTab.js';
import { Tab } from './Tab.js';

export class TabList {
    constructor() {
        this.ref = null;
        this.tabs = new Map();
        this.pendingNewTabId = null;
        this.activeTabId = null;
        this.draggedTabId = null;
        this.placeholder = null;
    }

    render() {
        this.tabs.clear();
        this.ref = document.getElementById('tab-list');
        this.ref.innerHTML = '';

        // New Tab Button
        this.newTab = new NewTab();
        this.ref.appendChild(this.newTab.render());
        this.tabs.set('new-tab', this.newTab);

        // Load existing tabs
        chrome.tabs.query({}, (tabs) => {
            // Reverse addition to preserve order (because addTab adds at the top)
            tabs.reverse().forEach(tab => {
                this.addTab(tab);
            });
        });
    }

    isNewTab(tab) {
        return tab.url === 'chrome://newtab/' || tab.pendingUrl === 'chrome://newtab/'
    }


    addTab(tab) {
        console.log('Adding tab:', tab);
        // If this is a new tab, we don't render it and set the New Tab button as active instead
        if (this.isNewTab(tab)) {
            if (tab.active) {
                console.log('Detected new tab:', tab.id);
                if (this.newTab) {
                    this.newTab.setActive(true);
                }
                this.pendingNewTabId = tab.id;
            } else {
                console.log('Detected new tab but not active, ignoring:', tab.id);
            }
            return;
        }
        // Create Tab component and DOM element
        const tabComponent = new Tab(tab);
        const tabElement = tabComponent.render({
            onDragStart: this.handleDragStart.bind(this),
            onDragOver: this.handleDragOver.bind(this),
            onDrop: this.handleDrop.bind(this),
            onDragEnd: this.handleDragEnd.bind(this)
        });
        // Insert at the top of the list (newest first)
        if (this.newTab) {
            this.ref.insertBefore(tabElement, this.newTab.ref.nextSibling);
        } else {
            this.ref.appendChild(tabElement);
        }
        this.tabs.set(tab.id, tabComponent);
        // Set active tab if necessary
        if (tab.active) {
            this.setActiveTab(tab.id);
        }
    }

    handleDragStart(e, tabId) {
        console.log('Drag start event triggered for tab:', tabId);
        this.draggedTabId = tabId;
        e.dataTransfer.effectAllowed = 'move';
        // Create and insert placeholder
        this.placeholder = document.createElement('li');
        this.placeholder.className = 'tab-placeholder';
        this.placeholder.style.height = e.target.offsetHeight + 'px';
        this.placeholder.style.background = 'rgba(255,255,255,0.08)';
        this.placeholder.style.border = '2px dashed #aaa';
        this.placeholder.style.margin = e.target.style.margin;
        this.placeholder.ondragover = (e) => {
            e.preventDefault();
        };
        this.placeholder.ondrop = (e) => {
            e.preventDefault();
            this.handleDrop(e, null);
        };
        this.ref.ondragover = (e) => {
            e.preventDefault();
        }
        this.ref.ondrop = (e) => {
            e.preventDefault();
            this.handleDrop(e, null);
        };
        e.target.parentNode.insertBefore(this.placeholder, e.target.nextSibling);
        // Hide the dragged tab visually
        setTimeout(() => {
            e.target.style.display = 'none';
        }, 0);
    }

    handleDragOver(e, tabId) {
        console.log('Drag over event triggered for tab:', tabId);
        e.preventDefault();
        if (!this.placeholder || tabId === this.draggedTabId) return;
        const overTab = this.tabs.get(tabId)?.ref;
        if (!overTab) return;
        // Move placeholder before or after depending on mouse position
        const rect = overTab.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        if (before) {
            if (overTab.parentNode.children[0] === overTab) {
                overTab.parentNode.insertBefore(this.placeholder, overTab);
            } else {
                overTab.parentNode.insertBefore(this.placeholder, overTab);
            }
        } else {
            overTab.parentNode.insertBefore(this.placeholder, overTab.nextSibling);
        }
    }

    handleDrop(e, tabId) {
        console.log('Drop event triggered for tab:', tabId);
        e.preventDefault();
        if (!this.placeholder) return;
        const draggedTab = this.tabs.get(this.draggedTabId)?.ref;
        if (!draggedTab) return;
        // Always insert draggedTab at the placeholder's position
        this.placeholder.parentNode.insertBefore(draggedTab, this.placeholder);
        draggedTab.style.display = '';
        this.cleanupDrag();
    }

    handleDragEnd(e, tabId) {
        console.log('Drag end event triggered for tab:', tabId);
        if (!this.placeholder) return;
        const draggedTab = this.tabs.get(this.draggedTabId)?.ref;
        if (draggedTab) draggedTab.style.display = '';
        this.cleanupDrag();
    }

    cleanupDrag() {
        if (this.placeholder && this.placeholder.parentNode) {
            this.placeholder.parentNode.removeChild(this.placeholder);
        }
        this.placeholder = null;
        this.draggedTabId = null;
    }

    updateTab(tabId, changeInfo, tab) {
        console.trace(`updateTab`, tabId, changeInfo, tab);
        if (tabId === this.pendingNewTabId) {
            if (this.isNewTab(tab)) {
                // Nothing to do, still pending
                return;
            }
            console.info('Extracting pending new tab:', tab);
            this.pendingNewTabId = null;
            this.addTab(tab);
        } else {
            console.log('Updating tab:', tabId, changeInfo);
            this.tabs.get(tabId).update(changeInfo, tab);
        }
    }

    removeTab(tabId) {
        console.trace(`removeTab(${tabId})`);
        this.tabs.get(tabId).ref.remove();
        this.tabs.delete(tabId);
    }

    setActiveTab(tabId) {
        console.trace(`setActiveTab(${tabId})`);
        if (this.activeTabId !== null) {
            console.log('Deactivating previous active tab:', this.activeTabId);
            this.tabs.get(this.activeTabId)?.setActive(false);
            // If the active tab was the pending new tab, close it
            if (this.activeTabId === 'new-tab' && this.pendingNewTabId) {
                console.log('Deactivated tab was pending new tab, closing it now.');
                chrome.tabs.remove(this.pendingNewTabId, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Failed to close pending new tab:', chrome.runtime.lastError.message);
                    }
                });
            }
        }
        if (tabId === this.pendingNewTabId || !this.tabs.has(tabId)) {
            console.log('Setting active tab: new-tab');
            this.activeTabId = 'new-tab';
            this.newTab.setActive(true);
        } else {
            console.log('Setting active tab:', tabId);
            this.activeTabId = tabId;
            this.tabs.get(tabId).setActive(true);
        }
    }
}
