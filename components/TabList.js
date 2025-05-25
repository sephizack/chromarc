'use strict';

import { Tab } from './Tab.js';

export class TabList {
    constructor() {
        this.tabs = new Map();
        this.activeTabId = null;
    }

    render() {
        this.ref = document.getElementById('tab-list')
        chrome.tabs.query({}, (tabs) => {
            this.ref.innerHTML = '';
            tabs.forEach(tab => {
                this.addTab(tab);
                if (tab.active) {
                    this.setActiveTab(tab.id);
                }
            });
        });
    }

    addTab(tab) {
        const tabComponent = new Tab(tab);
        this.ref.appendChild(tabComponent.render());
        this.tabs.set(tab.id, tabComponent);
    }

    updateTab(tabId, changeInfo, tab) {
        this.tabs.get(tabId).update(changeInfo, tab);
    }

    removeTab(tabId) {
        this.tabs.get(tabId).ref.remove();
        this.tabs.delete(tabId);
    }

    setActiveTab(tabId) {
        if (this.activeTabId !== null) {
            this.tabs.get(this.activeTabId)?.setActive(false);
        }
        this.activeTabId = tabId;
        this.tabs.get(tabId).setActive(true);
    }
}
