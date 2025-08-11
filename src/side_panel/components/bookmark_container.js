'use strict';

import { Bookmark } from './bookmark.js';
import { NanoReact, h } from '../../nanoreact.js';
import { TabPlaceholder } from './tab_placeholder.js';


/**
 * Base class for bookmark containers (BookmarkList, BookmarkFolder).
 * Handles common logic for managing bookmarks and folders.
 */
export class BookmarkContainer extends NanoReact.Component {
    constructor({ rootFolder, bookmarks, folders, urlIndex, openedFolders, onTabCreated, bookmarkTab, folderClass }) {
        super();
        this.rootFolder = rootFolder;
        this.bookmarks = bookmarks || new Map();
        this.folders = folders || new Map();
        this.urlIndex = urlIndex || new Map();
        this.openedFolders = openedFolders || new Set();
        this.onTabCreated = onTabCreated;
        this.bookmarkTab = bookmarkTab;
        this.folderClass = folderClass;
        this.childContainer = null;
    }

    /**
     * Add a bookmark or folder to this container.
     * @param {object} bookmark - The bookmark or folder node.
     */
    addBookmark(bookmark) {
        if (bookmark.parentId !== this.rootFolder.id) {
            // Bookmark belongs to a different folder, skip adding here
            this.folders.get(bookmark.parentId).addBookmark(bookmark);
            return;
        }
        if (bookmark.url) {
            const bookmarkComponent = h(Bookmark, {
                bookmark,
                onTabCreated: this.onTabCreated,
                onDrop: this.onDrop ? this.onDrop.bind(this) : undefined,
            });
            this.bookmarks.set(bookmark.id, bookmarkComponent);
            this.urlIndex.set(bookmark.url, bookmarkComponent);
            this.childContainer.ref.appendChild(NanoReact.render(bookmarkComponent));
        } else {
            if (!this.folderClass) {
                throw new Error('folderClass not set on BookmarkContainer');
            }
            const folderComponent = h(this.folderClass, {
                rootFolder: bookmark,
                bookmarks: this.bookmarks,
                folders: this.folders,
                urlIndex: this.urlIndex,
                openedFolders: this.openedFolders,
                onTabCreated: this.onTabCreated,
                bookmarkTab: this.bookmarkTab,
                folderClass: this.folderClass,
            });
            this.folders.set(bookmark.id, folderComponent);
            this.childContainer.ref.appendChild(NanoReact.render(folderComponent));
        }
    }

    onDrop(e) {
        e.preventDefault();
        const draggedObject = TabPlaceholder.getDraggedObject();
        console.log(`Drop event triggered in ${this.type}:`, draggedObject);
        switch(draggedObject.type) {
            case 'Bookmark':
                const previousIndex = Array.from(this.childContainer.ref.children).indexOf(draggedObject.ref);
                TabPlaceholder.insertDraggedObject();
                // Find the new position of the dragged tab in the list and move it in Chrome
                // *DO NOT change the order*, otherwise you risk race conditions
                let placeholderIndex = Array.from(this.childContainer.ref.children).map(child => child.id).indexOf(draggedObject.ref.id);
                if (previousIndex >= 0 && previousIndex < placeholderIndex) {
                    // Chrome is computing the new index as if the tab was already removed,
                    // so we need to adjust the index if the previous index was before the new index
                    // See: https://github.com/chromium/chromium/blob/6fa8ee07f81ecb74d939576e60f380fda0578a07/components/bookmarks/browser/bookmark_model.cc#L532
                    placeholderIndex += 1;
                }
                console.log('Previous index:', previousIndex);
                console.log('Placeholder index:', placeholderIndex);
                chrome.bookmarks.move(draggedObject.bookmark.id, { parentId: this.rootFolder.id, index: placeholderIndex }, (res) => {
                    console.log('Bookmark moved:', res);
                    if (chrome.runtime.lastError) {
                        console.error('Error moving bookmark:', chrome.runtime.lastError);
                    }
                });
                break;
            case 'Tab':
                this.bookmarkTab(draggedObject.tab, this.rootFolder.id);
                break;
            default:
                console.error('Unknown drop type:', draggedObject);
                break;
        }
    }

    /**
     * Remove a bookmark or folder from this container.
     * @param {string} id - The id of the bookmark or folder.
     */
    onBookmarkRemoved(id) {
        let bookmark = this.bookmarks.get(id);
        if (bookmark) {
            this.bookmarks.delete(id);
            this.urlIndex.delete(bookmark.bookmark.url);
            bookmark.onBookmarkRemoved();
        }
        this.folders.get(id)?.ref.remove();
        this.folders.delete(id);
    }

    /**
     * Change a bookmark or folder's properties.
     * @param {string} id - The id of the bookmark or folder.
     * @param {object} changeInfo - The change info object.
     */
    onBookmarkChanged(id, changeInfo) {
        const bookmarkComponent = this.bookmarks.get(id);
        if (bookmarkComponent) {
            bookmarkComponent.onBookmarkChanged(changeInfo);
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
}
