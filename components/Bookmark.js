'use strict';

import { getFaviconUrl } from '../icon_utils.js';

export class Bookmark {
    constructor(bookmark) {
        this.bookmark = bookmark;
        this.openedTab = null;
    }

    render() {
        this.imgRef = crel('img', {
            class: 'tab-favicon',
            src: getFaviconUrl(this.bookmark.url),
            onerror: function() { this.style.display = 'none'; }
        });
        // Indicator for URL difference
        this.urlDiffIndicator = crel('span', {
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
        this.textContainer = crel('div', { class: 'bookmark-text-container' }, this.titleRef, this.urlHintRef);
        // Left part container (favicon + indicator)
        this.leftContainer = crel('div', { class: 'bookmark-left' }, this.imgRef, this.urlDiffIndicator);
        this.ref = crel(
            'li',
            { class: 'bookmark-item', id: 'bookmark-' + this.bookmark.id },
            this.leftContainer,
            this.textContainer
        );
        this.ref.onclick = () => {
            if (this.openedTab) {
                console.log('Bookmark already opened in tab:', this.openedTab.id);
                chrome.tabs.update(this.openedTab.id, { active: true });
            } else {
                console.log('Opening bookmark in a new tab:', this.bookmark.id);
                chrome.tabs.create({ url: this.bookmark.url });
            }
        };
        // Show/hide hint on left part hover, using class for animation/position
        const showHint = () => {
            if (this.urlDiffIndicator.style.display !== 'none') {
                this.textContainer.classList.add('hint-visible');
                this.leftContainer.classList.add('hint-bg');
            }
        };
        const hideHint = () => {
            this.textContainer.classList.remove('hint-visible');
            this.leftContainer.classList.remove('hint-bg');
        };
        this.leftContainer.addEventListener('mouseenter', showHint);
        this.leftContainer.addEventListener('mouseleave', hideHint);
        return this.ref;
    }

    updateTab(changeInfo) {
        Object.assign(this.openedTab, changeInfo);
        if (changeInfo.title !== undefined) {
            this.titleRef.textContent = changeInfo.title || '';
            this.titleRef.title = changeInfo.title || '';
        }
        if (changeInfo.url !== undefined) {
            this.imgRef.src = getFaviconUrl(changeInfo.url);
            this.titleRef.title = changeInfo.url || '';
        }
        // Stylish indicator if tab URL differs from bookmark URL
        const tabUrl = this.openedTab.url || this.openedTab.pendingUrl;
        if (tabUrl !== this.bookmark.url) {
            this.urlDiffIndicator.style.display = '';
        } else {
            this.urlDiffIndicator.style.display = 'none';
            this.textContainer.classList.remove('hint-visible');
        }
    }

    changeBookmark(id, changeInfo) {
        this.updateTab(changeInfo);
        // Update the bookmark object
        Object.assign(this.bookmark, changeInfo);
    }

    setOpenedTab(tab) {
        this.openedTab = tab;
    }

    setActive(isActive) {
        if (isActive) {
            this.ref.classList.add('active');
        } else {
            this.ref.classList.remove('active');
        }
    }
}
