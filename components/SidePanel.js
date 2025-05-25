'use strict';

import { TabList } from './TabList.js';
import { BookmarkList } from './BookmarkList.js';

export class SidePanel {
    constructor() {
        this.tabList = new TabList();
        this.bookmarkList = new BookmarkList(document.getElementById('bookmark-list'));
        this.activeTabId = null;
    }

    render() {
        this.tabList.render();
        this.bookmarkList.render();

        // Tabs incremental updates
        chrome.tabs.onCreated.addListener(tab => {
            this.tabList.addTab(tab);
        });
        chrome.tabs.onRemoved.addListener(tabId => {
            this.tabList.removeTab(tabId);
        });
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.tabList.updateTab(tabId, changeInfo, tab);
        });

        // Track active tab
        chrome.tabs.onActivated.addListener(activeInfo => {
            this.tabList.setActiveTab(activeInfo.tabId);
        });

        // Bookmarks incremental updates
        chrome.bookmarks.onCreated.addListener((id, bookmark) => {
            this.bookmarkList.addBookmark(id, bookmark);
        });
        chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
            this.bookmarkList.removeBookmark(id);
        });
        chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
            this.bookmarkList.updateBookmark(id, changeInfo);
        });
        chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
            this.bookmarkList.updateBookmark(id, {});
        });
    }
}
