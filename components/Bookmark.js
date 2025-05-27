'use strict';

import { getFaviconUrl } from '../icon_utils.js';

export class Bookmark {
    constructor(bookmark) {
        this.bookmark = bookmark;
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
        this.ref.onclick = () => chrome.tabs.create({ url: this.bookmark.url });
        return this.ref;
    }

    update(changeInfo) {
        if (changeInfo.title !== undefined) {
            this.titleRef.textContent = changeInfo.title || '';
            this.titleRef.title = changeInfo.title || '';
        }
        if (changeInfo.url !== undefined) {
            this.imgRef.src = getFaviconUrl(changeInfo.url);
            this.titleRef.title = changeInfo.url || '';
        }
    }
}
