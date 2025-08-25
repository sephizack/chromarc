'use strict';

import { TabList } from './components/tab_list.js';
import { BookmarkList } from './components/bookmark_list.js';
import { NanoReact, h } from "../nanoreact.js";
import { ContextMenu } from './context_menu.js';
import { BookmarkUtils } from './bookmark_utils.js';


document.addEventListener('DOMContentLoaded', async () => {
    document.getElementsByTagName("body")[0].appendChild(await NanoReact.render(h(SidePanel)));
});

/**
 * Creates a clear tabs button component.
 * @returns {NanoReact.Element} The clear tabs button element.
 */
function ClearTabsButton() {
    return h('span', { id: 'clear-tabs', title: 'Close all open tabs' }, ['Clear']);
}


// export class ClearTabsButton extends NanoReact.Component {
//     constructor({ onClick }) {
//         super();
//         this.onClick = onClick;
//     }

//     async render() {
//         return h('span',
//             {
//                 id: 'clear-tabs',
//                 title: 'Close all open tabs',
//                 onClick: this.onClick
//             },
//             ['Clear']);
//     }
// }

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
    /**
     * Creates a new SidePanel instance.
     */
    constructor() {
        super();
        this.tabs = new Map();
        this.activeTabId = null;
        this.menuItems = {};
    }

    /**
     * Renders the side panel with bookmarks and tabs.
     * @returns {NanoReact.Element} The rendered side panel element.
     */
    async render() {
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

        await BookmarkUtils.init();

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
                // this.clearTabsButton = h(ClearTabsButton, {
                //     onClick: async () => {
                //         let ids = Array.from(this.tabs.keys()).filter(tabId => tabId !== 'new-tab');
                //         console.log('Closing tabs:', ids);
                //         await chrome.tabs.remove(ids);
                //     }
                // }),
            ]),
            this.tabList = h(TabList,
                {
                    tabs: this.tabs,
                    bookmarkTab: this.bookmarkTab.bind(this),
                }
            ),
        ]);
    }

    /**
     * Called after the component has been mounted. Loads existing tabs.
     */
    async componentDidMount() {
        // Load existing tabs
        const tabs = await chrome.tabs.query({});
        // Reverse addition to preserve order (because onTabCreated adds at the top)
        for (const tab of tabs) {
            await this.onTabCreated(tab);
        }
    }

    /**
     * Sets the active tab and updates the UI accordingly.
     * @param {number} tabId - The ID of the tab to set as active.
     */
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

    /**
     * Handles tab creation events from Chrome.
     * @param {chrome.tabs.Tab} tab - The newly created tab.
     */
    async onTabCreated(tab) {
        console.trace(`onTabCreated`, tab);
        if (this.bookmarkList.isTabBookmarked(tab)) {
            console.info('Tab is bookmarked, adding to bookmarks:', tab);
            this.bookmarkList.addBookmarkedTab(tab);
        } else {
            await this.tabList.onTabCreated(tab);
        }
        // If the tab is active and was added (in case of sequential new tab we only had 1), set it as the active tab
        if (tab.active && this.tabs.has(tab.id)) {
            this.setActiveTab(tab.id);
        }
    }

    /**
     * Bookmarks a tab and moves it to the bookmarks section.
     * @param {chrome.tabs.Tab} tab - The tab to bookmark.
     * @param {string} parentId - The ID of the bookmark folder to add the bookmark to.
     */
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

    /**
     * Handles tab removal events from Chrome.
     * @param {number} tabId - The ID of the removed tab.
     */
    onTabRemoved(tabId) {
        this.tabList.onTabRemoved(tabId);
    }

    /**
     * Handles tab update events from Chrome.
     * @param {number} tabId - The ID of the updated tab.
     * @param {chrome.tabs.TabChangeInfo} changeInfo - Information about what changed.
     * @param {chrome.tabs.Tab} tab - The updated tab object.
     */
    onTabUpdated(tabId, changeInfo, tab) {
        this.tabList.onTabUpdated(tabId, changeInfo, tab);
    }

    /**
     * Handles tab activation events from Chrome.
     * @param {chrome.tabs.TabActiveInfo} activeInfo - Information about the activated tab.
     */
    onTabActivated(activeInfo) {
        this.setActiveTab(activeInfo.tabId);
    }

}
