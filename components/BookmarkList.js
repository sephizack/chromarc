'use strict';

import { Bookmark } from './Bookmark.js';
import { BookmarkFolder } from './BookmarkFolder.js';

export class BookmarkList {
    constructor() {
        this.bookmarks = new Map();
        this.folders = new Map();
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
            const bookmarksBar = nodes.find(
                node => node.id === '1' || node.title === 'Bookmarks Bar' || node.title === 'Bookmarks bar'
            );
            if (!bookmarksBar || !bookmarksBar.children) {
                console.error('Bookmarks Bar not found');
                return;
            }
            // Only render Bookmarks Bar and its subfolders/bookmarks
            bookmarksBar.children.forEach(child => {
                this.addBookmark(child.id, child);
            });
        });
    }

    addBookmark(id, bookmark) {
        if (bookmark.url) {
            const bookmarkComponent = new Bookmark(bookmark);
            this.bookmarks.set(id, bookmarkComponent);
            this.ref.appendChild(bookmarkComponent.render());
        } else {
            const folderComponent = new BookmarkFolder(bookmark);
            this.folders.set(id, folderComponent);
            this.ref.appendChild(folderComponent.render());
        }
    }

    updateBookmark(id, changeInfo) {
        const bookmarkComponent = this.bookmarks.get(id);
        if (bookmarkComponent) {
            bookmarkComponent.update(changeInfo);
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
        const bookmarkComponent = this.bookmarks.get(id);
        if (bookmarkComponent) {
            if (bookmarkComponent.element.parentNode) {
                bookmarkComponent.element.parentNode.removeChild(bookmarkComponent.element);
            }
            this.bookmarks.delete(id);
        }
        const folderComponent = this.folders.get(id);
        if (folderComponent) {
            if (folderComponent.element.parentNode) {
                folderComponent.element.parentNode.removeChild(folderComponent.element);
            }
            this.folders.delete(id);
        }
    }
}
