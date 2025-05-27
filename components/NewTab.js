
'use strict';

export class NewTab {
    constructor() {
    }

    render() {
        let shortcutLabel = crel('span', { class: 'tab-shortcut' },
            crel('kbd', {}, navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'),
            crel('kbd', {}, 'T')
        );
        this.ref = crel(
            'li',
            {
                class: 'tab-item',
                id: 'new-tab',
                tabIndex: 0, // Make accessible
                'aria-label': 'Open a new tab',
            },
            crel('span', {
                class: 'tab-favicon',
            }, '+'),
            crel('span', {
                class: 'tab-title',
            }, 'New Tab'),
            shortcutLabel
        );
        // Add click event to open a new tab
        this.ref.addEventListener('click', (e) => {
            console.log('New tab clicked');
            e.preventDefault();
            chrome.tabs.create({}, (tab) => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to create new tab:', chrome.runtime.lastError.message);
                }
            });
        });
        return this.ref;
    }

    update(changeInfo, tab) {
        console.warn('NewTab does not support updates');
    }

    setActive(isActive) {
        if (isActive) {
            this.ref.classList.add('active');
        } else {
            this.ref.classList.remove('active');
        }
    }
}
