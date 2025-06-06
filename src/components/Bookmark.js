'use strict';

import { getFaviconUrl } from '../icon_utils.js';
import { Tab } from './Tab.js';

export class Bookmark extends Tab {
    constructor(bookmark) {
        super(null);
        this.bookmark = bookmark;
        this.isUrlDiff = false;
    }

    render() {
        this.faviconRef = crel('img', {
            class: 'tab-favicon',
            src: getFaviconUrl(this.bookmark.url),
            onerror: function() { this.style.display = 'none'; }
        });
        // Indicator for URL difference
        this.urlDiffIndicatorRef = crel('span', {
            class: 'url-diff-indicator',
            style: 'display: none;',
            title: 'Tab URL is different from bookmark URL'
        });
        this.titleRef = crel('span', {
            class: 'tab-title',
            title: this.bookmark.url
        }, this.bookmark.title || this.bookmark.url);
        // Subtext hint, always rendered for layout stability
        this.urlHintRef = crel('span', {
            class: 'bookmark-url-hint'
        }, 'Back to the bookmarked URL');
        this.textContainerRef = crel('div', { class: 'bookmark-text-container' }, this.titleRef, this.urlHintRef);
        // Left part container (favicon + indicator)
        this.leftContainerRef = crel('div', { class: 'bookmark-left' }, this.faviconRef, this.urlDiffIndicatorRef);
        this.closeButtonRef = this.renderCloseButton();
        this.closeButtonRef.style.display = 'none';
        this.ref = crel(
            'li',
            { 
                class: 'bookmark-item', 
                id: 'bookmark-' + this.bookmark.id,
                onmouseenter: () => {
                    if (this.tab) {
                        this.closeButtonRef.style.display = '';
                    }
                },
                onmouseleave: () => {
                    this.closeButtonRef.style.display = 'none';
                }
            },
            this.leftContainerRef,
            this.textContainerRef,
            this.closeButtonRef
        );
        this.ref.onclick = () => {
            if (this.tab) {
                console.log('Bookmark already opened in tab:', this.tab.id);
                chrome.tabs.update(this.tab.id, { active: true });
            } else {
                console.log('Opening bookmark in a new tab:', this.bookmark.id);
                chrome.tabs.create({ url: this.bookmark.url });
            }
        };
        // Show/hide hint on left part hover, using class for animation/position
        const showHint = () => {
            if (this.isUrlDiff) {
                this.textContainerRef.classList.add('hint-visible');
                this.leftContainerRef.classList.add('hint-bg');
            }
        };
        const hideHint = () => {
            this.textContainerRef.classList.remove('hint-visible');
            this.leftContainerRef.classList.remove('hint-bg');
        };
        this.leftContainerRef.addEventListener('mouseenter', showHint);
        this.leftContainerRef.addEventListener('mouseleave', hideHint);
        // Add click handler to leftContainerRef for URL diff restore
        this.leftContainerRef.addEventListener('click', (event) => {
            if (this.isUrlDiff) {
                // Update the tab to the original bookmarked URL
                chrome.tabs.update(this.tab.id, { url: this.bookmark.url }, (tab) => {
                    if (chrome.runtime.lastError) {
                        console.error('Failed to restore tab URL:', chrome.runtime.lastError.message);
                    }
                });
            }
        });
        return this.ref;
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
            this.urlDiffIndicatorRef.style.display = '';
        } else {
            this.urlDiffIndicatorRef.style.display = 'none';
            this.textContainerRef.classList.remove('hint-visible');
        }
    }

    removeTab() {
        this.setActive(false);
        this.setIsUrlDiff(false);
        this.tab = null;
    }

    changeBookmark(id, changeInfo) {
        this.updateTab(changeInfo);
        // Update the bookmark object
        Object.assign(this.bookmark, changeInfo);
    }

    setTab(tab) {
        this.tab = tab;
    }

    setActive(isActive) {
        if (isActive) {
            this.ref.classList.add('active');
        } else {
            this.ref.classList.remove('active');
        }
    }
}
