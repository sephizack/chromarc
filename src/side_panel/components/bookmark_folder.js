'use strict';

import { FolderIcon } from '../../icon_utils.js';
import { BookmarkContainer } from './bookmark_container.js';
import { TabPlaceholder } from './tab_placeholder.js';
import { NanoReact, h } from '../../nanoreact.js';
import { ContextMenu } from '../context_menu.js';


export class BookmarkFolder extends BookmarkContainer {
    constructor({ rootFolder, bookmarks, folders, urlIndex, openedFolders, onTabCreated, bookmarkTab }) {
        super({ rootFolder, bookmarks, folders, urlIndex, openedFolders, onTabCreated, bookmarkTab, folderClass: BookmarkFolder });
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
            [
                this.folderHeader = h('div',
                    {
                        class: 'bookmark-folder-header',
                        style: 'display: flex; align-items: center;',
                        onClick: (e) => {
                            e.stopPropagation();
                            this.toggleOpened();
                        },
                        onContextMenu: (e) => {
                            ContextMenu.addItem('Delete folder', () => {
                                // Make a popup to confirm folder removal using chrome.notifications
                                console.debug(`Requesting confirmation to remove folder "${this.rootFolder.title}"`);
                                confirm(`Are you sure you want to remove the folder "${this.rootFolder.title}"?\nThis will delete all ${this.rootFolder.children.length} bookmarks inside.`)
                            });
                        },
                        onDragOver: (e) => this.onDragOverHeader(e),
                        onDrop: this.onDrop.bind(this),
                    },
                    h('span', { class: 'folder-icon', innerHTML: FolderIcon }),
                    h('span', { class: 'folder-title' }, this.rootFolder.title || 'Folder'),
                ),
                this.childContainer = h('ul', {
                    class: 'bookmark-folder-children',
                    style: 'display: ' + (this.isOpened() ? 'block' : 'none') + ';',
                })
            ]
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

    isOpened() {
        return this.openedFolders.has(this.rootFolder.id);
    }

    toggleOpened() {
        const opening = !this.isOpened();
        console.debug(`Toggling folder ${this.rootFolder.title} (${this.rootFolder.id}) to ${opening ? 'open' : 'closed'}`);
        if (opening) {
            this.openedFolders.add(this.rootFolder.id);
        } else {
            this.openedFolders.delete(this.rootFolder.id);
        }
        this.childContainer.ref.style.display = opening ? 'block' : 'none';
        chrome.storage.local.set({ openedFolders: Array.from(this.openedFolders) });
    }

}
