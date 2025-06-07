'use strict';

import { TabList } from './TabList.js';
import { BookmarkList } from './BookmarkList.js';

export class SidePanel {
    constructor() {
        this.tabs = new Map();
        this.activeTabId = null;

        this.tabList = new TabList(this.tabs);
        this.bookmarkList = new BookmarkList(document.getElementById('bookmark-list'));
        this.menuItems = {}
    }

    render() {
        this.tabs.clear();

        this.tabList.render();
        this.bookmarkList.render();

        // Get active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                this.setActiveTab(tabs[0].id);
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

        // Bookmarks incremental updates
        chrome.bookmarks.onCreated.addListener(this.onBookmarkCreated.bind(this));
        chrome.bookmarks.onRemoved.addListener(this.onBookmarkRemoved.bind(this));
        chrome.bookmarks.onChanged.addListener(this.onBookmarkChanged.bind(this));
        chrome.bookmarks.onMoved.addListener(this.onBookmarkMoved.bind(this));

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
        const tabUrl = tab.pendingUrl || tab.url;
        if (this.bookmarkList.urlIndex.has(tabUrl)) {
            console.info('Tab with URL already exists in bookmarks:', tabUrl);
            const bookmarkComponent = this.bookmarkList.urlIndex.get(tabUrl);
            bookmarkComponent.setTab(tab);
            this.tabs.set(tab.id, bookmarkComponent);
            bookmarkComponent.setActive(true);
        } else {
            this.tabList.addTab(tab);
            // If the tab is active and was added (in case of sequential new tab we only had 1),
            // set it as the active tab
            if (tab.active && this.tabs.has(tab.id)) {
                this.setActiveTab(tab.id);
            }
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

    onBookmarkCreated(id, bookmark) {
        this.bookmarkList.addBookmark(bookmark);
    }

    onBookmarkRemoved(id, removeInfo) {
        this.bookmarkList.removeBookmark(id);
    }

    onBookmarkChanged(id, changeInfo) {
        this.bookmarkList.changeBookmark(id, changeInfo);
    }

    onBookmarkMoved(id, moveInfo) {
        this.bookmarkList.updateBookmark(id, {});
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

