'use strict';

import { getFolderIconSVG } from '../../icon_utils.js';
import { Bookmark } from './Bookmark.js';
import { NanoReact, h } from '../../nanoreact.js';

export class BookmarkFolder extends NanoReact.Component {
    constructor({ folder, bookmarks, folders, urlIndex }) {
        super();
        this.folder = folder;
        this.bookmarks = bookmarks;
        this.folders = folders;
        this.urlIndex = urlIndex;
        this.isOpen = false;
    }

    render() {
        return h('li',
            { class: 'bookmark-folder', style: 'display: block;', id: 'bookmark-folder-' + this.folder.id },
            h('div',
                {
                    class: 'bookmark-folder-header',
                    style: 'display: flex; align-items: center;',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.setIsOpen(!this.isOpen);
                    }
                },
                h('span', { class: 'folder-icon', innerHTML: getFolderIconSVG() }),
                h('span', { class: 'folder-title' }, this.folder.title || 'Folder'),
            ),
            this.sublist = h('ul', { class: 'bookmark-folder-children', style: 'display: none;' })
        );
    }

    componentDidMount() {
        if (this.folder.children) {
            this.folder.children.forEach(child => {
                this.addBookmark(child);
            });
        }
    }

    addBookmark(bookmark) {
        if (bookmark.url) {
            const bookmarkComponent = h(Bookmark, { bookmark });
            this.bookmarks.set(bookmark.id, bookmarkComponent);
            this.urlIndex.set(bookmark.url, bookmarkComponent);
            this.sublist.ref.appendChild(NanoReact.render(bookmarkComponent));
        } else {
            const folderComponent = h(BookmarkFolder, { folder: bookmark, bookmarks: this.bookmarks, folders: this.folders, urlIndex: this.urlIndex });
            this.folders.set(bookmark.id, folderComponent);
            this.sublist.ref.appendChild(NanoReact.render(folderComponent));
        }
    }

    setIsOpen(isOpen) {
        this.isOpen = isOpen;
        this.sublist.ref.style.display = isOpen ? 'block' : 'none';
    }
}
