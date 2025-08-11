'use strict';

import { TabList } from './components/TabList.js';
import { BookmarkList } from './components/BookmarkList.js';
import { NanoReact, h } from "../../nanoreact.js";
import { ContextMenu } from './ContextMenu.js';
import { BookmarkUtils } from './BookmarkUtils.js';


document.addEventListener('DOMContentLoaded', () => {
    document.getElementsByTagName("body")[0].appendChild(NanoReact.render(h(SidePanel)));
});

function ClearTabsButton() {
    return h('span', { id: 'clear-tabs', title: 'Close all open tabs' }, ['Clear']);
}

let isAlreadyClosedOnce = false;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.trace('Received message in side panel:', message);
    if (message === 'closeSidePanel') {
        if (isAlreadyClosedOnce) {
            chrome.sidePanel.setOptions({
                enabled: false,
            });
        } else {
            window.close();
            isAlreadyClosedOnce = true;
        }
        sendResponse("CLOSED");
    }
})

export class SidePanel extends NanoReact.Component {
    constructor() {
        super();
        this.tabs = new Map();
        this.activeTabId = null;
        this.menuItems = {};
    }

    render() {
        // Get active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                this.activeTabId = tabs[0].id;
            } else {
                console.error('No active tab found in the current window');
            }
        });

        // Tabs incremental updates
        chrome.tabs.onCreated.addListener(this.onTabCreated.bind(this));
        chrome.tabs.onRemoved.addListener(this.onTabRemoved.bind(this));
        chrome.tabs.onUpdated.addListener(this.onTabUpdated.bind(this));

        // Track active tab
        chrome.tabs.onActivated.addListener(this.onTabActivated.bind(this));

        // Context menu handling
        ContextMenu.init();

        BookmarkUtils.init();

        return h('div', { id: 'side_panel' }, [
            this.bookmarkList = h(BookmarkList,
                {
                    tabs: this.tabs,
                    onTabCreated: this.onTabCreated.bind(this),
                    bookmarkTab: this.bookmarkTab.bind(this),
                }),
            h('div', { class: 'section-divider-container' }, [
                h('hr', { class: 'section-divider' }, []),
                h(ClearTabsButton),
            ]),
            this.tabList = h(TabList,
                {
                    tabs: this.tabs,
                    bookmarkTab: this.bookmarkTab.bind(this),
                }
            ),
        ]);
    }

    componentDidMount() {
        // Load existing tabs
        chrome.tabs.query({}, (tabs) => {
            // Reverse addition to preserve order (because onTabCreated adds at the top)
            tabs.reverse().forEach(tab => {
                this.onTabCreated(tab);
            });
        });
    }

    setActiveTab(tabId) {
        console.trace(`setActiveTab`, tabId);
        if (!this.tabs.has(tabId)) {
            console.warn('Tab not found in tabs:', tabId);
            return;
        }
        if (tabId === this.activeTabId) {
            console.log('Already the active tab, ignoring');
            return;
        }
        if (this.activeTabId !== null) {
            console.log('Deactivating previous active tab:', this.activeTabId);
            this.tabs.get(this.activeTabId)?.setActive(false);
        }
        console.log('Setting active tab:', tabId);
        this.activeTabId = tabId;
        this.tabs.get(tabId).setActive(true);
    }

    onTabCreated(tab) {
        console.trace(`onTabCreated`, tab);
        if (this.bookmarkList.isTabBookmarked(tab)) {
            console.info('Tab is bookmarked, adding to bookmarks:', tab);
            this.bookmarkList.addBookmarkedTab(tab);
        } else {
            this.tabList.onTabCreated(tab);
        }
        // If the tab is active and was added (in case of sequential new tab we only had 1), set it as the active tab
        if (tab.active && this.tabs.has(tab.id)) {
            this.setActiveTab(tab.id);
        }
    }

    bookmarkTab(tab, parentId) {
        chrome.bookmarks.create({ title: tab.title, url: tab.url, parentId: parentId }, (bookmark) => {
            if (chrome.runtime.lastError) {
                console.error('Failed to bookmark tab:', chrome.runtime.lastError.message);
            } else {
                console.debug('Tab bookmarked:', bookmark);
                // Since the tab is now bookmarked, the simplest here is to remove and re-add the tab
                // onTabCreated will see that the tab is bookmarked and handle it accordingly
                this.onTabRemoved(tab.id);
                if (this.activeTabId === tab.id) {
                    // Reset active tab since it was removed
                    this.activeTabId = null;
                }
                this.onTabCreated(tab);
            }
        });
    }

    onTabRemoved(tabId) {
        this.tabList.onTabRemoved(tabId);
    }

    onTabUpdated(tabId, changeInfo, tab) {
        this.tabList.onTabUpdated(tabId, changeInfo, tab);
    }

    onTabActivated(activeInfo) {
        this.setActiveTab(activeInfo.tabId);
    }

}
