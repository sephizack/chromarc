import { NanoReact, h } from "../nanoreact.js"
import { SidePanel } from "./side_panel.js";
import { chrome } from 'jest-chrome'
import testutils from '../testutils.js'

let bookmarkTree = [
    {
        "dateAdded": 1755502777522,
        "id": "0",
        "syncing": false,
        "title": "",
        "children": [
            {
                "dateAdded": 1744272037590,
                "dateGroupModified": 1754497111986,
                "folderType": "bookmarks-bar",
                "id": "1",
                "index": 0,
                "parentId": "0",
                "syncing": false,
                "title": "Bookmarks bar",
                "children": [
                    {
                        "dateAdded": 1750803180998,
                        "dateGroupModified": 1755092715819,
                        "id": "2",
                        "index": 0,
                        "parentId": "1",
                        "syncing": false,
                        "title": "Folder 1",
                        "children": [
                            {
                                "dateAdded": 1755092715819,
                                "id": "3",
                                "index": 0,
                                "parentId": "2",
                                "syncing": false,
                                "title": "Folder 1 / Bookmark 1",
                                "url": "https://example.com/folder-1/bookmark-1"
                            }
                        ],
                    },
                    {
                        "dateAdded": 1755092719267,
                        "id": "4",
                        "index": 1,
                        "parentId": "1",
                        "syncing": false,
                        "title": "Bookmark 1",
                        "url": "https://example.com/bookmark-1"
                    }
                ],
            }
        ]
    }
];

/**
 * @type {SidePanel}
 */
let sidePanel = null;

beforeEach(() => {
    document.body.innerHTML = '';
    testutils.reset();
});

describe('SidePanel', () => {

    test('Rendering', async () => {
        await initializeSidePanel();
    });

    describe('Tab Management', () => {
        describe('Open new tab', () => {
            test('Basic', async () => {
                await initializeSidePanel();

                let newTab = testutils.newTab(3, "Tab 4");
                await testutils.asyncCallListeners(chrome.tabs.onCreated, newTab);

                expect(getTabIds()).toEqual(['new-tab', 'tab-4', 'tab-3', 'tab-2', 'tab-1']);
                expect(getActiveTabId()).toEqual('tab-1');
            });

            test('Active tab', async () => {
                await initializeSidePanel();

                let newTab = testutils.newTab(3, "Tab 4", true);
                await testutils.asyncCallListeners(chrome.tabs.onCreated, newTab);

                expect(getTabIds()).toEqual(['new-tab', 'tab-4', 'tab-3', 'tab-2', 'tab-1']);
                expect(getActiveTabId()).toEqual('tab-4');
            });
        });

        describe('Close tab', () => {
            test('Basic', async () => {
                await initializeSidePanel();

                await testutils.asyncCallListeners(chrome.tabs.onRemoved, 2);

                expect(getTabIds()).toEqual(['new-tab', 'tab-3', 'tab-1']);
                expect(getActiveTabId()).toEqual('tab-1');
            });
            test('Clear all', async () => {
                await initializeSidePanel();

                chrome.tabs.remove.mockImplementation(async (tabIds) => {
                    // check if tabIds is an array or a single number
                    let ids = Array.isArray(tabIds) ? tabIds : [tabIds];
                    // simulate onRemoved event for each tabId
                    for (let id of ids) {
                        await testutils.asyncCallListeners(chrome.tabs.onRemoved, id);
                    }
                });

                chrome.tabs.create.mockImplementation(async (_createProperties) => {
                    let newTab = testutils.newTab(99, "New Tab", true);
                    newTab.url = 'chrome://newtab/';
                    await testutils.asyncCallListeners(chrome.tabs.onCreated, newTab);
                });

                await sidePanel.clearTabsButton.onClick();

                expect(getTabIds()).toEqual(['new-tab']);
                expect(getActiveTabId()).toEqual('new-tab');
            });

        });

        describe('Update tab', () => {
            test('Title', async () => {
                await initializeSidePanel();
                let tabs = null;
                tabs[1].title = "Updated Tab 2";
                await testutils.asyncCallListeners(chrome.tabs.onUpdated, 2, { title: "Updated Tab 2" }, tabs[1]);

                expect(getTabIds()).toEqual(['new-tab', 'tab-3', 'tab-2', 'tab-1']);
            });
        });

    });
});

/**
 * Initializes the side panel for testing by mocking Chrome APIs and setting up test data.
 */
async function initializeSidePanel() {
    chrome.bookmarks.getTree.mockImplementation(() => bookmarkTree);
    chrome.runtime.getURL.mockImplementation((url) => {
        return `chrome-extension://your-extension-id/${url}`;
    });

    let tabs = [
        testutils.newTab(0, "Tab 1", true),
        testutils.newTab(1, "Tab 2"),
        testutils.newTab(2, "Tab 3"),
    ];
    chrome.tabs.query.mockImplementation((queryInfo) => {
        let res = tabs;
        if (queryInfo.active !== undefined) {
            res = res.filter(tab => tab.active === queryInfo.active);
        }
        return Promise.resolve(res);
    });

    sidePanel = h(SidePanel);

    document.body.appendChild(await NanoReact.render(sidePanel));

    expect(getBookmarkTree()).toEqual({
        id: 'bookmark-list',
        children: [
            {
                id: 'bookmark-folder-2',
                children: [
                    { id: 'bookmark-3' }
                ]
            },
            { id: 'bookmark-4' }
        ]
    });

    expect(getTabIds()).toEqual(['new-tab', 'tab-3', 'tab-2', 'tab-1']);
    expect(getActiveTabId()).toEqual('tab-1');
}

/**
 * Extracts the bookmark tree structure from the DOM for testing.
 * @returns {object} The bookmark tree structure with IDs and children.
 */
function getBookmarkTree() {
    const buildBookmarkTree = (id, ul) => {
        return {
            id: id,
            children: Array.from(ul.children).map(li => {
                let folder = li.querySelector('ul');
                return folder ?
                    buildBookmarkTree(li.attributes['id'].value, folder) :
                    { id: li.attributes['id'].value };
            })
        }
    }
    return buildBookmarkTree("bookmark-list", document.body.querySelector('#side_panel #bookmark-list'));
}

/**
 * Gets the IDs of all tab elements in the tab list.
 * @returns {string[]} Array of tab element IDs.
 */
function getTabIds() {
    return Array.from(document.body.querySelectorAll('#side_panel #tab-list li'))
        .map(e => e.attributes['id'].value);
}

/**
 * Gets the ID of the currently active tab element.
 * @returns {string} The ID of the active tab element.
 */
function getActiveTabId() {
    let actives = document.body.querySelectorAll('#side_panel #tab-list li.active');
    expect(actives.length).toBe(1);
    return actives[0].attributes['id'].value;
}
