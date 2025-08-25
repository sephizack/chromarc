'use strict';

import { DeleteIcon, CloseIcon } from '../../icon_utils.js';
import { Tab, TabFavicon, CloseButton } from './tab.js';
import { h, NanoReact } from '../../nanoreact.js';
import { ContextMenu } from '../context_menu.js';


export class Bookmark extends Tab {
    /**
     * Creates a new Bookmark instance.
     * @param {object} props - Component props.
     * @param {chrome.bookmarks.BookmarkTreeNode} props.bookmark - The bookmark data.
     * @param {Function} props.onDrop - Drop event handler.
     * @param {Function} props.onTabCreated - Callback for tab creation.
     */
    constructor({ bookmark, onDrop, onTabCreated }) {
        super({ onDrop: onDrop });
        this.bookmark = bookmark;
        this.isUrlDiff = false;
        this.onTabCreated = onTabCreated;
    }

    /**
     * Renders the bookmark element.
     * @returns {NanoReact.Element} The bookmark element.
     */
    async render() {
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
                onContextMenu: (_e) => {
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
                        onClick: (_event) => {
                            if (this.isUrlDiff) {
                                // Update the tab to the original bookmarked URL
                                chrome.tabs.update(this.tab.id, { url: this.bookmark.url }, (_tab) => {
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
                    onClick: async (e) => {
                        e.stopPropagation();

                        if (this.closeButton.icon === DeleteIcon) {
                            this.closeButton.ref.remove();
                            this.ref.appendChild(await NanoReact.render(h('button', {
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

    /**
     * Called after the component is mounted. Hides the close button initially.
     */
    async componentDidMount() {
        this.closeButton.setHidden(true);
    }

    /**
     * Handles tab update events and checks for URL differences.
     * @param {chrome.tabs.TabChangeInfo} changeInfo - The change information.
     * @param {chrome.tabs.Tab} _ - The updated tab (unused).
     */
    onTabUpdated(changeInfo, _) {
        super.onTabUpdated(changeInfo, _);
        // Stylish indicator if tab URL differs from bookmark URL
        const tabUrl = this.tab.url || this.tab.pendingUrl;
        this.setIsUrlDiff(tabUrl !== this.bookmark.url);
    }

    /**
     * Sets the URL difference indicator visibility.
     * @param {boolean} isUrlDiff - Whether the tab URL differs from bookmark URL.
     */
    setIsUrlDiff(isUrlDiff) {
        this.isUrlDiff = isUrlDiff;
        if (isUrlDiff) {
            this.urlDiffIndicator.ref.style.display = '';
        } else {
            this.urlDiffIndicator.ref.style.display = 'none';
            this.textContainer.ref.classList.remove('hint-visible');
        }
    }

    /**
     * Handles tab removal events.
     */
    onTabRemoved() {
        this.tab = null;
        this.closeButton.setIcon(DeleteIcon);
        this.setActive(false);
        this.setIsUrlDiff(false);
        this.onTabUpdated(this.bookmark);
    }

    /**
     * Handles bookmark change events.
     * @param {string} id - The bookmark ID.
     * @param {chrome.bookmarks.BookmarkChangeInfo} changeInfo - The change information.
     */
    onBookmarkChanged(id, changeInfo) {
        this.onTabUpdated(changeInfo);
    }

    /**
     * Handles bookmark removal events.
     */
    onBookmarkRemoved() {
        this.ref.remove();
        if (this.tab) {
            this.onTabCreated(this.tab);
        }
    }

    /**
     * Associates a tab with this bookmark.
     * @param {chrome.tabs.Tab} tab - The tab to associate.
     */
    setTab(tab) {
        this.tab = tab;
        this.closeButton.setIcon(CloseIcon);
    }

}
