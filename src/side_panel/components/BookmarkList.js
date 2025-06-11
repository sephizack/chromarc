'use strict';

import { BookmarkFolder } from './BookmarkFolder.js';
import { BookmarkContainer } from './BookmarkContainer.js';
import { TabPlaceholder } from './TabPlaceholder.js';
import { NanoReact, h } from '../../nanoreact.js';


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

    componentDidMount() {
        // --- Load existing bookmarks
        chrome.bookmarks.getTree((bookmarkTreeNodes) => {
            if (!bookmarkTreeNodes || !bookmarkTreeNodes[0] || !bookmarkTreeNodes[0].children) {
                console.error('No bookmarks found or invalid structure');
                return;
            }
            // Chrome's bookmarks tree: [0] is root, children: [0]=Bookmarks Bar, [1]=Other Bookmarks, [2]=Mobile Bookmarks
            const nodes = bookmarkTreeNodes[0].children;
            // Find the Bookmarks Bar node (usually id '1' or title 'Bookmarks Bar')
            this.rootFolder = nodes.find(
                node => node.id === '1' || node.title === 'Bookmarks Bar' || node.title === 'Bookmarks bar'
            );
            if (!this.rootFolder || !this.rootFolder.children) {
                console.error('Bookmarks Bar not found');
                return;
            }
            console.debug('Bookmarks Bar found:', this.rootFolder);
            // Only render Bookmarks Bar and its subfolders/bookmarks
            this.rootFolder.children.forEach(child => {
                this.addBookmark(child);
            });
        });

        // Bookmarks incremental updates
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
