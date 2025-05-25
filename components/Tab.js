'use strict';

export class Tab {
    constructor(tab) {
        this.tab = tab;
    }

    render() {
        this.faviconRef = crel('img', {
            class: 'tab-favicon',
            src: this.tab.favIconUrl,
            onerror: function () { this.style.display = 'none'; }
        });

        this.titleRef = crel('span', {
            class: 'tab-title',
            title: this.tab.url
        }, this.tab.title || this.tab.url);

        this.closeButtonRef = crel('button', {
            class: 'tab-close',
            onclick: (e) => {
                e.stopPropagation();
                chrome.tabs.remove(this.tab.id);
            }
        }, '\u00D7');

        this.ref = crel(
            'li',
            {
                class: 'tab-item' + (this.tab.active ? ' active' : '') + (this.tab.pinned ? ' pinned' : ''),
                id: 'tab-' + this.tab.id,
                onclick: (e) => {
                    e.stopPropagation();
                    chrome.tabs.update(this.tab.id, { active: true });
                }
            },
            this.faviconRef,
            this.titleRef,
            this.closeButtonRef
        );

        return this.ref;
    }

    update(changeInfo, tab) {
        if (changeInfo.title !== undefined) {
            this.titleRef.textContent = tab.title || tab.url;
            this.titleRef.title = tab.url;
        }
        if (changeInfo.favIconUrl !== undefined) {
            this.faviconRef.src = tab.favIconUrl;
            this.faviconRef.style.display = this.faviconRef.src ? 'inline' : 'none';
        }
        if (changeInfo.url !== undefined) {
            this.titleRef.title = tab.url;
        }
    }

    setActive(isActive) {
        if (isActive) {
            this.ref.classList.add('active');
        } else {
            this.ref.classList.remove('active');
        }
    }
}
