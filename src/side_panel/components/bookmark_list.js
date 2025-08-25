'use strict';

import { BookmarkUtils } from '../bookmark_utils.js';
import { BookmarkFolder } from './bookmark_folder.js';
import { BookmarkContainer } from './bookmark_container.js';
import { h } from '../../nanoreact.js';


export class BookmarkList extends BookmarkContainer {
    /**
     * Creates a new BookmarkList instance.
     * @param {object} props - Component props.
     * @param {Map} props.tabs - Map of tab components.
     * @param {Function} props.onTabCreated - Callback for tab creation.
     * @param {Function} props.bookmarkTab - Function to bookmark a tab.
     */
    constructor({ tabs, onTabCreated, bookmarkTab }) {
        super({ onTabCreated, bookmarkTab, folderClass: BookmarkFolder });
        this.tabs = tabs;
        this.rootFolder = null;
    }

    /**
     * Renders the bookmark list container.
     * @returns {NanoReact.Element} The bookmark list element.
     */
    render() {
        this.childContainer = h('ul', {
            id: 'bookmark-list',
        }, []);
        return this.childContainer;
    }

    /**
     * Called after the component is mounted. Loads bookmarks and sets up event listeners.
     */
    async componentDidMount() {
        // --- Retrieve opened folders from storage
        this.openedFolders = new Set((await chrome.storage.local.get(['openedFolders']))?.openedFolders || []);

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

    /**
     * Checks if a tab is bookmarked.
     * @param {chrome.tabs.Tab} tab - The tab to check.
     * @returns {boolean} True if the tab is bookmarked.
     */
    isTabBookmarked(tab) {
        return this.urlIndex.has(tab.pendingUrl || tab.url);
    }

    /**
     * Adds a bookmarked tab to the list and associates it with its bookmark component.
     * @param {chrome.tabs.Tab} tab - The tab to add.
     */
    addBookmarkedTab(tab) {
        const bookmarkComponent = this.urlIndex.get(tab.pendingUrl || tab.url);
        if (bookmarkComponent && bookmarkComponent.setTab) {
            bookmarkComponent.setTab(tab);
        }
        this.tabs.set(tab.id, bookmarkComponent);
    }

}
