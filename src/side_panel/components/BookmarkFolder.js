'use strict';

import { getFolderIconSVG } from '../../icon_utils.js';
import { BookmarkContainer } from './BookmarkContainer.js';
import { TabPlaceholder } from './TabPlaceholder.js';
import { NanoReact, h } from '../../nanoreact.js';


export class BookmarkFolder extends BookmarkContainer {
    constructor({ rootFolder, bookmarks, folders, urlIndex, onTabCreated, bookmarkTab }) {
        super({ rootFolder, bookmarks, folders, urlIndex, onTabCreated, bookmarkTab, folderClass: BookmarkFolder });
        this.isOpen = false;
    }

    render() {
        return h('li',
            {
                class: 'bookmark-folder',
                style: 'display: block;',
                id: 'bookmark-folder-' + this.rootFolder.id,
                onDragEnter: (e) => this.onDragEnter(e),
                onDragLeave: (e) => this.onDragLeave(e),
            },
            this.folderHeader = h('div',
                {
                    class: 'bookmark-folder-header',
                    style: 'display: flex; align-items: center;',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.setIsOpen(!this.isOpen);
                    },
                    onDragOver: (e) => this.onDragOverHeader(e),
                    onDrop: this.onDrop.bind(this),
                },
                h('span', { class: 'folder-icon', innerHTML: getFolderIconSVG() }),
                h('span', { class: 'folder-title' }, this.rootFolder.title || 'Folder'),
            ),
            this.childContainer = h('ul', { class: 'bookmark-folder-children', style: 'display: none;' })
        );
    }

    onDragEnter(e) {
        e.preventDefault();
        this.ref.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
    }

    onDragLeave(e) {
        e.preventDefault();
        // Check if mouse is still within the folder area
        const rect = this.ref.getBoundingClientRect();
        const isInside = e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom;
        if (!isInside) {
            this.ref.style.backgroundColor = ''; // Remove highlight on drag leave
        }
    }

    onDragOverHeader(e) {
        e.preventDefault();
        TabPlaceholder.insertAfter(this.childContainer.ref.lastChild);
        TabPlaceholder.setOnDrop(this.onDrop.bind(this));
    }

    componentDidMount() {
        if (this.rootFolder.children) {
            this.rootFolder.children.forEach(child => {
                this.addBookmark(child);
            });
        }
    }

    setIsOpen(isOpen) {
        this.isOpen = isOpen;
        this.childContainer.ref.style.display = isOpen ? 'block' : 'none';
    }
}
