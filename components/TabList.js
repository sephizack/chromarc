'use strict';

import { Tab } from './Tab.js';

export class TabList {
    constructor() {
        this.tabs = new Map();
        this.activeTabId = null;
    }

    render() {
        this.ref = document.getElementById('tab-list');
        this.draggedTabId = null;
        this.placeholder = null;
        this.ref.innerHTML = '';

        chrome.tabs.query({}, (tabs) => {
            this.tabs.clear();
            // Sort tabs in descending order by id (proxy for creation time)
            tabs.sort((a, b) => b.id - a.id);
            tabs.forEach(tab => {
                this.addTab(tab);
                if (tab.active) {
                    this.setActiveTab(tab.id);
                }
            });
        });
    }

    addTab(tab) {
        // Create Tab component and DOM element
        const tabComponent = new Tab(tab);
        const tabElement = tabComponent.render({
            onDragStart: this.handleDragStart.bind(this),
            onDragOver: this.handleDragOver.bind(this),
            onDrop: this.handleDrop.bind(this),
            onDragEnd: this.handleDragEnd.bind(this)
        });
        // Insert at the top of the list (newest first)
        if (this.ref.firstChild) {
            this.ref.insertBefore(tabElement, this.ref.firstChild);
        } else {
            this.ref.appendChild(tabElement);
        }
        // Insert at the beginning of the Map (preserve order)
        this.tabs = new Map([[tab.id, tabComponent], ...this.tabs]);
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
        this.updateTabOrder();
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

    updateTabOrder() {
        // Update the internal Map order to match the DOM order
        const newOrder = [];
        for (const child of this.ref.children) {
            if (child.classList.contains('tab-item')) {
                const id = parseInt(child.id.replace('tab-', ''), 10);
                newOrder.push([id, this.tabs.get(id)]);
            }
        }
        this.tabs = new Map(newOrder);
    }

    updateTab(tabId, changeInfo, tab) {
        this.tabs.get(tabId).update(changeInfo, tab);
    }

    removeTab(tabId) {
        this.tabs.get(tabId).ref.remove();
        this.tabs.delete(tabId);
    }

    setActiveTab(tabId) {
        if (this.activeTabId !== null) {
            this.tabs.get(this.activeTabId)?.setActive(false);
        }
        this.activeTabId = tabId;
        this.tabs.get(tabId).setActive(true);
    }
}
