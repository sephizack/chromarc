'use strict';

import { NanoReact, h } from '../../nanoreact.js';
import { NewTab } from './new_tab.js';
import { Tab } from './tab.js';
import { TabPlaceholder } from './tab_placeholder.js';

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

    async onTabCreated(tab) {
        console.trace(`onTabCreated`, tab);
        // If this is a new tab, we don't render it and set the New Tab button as active instead
        if (NewTab.isNewTab(tab)) {
            this.newTab.cleanPendingAndSet(tab);
            return;
        }
        // Create Tab component and DOM element
        const tabComponent = h(Tab, {
            tab: tab,
            onDrop: this.onDrop.bind(this),
            bookmarkTab: this.bookmarkTab
        });
        const tabElement = await NanoReact.render(tabComponent);

        // We follow Chrome's behavior on the tab opening (just reversing because we have the newest first), so:
        //  - New tab are at the top
        //  - "Child" tabs are on-top of their parent
        this.ref.insertBefore(tabElement, this.ref.children[this.tabs.size - tab.index]);

        this.tabs.set(tab.id, tabComponent);
    }

    async onDrop(e) {
        e.preventDefault();
        const draggedObject = TabPlaceholder.getDraggedObject();
        console.log('Drop event triggered in tab list:', draggedObject);
        switch (draggedObject.type) {
            case 'Tab':
                {
                    TabPlaceholder.insertDraggedObject();
                    // Find the new position of the dragged tab in the list and move it in Chrome
                    // *DO NOT change the order*, otherwise you risk race conditions
                    const tabIndex = Array.from(this.ref.children).indexOf(draggedObject.ref) - 1; // - 1 because the New Tab button
                    chrome.tabs.move(draggedObject.tab.id, { index: tabIndex });
                    break;
                }
            case 'Bookmark':
                chrome.bookmarks.remove(draggedObject.bookmark.id);
                break;
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
