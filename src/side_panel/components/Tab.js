
'use strict';

import { getFaviconFromCache } from '../../icon_utils.js';
import { NanoReact, h } from '../../nanoreact.js';

export class TabFavicon extends NanoReact.Component {
    constructor({ tab }) {
        super();
        this.tab = tab;
    }

    getFaviconUrl() {
        console.log('TabFavicon.getFaviconUrl', this.tab);
        return this.tab?.status === 'loading'
            ? '../assets/spinner.svg'
            : getFaviconFromCache(this.tab?.url) || this.tab?.favIconUrl;
    }

    updateTab(changeInfo) {
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
    constructor({ tab, onDragStart, onDragOver, onDrop, onDragEnd }) {
        super();
        // --- Props
        this.tab = tab;
        this.onDragStart = onDragStart;
        this.onDragOver = onDragOver;
        this.onDrop = onDrop;
        this.onDragEnd = onDragEnd;
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
                onDragStart: (e) => this.onDragStart(e, this.tab.id),
                onDragOver: (e) => this.onDragOver(e, this.tab.id),
                onDrop: (e) => this.onDrop(e, this.tab.id),
                onDragEnd: (e) => this.onDragEnd(e, this.tab.id),
                onMouseEnter: () => {
                    this.closeButton.ref.style.display = '';
                },
                onMouseLeave: () => {
                    this.closeButton.ref.style.display = 'none';
                }
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
                chrome.bookmarks.create({ title: this.tab.title, url: this.tab.url, parentId: '1'}, (bookmark) => {
                    if (chrome.runtime.lastError) {
                        console.error('Failed to bookmark tab:', chrome.runtime.lastError.message);
                    } else {
                        console.debug('Tab bookmarked:', bookmark);
                        // TODO: use this to transfer the tab to the bookmark and delete the tab component
                    }
                });
            }},
        ]
    }

    updateTab(changeInfo, _) {
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
        this.favicon.updateTab(changeInfo);
    }

    removeTab() {
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

