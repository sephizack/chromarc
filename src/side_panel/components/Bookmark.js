'use strict';

import { Tab, TabFavicon, CloseButton } from './Tab.js';
import { h } from '../../nanoreact.js';


export class Bookmark extends Tab {
    constructor({bookmark, onTabCreated}) {
        super({});
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
                onMouseEnter: () => {
                    if (this.tab) {
                        this.closeButton.ref.style.display = '';
                    }
                },
                onMouseLeave: () => {
                    this.closeButton.ref.style.display = 'none';
                },
                onClick: () => {
                    if (this.tab) {
                        console.log('Bookmark already opened in tab:', this.tab.id);
                        chrome.tabs.update(this.tab.id, { active: true });
                    } else {
                        console.log('Opening bookmark in a new tab:', this.bookmark.id);
                        chrome.tabs.create({ url: this.bookmark.url });
                    }
                }
            },
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
                    style: {'display': 'none'},
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
                    chrome.tabs.remove(this.tab.id);
                }
            }),
        );
    }

    componentDidMount() {
        this.closeButton.ref.style.display = 'none';
    }

    getContextMenuItems() {
        return [
            { id: 'bookmark-remove', title: 'Remove Bookmark', onclick: () => chrome.bookmarks.remove(this.bookmark.id) },
        ]
    }

    updateTab(changeInfo, _) {
        super.updateTab(changeInfo, _);
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

    removeTab() {
        this.setActive(false);
        this.setIsUrlDiff(false);
        this.tab = null;
        this.updateTab(this.bookmark);
    }

    changeBookmark(id, changeInfo) {
        this.updateTab(changeInfo);
    }

    removeBookmark() {
        this.ref.remove();
        if (this.tab) {
            this.onTabCreated(this.tab);
        }
    }

    setTab(tab) {
        this.tab = tab;
    }

}
