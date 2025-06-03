'use strict';

import { getFolderIconSVG } from '../icon_utils.js';
import { Bookmark } from './Bookmark.js';

export class BookmarkFolder {
    constructor(bookmarkList, folder) {
        this.bookmarkList = bookmarkList;
        this.folder = folder;
        this.isOpen = false;
    }

    render() {
        this.iconRef = crel('span', { class: 'folder-icon' });
        this.iconRef.innerHTML = getFolderIconSVG();
        this.titleRef = crel('span', { class: 'folder-title' }, this.folder.title || 'Folder');
        this.headerRef = crel(
            'div',
            {
                class: 'bookmark-folder-header',
                style: 'display: flex; align-items: center;'
            },
            this.iconRef,
            this.titleRef
        );
        this.sublistRef = crel('ul', { class: 'bookmark-folder-children', style: 'display: none;' });
        if (this.folder.children) {
            this.folder.children.forEach(child => {
                this.addBookmark(child);
            });
        }
        this.ref = crel(
            'li',
            { class: 'bookmark-folder', style: 'display: block;', id: 'bookmark-folder-' + this.folder.id },
            this.headerRef,
            this.sublistRef
        );
        this.headerRef.onclick = (e) => {
            e.stopPropagation();
            this.setIsOpen(!this.isOpen);
        };
        return this.ref;
    }

    addBookmark(bookmark) {
        if (bookmark.url) {
            const bookmarkComponent = new Bookmark(bookmark);
            this.bookmarkList.bookmarks.set(bookmark.id, bookmarkComponent);
            this.bookmarkList.urlIndex.set(bookmark.url, bookmarkComponent);
            this.sublistRef.appendChild(bookmarkComponent.render());
        } else {
            const folderComponent = new BookmarkFolder(this.bookmarkList, bookmark);
            this.bookmarkList.folders.set(bookmark.id, folderComponent);
            this.sublistRef.appendChild(folderComponent.render());
        }
    }

    setIsOpen(isOpen) {
        this.isOpen = isOpen;
        this.sublistRef.style.display = isOpen ? 'block' : 'none';
    }
}
