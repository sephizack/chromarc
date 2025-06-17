'use strict';

import { NanoReact, h } from '../../nanoreact.js';
import { NewTab } from './NewTab.js';
import { Tab } from './Tab.js';

export class TabList extends NanoReact.Component {
    constructor({tabs, onTabBookmarked}) {
        super();
        this.tabs = tabs;
        this.onTabBookmarked = onTabBookmarked;
        this.draggedTabId = null;
        this.placeholder = null;
    }

    render() {
        // New Tab Button
        this.newTab = h(NewTab, { tabs: this.tabs, onTabCreated: this.onTabCreated.bind(this) });
        this.tabs.set('new-tab', this.newTab);

        return h('ul', { id: 'tab-list' }, [
            this.newTab
        ]);
    }

    componentDidMount() {
        // Load existing tabs
        chrome.tabs.query({}, (tabs) => {
            // Reverse addition to preserve order (because onTabCreated adds at the top)
            tabs.reverse().forEach(tab => {
                this.onTabCreated(tab);
            });
        });
    }

    onTabCreated(tab) {
        console.trace(`onTabCreated`, tab);
        // If this is a new tab, we don't render it and set the New Tab button as active instead
        if (NewTab.isNewTab(tab)) {
            this.newTab.cleanPendingNewTabs(tab);
            return;
        }
        // Create Tab component and DOM element
        // const tabComponent = new Tab(tab);
        const tabComponent = h(Tab, {
            tab: tab,
            onDragStart: this.handleDragStart.bind(this),
            onDragOver: this.handleDragOver.bind(this),
            onDrop: this.handleDrop.bind(this),
            onDragEnd: this.handleDragEnd.bind(this),
            onTabBookmarked: this.onTabBookmarked
        });
        const tabElement = NanoReact.render(tabComponent);
        if (this.newTab) {
            // Insert at the top of the list (newest first)
            this.ref.insertBefore(tabElement, this.newTab.ref.nextSibling);
        } else {
            this.ref.appendChild(tabElement);
        }
        this.tabs.set(tab.id, tabComponent);
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
        this.tabs.get(tabId).updateTab(changeInfo, tab);
    }

    removeTab(tabId) {
        console.trace(`removeTab`, tabId);
        this.tabs.get(tabId)?.removeTab();
        this.tabs.delete(tabId);
    }
}
