
'use strict';
import { getFaviconUrl } from '../icon_utils.js';

export class Tab {
    constructor(tab) {
        this.tab = tab;
    }

    render({
        onDragStart,
        onDragOver,
        onDrop,
        onDragEnd
    } = {}) {
        // Use spinner as favicon if tab is loading
        const isLoading = this.tab.status === 'loading';
        let faviconUrl = isLoading
            ? '../assets/spinner.svg'
            : (this.tab.favIconUrl || getFaviconUrl(this.tab.url));
        this.faviconRef = crel('img', {
            class: 'tab-favicon',
            src: faviconUrl,
            onerror: function () { this.style.display = 'none'; }
        });

        this.titleRef = crel('span', {
            class: 'tab-title',
        }, this.tab.title || this.tab.url);

        this.closeButtonRef = this.renderCloseButton();
        this.closeButtonRef.style.display = 'none';

        this.ref = crel(
            'li',
            {
                class: 'tab-item' + (this.tab.active ? ' active' : '') + (this.tab.pinned ? ' pinned' : ''),
                id: 'tab-' + this.tab.id,
                draggable: true,
                title: this.tab.title || '',
                onclick: (e) => {
                    e.stopPropagation();
                    chrome.tabs.update(this.tab.id, { active: true });
                },
                ondragstart: (e) => {
                    if (onDragStart) onDragStart(e, this.tab.id);
                },
                ondragover: (e) => {
                    if (onDragOver) onDragOver(e, this.tab.id);
                },
                ondrop: (e) => {
                    if (onDrop) onDrop(e, this.tab.id);
                },
                ondragend: (e) => {
                    if (onDragEnd) onDragEnd(e, this.tab.id);
                },
                onmouseenter: () => {
                    this.closeButtonRef.style.display = '';
                    // this.setContextMenu(true);
                },
                onmouseleave: () => {
                    this.closeButtonRef.style.display = 'none';
                    // this.setContextMenu(false);
                }
            },
            this.faviconRef,
            this.titleRef,
            this.closeButtonRef
        );

        return this.ref;
    }

    renderCloseButton() {
        return crel('button', {
            class: 'tab-close',
            onclick: (e) => {
                e.stopPropagation();
                chrome.tabs.remove(this.tab.id);
            }
        }, '\u00D7');
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
        // Update title if changed
        Object.assign(this.tab, changeInfo);
        if (changeInfo.title !== undefined) {
            this.titleRef.textContent = this.tab.title || this.tab.url;
            this.titleRef.title = this.tab.url;
        }
        // Show spinner if loading, otherwise show favicon
        if (changeInfo.status !== undefined) {
            if (this.tab.status === 'loading') {
                this.faviconRef.src = '../assets/spinner.svg';
                this.faviconRef.style.display = 'inline';
            } else {
                this.faviconRef.src = this.tab.favIconUrl || getFaviconUrl(this.tab.url);
                this.faviconRef.style.display = 'inline';
            }
        } else if (changeInfo.favIconUrl !== undefined) {
            this.faviconRef.src = this.tab.favIconUrl;
            this.faviconRef.style.display = this.faviconRef.src ? 'inline' : 'none';
        }
        if (changeInfo.url !== undefined) {
            this.titleRef.title = this.tab.url;
        }
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
