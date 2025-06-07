'use strict';

import { TabList } from './components/TabList.js';
import { BookmarkList } from './components/BookmarkList.js';
import { NanoReact, h } from "../../nanoreact.js";

document.addEventListener('DOMContentLoaded', () => {
    document.getElementsByTagName("body")[0].appendChild(NanoReact.render(h(SidePanel)));
});

function ClearTabsButton() {
    return h('span', { id: 'clear-tabs', title: 'Close all open tabs' }, ['Clear']);
}

export class SidePanel extends NanoReact.Component {
    constructor() {
        super();
        this.tabs = new Map();
        this.activeTabId = null;
        this.menuItems = {};
    }

    render() {
        // Get active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                this.activeTabId = tabs[0].id;
            } else {
                console.error('No active tab found in the current window');
            }
        });

        // Tabs incremental updates
        chrome.tabs.onCreated.addListener(this.onTabCreated.bind(this));
        chrome.tabs.onRemoved.addListener(this.onTabRemoved.bind(this));
        chrome.tabs.onUpdated.addListener(this.onTabUpdated.bind(this));

        // Track active tab
        chrome.tabs.onActivated.addListener(this.onTabActivated.bind(this));

        // Context menu handling
        document.addEventListener('contextmenu', this.onContextMenu.bind(this));
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            console.trace('contextMenus.onClicked', info, tab);
            if (this.menuItems[info.menuItemId]) {
                this.menuItems[info.menuItemId].onclick();
            } else {
                console.warn('No callback found for menu item:', info.menuItemId);
            }
        });

        return h('div', { id: 'side_panel' }, [
            this.bookmarkList = h(BookmarkList, { tabs: this.tabs }),
            h('div', { class: 'section-divider-container' }, [
                h('hr', { class: 'section-divider' }, []),
                h(ClearTabsButton),
            ]),
            this.tabList = h(TabList, { tabs: this.tabs }),
        ]);
    }

    setActiveTab(tabId) {
        console.trace(`setActiveTab`, tabId);
        if (!this.tabs.has(tabId)) {
            console.warn('Tab not found in tabs:', tabId);
            return;
        }
        if (tabId === this.activeTabId) {
            console.log('Already the active tab, ignoring');
            return;
        }
        if (this.activeTabId !== null) {
            console.log('Deactivating previous active tab:', this.activeTabId);
            this.tabs.get(this.activeTabId)?.setActive(false);
        }
        console.log('Setting active tab:', tabId);
        this.activeTabId = tabId;
        this.tabs.get(tabId).setActive(true);
    }

    onTabCreated(tab) {
        console.trace(`onTabCreated`, tab);
        if (this.bookmarkList.isTabBookmarked(tab)) {
            console.info('Tab is bookmarked, adding to bookmarks:', tab);
            this.bookmarkList.addBookmarkedTab(tab);
        } else {
            this.tabList.addTab(tab);
        }
        // If the tab is active and was added (in case of sequential new tab we only had 1),
        // set it as the active tab
        if (tab.active && this.tabs.has(tab.id)) {
            this.setActiveTab(tab.id);
        }
    }

    onTabRemoved(tabId) {
        this.tabList.removeTab(tabId);
    }

    onTabUpdated(tabId, changeInfo, tab) {
        this.tabList.updateTab(tabId, changeInfo, tab);
    }

    onTabActivated(activeInfo) {
        this.setActiveTab(activeInfo.tabId);
    }

    onContextMenu(e) {
        console.log('Creating context menu');
        this.menuItems = {};
        chrome.contextMenus.removeAll(() => {
            if (chrome.runtime.lastError) {
                console.error('Error removing context menu:', chrome.runtime.lastError.message);
            }
        });
        let elements = document.elementsFromPoint(e.clientX, e.clientY);
        console.debug('Elements at clicked point:', elements);
        let menuItems = [];
        for (const el of elements) {
            if (el.classList.contains('tab-item') || el.classList.contains('bookmark-item')) {
                let [type, id] = el.id.split('-');
                if (!type || !id) {
                    console.warn('Invalid item ID:', el.id);
                    return;
                }
                if (type === 'tab') {
                    menuItems.push(...this.tabs.get(parseInt(id, 10)).getContextMenuItems());
                } else if (type === 'bookmark') {
                    menuItems.push(...this.bookmarkList.bookmarks.get(id).getContextMenuItems());
                }
            }
        }
        for (const item of menuItems) {
            if (this.menuItems[item.id]) {
                console.warn('Duplicate menu item ID:', item.id);
            }
            this.menuItems[item.id] = item;
            chrome.contextMenus.create({
                id: item.id,
                title: item.title,
                contexts: ['all'],
                documentUrlPatterns: [chrome.runtime.getURL('side_panel/side_panel.html')],
            });
        }
    }
}
