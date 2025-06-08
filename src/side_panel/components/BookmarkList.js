'use strict';

import { Bookmark } from './Bookmark.js';
import { BookmarkFolder } from './BookmarkFolder.js';
import { NanoReact, h } from '../../nanoreact.js';


export class BookmarkList extends NanoReact.Component {
    constructor({ tabs, onTabCreated }) {
        super();
        this.tabs = tabs;
        this.onTabCreated = onTabCreated;
        this.bookmarks = new Map();
        this.folders = new Map();
        this.urlIndex = new Map();
        this.rootFolder = null;
    }

    render() {
        return h('ul', { id: 'bookmark-list' }, []);
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
            // Only render Bookmarks Bar and its subfolders/bookmarks
            this.rootFolder.children.forEach(child => {
                this.addBookmark(child);
            });
        });

        // Bookmarks incremental updates
        chrome.bookmarks.onCreated.addListener((id, bookmark) => this.addBookmark(bookmark));
        chrome.bookmarks.onRemoved.addListener(this.removeBookmark.bind(this));
        chrome.bookmarks.onChanged.addListener(this.changeBookmark.bind(this));
        chrome.bookmarks.onMoved.addListener((e) => console.error('chrome.bookmarks.onMoved not implemented yet'));
    }

    isTabBookmarked(tab) {
        return this.urlIndex.has(tab.pendingUrl || tab.url);
    }

    addBookmarkedTab(tab) {
        const bookmarkComponent = this.urlIndex.get(tab.pendingUrl || tab.url);
        bookmarkComponent.setTab(tab);
        this.tabs.set(tab.id, bookmarkComponent);
    }

    addBookmark(bookmark) {
        console.trace(`addBookmark`, bookmark);
        if (bookmark.url) {
            const bookmarkComponent = h(Bookmark, { bookmark, onTabCreated: this.onTabCreated });
            this.bookmarks.set(bookmark.id, bookmarkComponent);
            this.urlIndex.set(bookmark.url, bookmarkComponent);
            this.ref.appendChild(NanoReact.render(bookmarkComponent));
        } else {
            const folderComponent = h(BookmarkFolder, { folder: bookmark, bookmarks: this.bookmarks, urlIndex: this.urlIndex });
            this.folders.set(bookmark.id, folderComponent);
            this.ref.appendChild(NanoReact.render(folderComponent));
        }
    }

    changeBookmark(id, changeInfo) {
        const bookmarkComponent = this.bookmarks.get(id);
        if (bookmarkComponent) {
            bookmarkComponent.changeBookmark(changeInfo);
        }
        // For folders, just update the title
        const folderComponent = this.folders.get(id);
        if (folderComponent && changeInfo.title !== undefined) {
            const titleEl = folderComponent.ref.querySelector('.folder-title');
            if (titleEl) {
                titleEl.textContent = changeInfo.title || 'Folder';
            }
        }
    }

    removeBookmark(id) {
        console.trace(`removeBookmark`, id);
        let bookmark = this.bookmarks.get(id);
        if (bookmark) {
            this.bookmarks.delete(id);
            this.urlIndex.delete(bookmark.bookmark.url);
            bookmark.removeBookmark();
        }
        // TODO: Not sure it's the right way to remove folder...
        this.folders.get(id)?.ref.remove();
        this.folders.delete(id);
    }
}
