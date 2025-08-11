'use strict';

import { BookmarkUtils } from '../BookmarkUtils.js';
import { BookmarkFolder } from './BookmarkFolder.js';
import { BookmarkContainer } from './BookmarkContainer.js';
import { h } from '../../nanoreact.js';


export class BookmarkList extends BookmarkContainer {
    constructor({ tabs, onTabCreated, bookmarkTab }) {
        super({ onTabCreated, bookmarkTab, folderClass: BookmarkFolder });
        this.tabs = tabs;
        this.rootFolder = null;
    }

    render() {
        this.childContainer = h('ul', {
            id: 'bookmark-list',
        }, []);
        return this.childContainer;
    }

    async componentDidMount() {
        // --- Retrieve opened folders from storage
        this.openedFolders = new Set((await chrome.storage.local.get(['openedFolders'])).openedFolders || []);

        // --- Load existing bookmarks
        this.rootFolder = BookmarkUtils.getBar();
        console.debug('Bookmarks Bar found:', this.rootFolder);
        // Only render Bookmarks Bar and its subfolders/bookmarks
        this.rootFolder.children.forEach(child => {
            this.addBookmark(child);
        });

        // --- Bookmarks incremental updates
        chrome.bookmarks.onCreated.addListener((id, bookmark) => this.addBookmark(bookmark));
        chrome.bookmarks.onRemoved.addListener(this.onBookmarkRemoved.bind(this));
        chrome.bookmarks.onChanged.addListener(this.onBookmarkChanged.bind(this));
        chrome.bookmarks.onMoved.addListener((id, moveInfo) => console.error('chrome.bookmarks.onMoved not implemented yet', id, moveInfo));
    }

    isTabBookmarked(tab) {
        return this.urlIndex.has(tab.pendingUrl || tab.url);
    }

    addBookmarkedTab(tab) {
        const bookmarkComponent = this.urlIndex.get(tab.pendingUrl || tab.url);
        if (bookmarkComponent && bookmarkComponent.setTab) {
            bookmarkComponent.setTab(tab);
        }
        this.tabs.set(tab.id, bookmarkComponent);
    }

}
