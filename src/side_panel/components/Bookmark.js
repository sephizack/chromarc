'use strict';

import { DeleteIcon, CloseIcon, getFaviconFromCache } from '../../icon_utils.js';
import { Tab, TabFavicon, CloseButton } from './Tab.js';
import { h, NanoReact } from '../../nanoreact.js';
import { ContextMenu } from '../ContextMenu.js';


export class Bookmark extends Tab {
    constructor({ bookmark, onDrop, onTabCreated }) {
        super({ onDrop: onDrop });
        this.bookmark = bookmark;
        this.isUrlDiff = false;
        this.onTabCreated = onTabCreated;
    }

    render() {
        return h(
            'li',
            {
                class: 'bookmark-item',
                id: 'bookmark-' + this.bookmark.id,
                draggable: true,
                onMouseEnter: () => {
                    this.closeButton.setHidden(false);
                },
                onMouseLeave: () => {
                    this.closeButton.setHidden(true);
                },
                onClick: () => {
                    if (this.tab) {
                        console.log('Bookmark already opened in tab:', this.tab.id);
                        chrome.tabs.update(this.tab.id, { active: true });
                    } else {
                        console.log('Opening bookmark in a new tab:', this.bookmark.id);
                        chrome.tabs.create({ url: this.bookmark.url });
                    }
                },
                onDragStart: (e) => this.onDragStart(e),
                onDragEnd: (e) => this.onDragEnd(e),
                onDragOver: (e) => this.onDragOver(e),
                onDrop: this.onDrop,
                onContextMenu: (e) => {
                    ContextMenu.addItem('Remove Bookmark', () => {
                        chrome.bookmarks.remove(this.bookmark.id);
                    });
                },
            },
            [
                this.leftContainer = h('div',
                    {
                        class: 'bookmark-left',
                        onMouseEnter: () => {
                            if (this.isUrlDiff) {
                                this.textContainer.ref.classList.add('hint-visible');
                                this.leftContainer.ref.classList.add('hint-bg');
                            }
                        },
                        onMouseLeave: () => {
                            this.textContainer.ref.classList.remove('hint-visible');
                            this.leftContainer.ref.classList.remove('hint-bg');
                        },
                        onClick: (event) => {
                            if (this.isUrlDiff) {
                                // Update the tab to the original bookmarked URL
                                chrome.tabs.update(this.tab.id, { url: this.bookmark.url }, (tab) => {
                                    if (chrome.runtime.lastError) {
                                        console.error('Failed to restore tab URL:', chrome.runtime.lastError.message);
                                    }
                                });
                            }
                        }
                    },
                    this.favicon = h(TabFavicon, { tab: this.bookmark }),
                    this.urlDiffIndicator = h('span', {
                        class: 'url-diff-indicator',
                        style: { 'display': 'none' },
                        title: 'Tab URL is different from bookmark URL'
                    }),
                ),
                this.textContainer = h('div', { class: 'bookmark-text-container' },
                    this.title = h('span', { class: 'tab-title', title: this.bookmark.title || this.bookmark.url },
                        this.bookmark.title || this.bookmark.url
                    ),
                    h('span', { class: 'bookmark-url-hint' }, 'Back to the bookmarked URL')
                ),
                this.closeButton = h(CloseButton, {
                    onClick: (e) => {
                        e.stopPropagation();

                        if (this.closeButton.icon === DeleteIcon) {
                            this.closeButton.ref.remove();
                            this.ref.appendChild(NanoReact.render(h('button', {
                                type: 'button',
                                style: {
                                    "background": "transparent",
                                    "border": "1px solid red",
                                    "border-radius": "6px",
                                    "color": "red",
                                    "font-size": "0.9em",
                                },
                                onClick: (e) => {
                                    e.stopPropagation();
                                    chrome.bookmarks.remove(this.bookmark.id);
                                },
                                onMouseLeave: (e) => {
                                    e.stopPropagation();
                                    e.target.remove();
                                    this.ref.appendChild(this.closeButton.ref);
                                },
                            }, 'Delete?')));
                            return;
                        }

                        chrome.tabs.remove(this.tab.id);
                    },
                    icon: DeleteIcon
                }),
            ],
        );
    }

    componentDidMount() {
        this.closeButton.setHidden(true);
    }

    onTabUpdated(changeInfo, _) {
        super.onTabUpdated(changeInfo, _);
        // Stylish indicator if tab URL differs from bookmark URL
        const tabUrl = this.tab.url || this.tab.pendingUrl;
        this.setIsUrlDiff(tabUrl !== this.bookmark.url);
    }

    setIsUrlDiff(isUrlDiff) {
        this.isUrlDiff = isUrlDiff;
        if (isUrlDiff) {
            this.urlDiffIndicator.ref.style.display = '';
        } else {
            this.urlDiffIndicator.ref.style.display = 'none';
            this.textContainer.ref.classList.remove('hint-visible');
        }
    }

    onTabRemoved() {
        this.tab = null;
        this.closeButton.setIcon(DeleteIcon);
        this.setActive(false);
        this.setIsUrlDiff(false);
        this.onTabUpdated(this.bookmark);
    }

    onBookmarkChanged(id, changeInfo) {
        this.onTabUpdated(changeInfo);
    }

    onBookmarkRemoved() {
        this.ref.remove();
        if (this.tab) {
            this.onTabCreated(this.tab);
        }
    }

    setTab(tab) {
        this.tab = tab;
        this.closeButton.setIcon(CloseIcon);
    }

}
