'use strict';

import { NanoReact, h } from '../../nanoreact.js';
import { NewTab } from './new_tab.js';
import { Tab } from './tab.js';
import { TabPlaceholder } from './tab_placeholder.js';

export class TabList extends NanoReact.Component {
    /**
     * Creates a new TabList instance.
     * @param {object} props - Component props.
     * @param {Map} props.tabs - Map of tab components.
     * @param {Function} props.bookmarkTab - Function to bookmark a tab.
     */
    constructor({ tabs, bookmarkTab }) {
        super();
        this.tabs = tabs;
        this.bookmarkTab = bookmarkTab;
    }

    /**
     * Renders the tab list container.
     * @returns {NanoReact.Element} The tab list element.
     */
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

    /**
     * Handles tab creation events.
     * @param {chrome.tabs.Tab} tab - The newly created tab.
     */
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

    /**
     * Handles drop events for drag and drop operations.
     * @param {DragEvent} e - The drop event.
     */
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

    /**
     * Handles tab update events.
     * @param {number} tabId - The ID of the updated tab.
     * @param {chrome.tabs.TabChangeInfo} changeInfo - The change information.
     * @param {chrome.tabs.Tab} tab - The updated tab.
     */
    onTabUpdated(tabId, changeInfo, tab) {
        console.trace(`onTabUpdated`, tabId, changeInfo, tab);
        this.tabs.get(tabId).onTabUpdated(changeInfo, tab);
    }

    /**
     * Handles tab removal events.
     * @param {number} tabId - The ID of the removed tab.
     */
    onTabRemoved(tabId) {
        console.trace(`onTabRemoved`, tabId);
        this.tabs.get(tabId)?.onTabRemoved();
        this.tabs.delete(tabId);
    }
}
