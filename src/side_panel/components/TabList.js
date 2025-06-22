'use strict';

import { NanoReact, h } from '../../nanoreact.js';
import { NewTab } from './NewTab.js';
import { Tab } from './Tab.js';
import { TabPlaceholder } from './TabPlaceholder.js';

export class TabList extends NanoReact.Component {
    constructor({ tabs, bookmarkTab }) {
        super();
        this.tabs = tabs;
        this.bookmarkTab = bookmarkTab;
    }

    render() {
        // New Tab Button
        this.newTab = h(NewTab, { tabs: this.tabs, onTabCreated: this.onTabCreated.bind(this) });
        this.tabs.set('new-tab', this.newTab);

        return h('ul', {
            id: 'tab-list',
        }, [
            this.newTab
        ]);
    }

    onTabCreated(tab) {
        console.trace(`onTabCreated`, tab);
        // If this is a new tab, we don't render it and set the New Tab button as active instead
        if (NewTab.isNewTab(tab)) {
            this.newTab.cleanPendingNewTabs(tab);
            return;
        }
        // Create Tab component and DOM element
        const tabComponent = h(Tab, {
            tab: tab,
            onDrop: this.onDrop.bind(this),
            bookmarkTab: this.bookmarkTab
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

    async onDrop(e) {
        e.preventDefault();
        const draggedObject = TabPlaceholder.getDraggedObject();
        console.log('Drop event triggered in tab list:', draggedObject);
        switch (draggedObject.type) {
            case 'Tab':
                TabPlaceholder.insertDraggedObject();
                // Find the new position of the dragged tab in the list and move it in Chrome
                // *DO NOT change the order*, otherwise you risk race conditions
                const tabIndex = Array.from(this.ref.children).indexOf(draggedObject.ref) - 1; // - 1 because the New Tab button
                chrome.tabs.move(draggedObject.tab.id, { index: tabIndex });
                break;
            case 'Bookmark':
                chrome.bookmarks.remove(draggedObject.bookmark.id)
            default:
                console.error('Unknown drop type:', draggedObject);
                break;
        }
    }

    onTabUpdated(tabId, changeInfo, tab) {
        console.trace(`onTabUpdated`, tabId, changeInfo, tab);
        this.tabs.get(tabId).onTabUpdated(changeInfo, tab);
    }

    onTabRemoved(tabId) {
        console.trace(`onTabRemoved`, tabId);
        this.tabs.get(tabId)?.onTabRemoved();
        this.tabs.delete(tabId);
    }
}
