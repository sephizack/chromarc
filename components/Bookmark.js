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
        this.titleRef = crel('span', {
            class: 'tab-title',
            title: this.bookmark.url
        }, this.bookmark.title || this.bookmark.url);
        this.ref = crel(
            'li',
            { class: 'bookmark-item', id: 'bookmark-' + this.bookmark.id },
            this.imgRef,
            this.titleRef
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
        return this.ref;
    }

    updateTab(changeInfo) {
        Object.assign(this.openedTab, changeInfo);
        if (changeInfo.title !== undefined) {
            this.titleRef.textContent = changeInfo.title || '';
            this.titleRef.title = changeInfo.title || '';
            const tabUrl = this.openedTab.url || this.openedTab.pendingUrl;
            if (tabUrl !== this.bookmark.url) {
                this.titleRef.textContent = "** " + this.titleRef.textContent;
                this.titleRef.title = "** " + this.titleRef.title;
            }
        }
        if (changeInfo.url !== undefined) {
            this.imgRef.src = getFaviconUrl(changeInfo.url);
            this.titleRef.title = changeInfo.url || '';
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
