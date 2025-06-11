
'use strict';

import { getFaviconFromCache } from '../../icon_utils.js';
import { NanoReact, h } from '../../nanoreact.js';
import { TabPlaceholder } from './TabPlaceholder.js';


export class TabFavicon extends NanoReact.Component {
    constructor({ tab }) {
        super();
        this.tab = tab;
    }

    getFaviconUrl() {
        return this.tab?.status === 'loading'
            ? '../assets/spinner.svg'
            : getFaviconFromCache(this.tab?.url) || this.tab?.favIconUrl;
    }

    onTabUpdated(changeInfo) {
        // Show spinner if loading, otherwise show favicon
        if (changeInfo.status !== undefined) {
            this.ref.src = this.getFaviconUrl();
            this.ref.style.display = 'inline';
        } else if (changeInfo.favIconUrl !== undefined) {
            this.ref.src = changeInfo.favIconUrl;
            this.ref.style.display = this.ref.src ? 'inline' : 'none';
        }
    }

    render() {
        return h('img', {
            class: 'tab-favicon',
            src: this.getFaviconUrl(),
            onerror: function () { this.style.display = 'none'; }
        });
    }
}

export function CloseButton({ onClick }) {
    return h('button', {
        class: 'tab-close',
        onClick: onClick
    }, '\u00D7');
}



export class Tab extends NanoReact.Component {
    constructor({ tab, onDragStart, onDragOver, onDrop, onDragEnd, bookmarkTab }) {
        super();
        // --- Props
        this.tab = tab;
        this.onDrop = onDrop;
        this.bookmarkTab = bookmarkTab;
        // --- DOM Elements
        this.favicon = null;
        this.title = null;
        this.closeButton = null;
    }

    render() {
        return h('li',
            {
                class: 'tab-item' + (this.tab.active ? ' active' : '') + (this.tab.pinned ? ' pinned' : ''),
                id: 'tab-' + this.tab.id,
                draggable: true,
                title: this.tab.title || '',
                onClick: (e) => {
                    e.stopPropagation();
                    chrome.tabs.update(this.tab.id, { active: true });
                },
                onMouseLeave: () => {
                    this.closeButton.ref.style.display = 'none';
                },
                onDragStart: (e) => this.onDragStart(e),
                onDragEnd: (e) => this.onDragEnd(e),
                onDragOver: (e) => this.onDragOver(e),
                onDrop: this.onDrop,
                onMouseEnter: () => {
                    this.closeButton.ref.style.display = '';
                },
            },
            this.favicon = h(TabFavicon, { tab: this.tab }),
            this.title = h('span', { class: 'tab-title' }, this.tab.title || this.tab.url || 'Loading...'),
            this.closeButton = h(CloseButton, {
                onClick: (e) => {
                    e.stopPropagation();
                    chrome.tabs.remove(this.tab.id);
                }
            })
        );
    }

    componentDidMount() {
        this.closeButton.ref.style.display = 'none';
    }

    getContextMenuItems() {
        return [
            { id: 'tab-close', title: 'Close Tab', onclick: () => chrome.tabs.remove(this.tab.id) },
            { id: 'tab-duplicate', title: 'Duplicate Tab', onclick: () => chrome.tabs.duplicate(this.tab.id) },
            { id: 'tab-bookmark', title: 'Bookmark Tab', onclick: () => {
                // Attach to the Bookmark Bar
                this.bookmarkTab(this.tab, '1');
            }},
        ]
    }

    onDragStart(e) {
        console.log('Drag start event triggered for tab:', this.tab);
        e.dataTransfer.effectAllowed = 'move';
        // Create and insert placeholder
        TabPlaceholder.createFor(this, this.onDrop);
    }

    onDragOver(e) {
        e.preventDefault();
        // Move placeholder before or after depending on mouse position
        const rect = this.ref.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        if (before) {
            TabPlaceholder.insertBefore(this.ref);
        } else {
            TabPlaceholder.insertAfter(this.ref);
        }
        TabPlaceholder.setOnDrop(this.onDrop);
    }

    onDragEnd(e) {
        console.log('Drag end event triggered for tab:', this.tab);
        this.ref.style.display = '';
        TabPlaceholder.remove();
    }

    onTabUpdated(changeInfo, _) {
        if (this.tab) {
            Object.assign(this.tab, changeInfo);
        }
        if (changeInfo.title !== undefined) {
            const title = changeInfo.title || 'Loading...';
            this.title.ref.textContent = title;
            this.title.ref.title = title;
        }
        if (changeInfo.url !== undefined) {
            this.title.ref.title = this.tab.url;
        }
        this.favicon.onTabUpdated(changeInfo);
    }

    onTabRemoved() {
        this.ref.remove();
    }

    setActive(isActive) {
        if (isActive) {
            this.ref.classList.add('active');
        } else {
            this.ref.classList.remove('active');
        }
    }
}

