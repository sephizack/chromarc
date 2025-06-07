'use strict';

import { Bookmark } from './Bookmark.js';
import { BookmarkFolder } from './BookmarkFolder.js';

export class BookmarkList {
    constructor() {
        this.bookmarks = new Map();
        this.folders = new Map();
        this.urlIndex = new Map();
        this.rootFolder = null;
    }

    render() {
        this.ref = document.getElementById('bookmark-list');
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
    }

    addBookmark(bookmark) {
        console.trace(`addBookmark`, bookmark);
        if (bookmark.url) {
            const bookmarkComponent = new Bookmark(bookmark);
            this.bookmarks.set(bookmark.id, bookmarkComponent);
            this.urlIndex.set(bookmark.url, bookmarkComponent);
            this.ref.appendChild(bookmarkComponent.render());
        } else {
            const folderComponent = new BookmarkFolder(this, bookmark);
            this.folders.set(bookmark.id, folderComponent);
            this.ref.appendChild(folderComponent.render());
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
        this.bookmarks.get(id)?.ref.remove();
        this.bookmarks.delete(id);
        this.folders.get(id)?.ref.remove();
        this.folders.delete(id);
    }
}
