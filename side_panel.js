// Fetch and display all open tabs

// Helper to create a tab DOM element
function createTabElement(tab) {
    const li = crel(
        'li',
        {
            class: 'tab-item' + (tab.active ? ' active' : '') + (tab.pinned ? ' pinned' : ''),
            id: 'tab-' + tab.id
        },
        crel('img', {
            class: 'tab-favicon',
            src: tab.favIconUrl,
            onerror: function() { this.style.display = 'none'; }
        }),
        crel('span', {
            class: 'tab-title',
            title: tab.url
        }, tab.title || tab.url),
        crel('button', {
            class: 'tab-close',
            onclick: (e) => {
                e.stopPropagation();
                chrome.tabs.remove(tab.id);
            }
        }, '\u00D7')
    );
    li.onclick = () => chrome.tabs.update(tab.id, {active: true});
    return li;
}

function renderTabsInitial() {
    chrome.tabs.query({}, function(tabs) {
        const tabList = document.getElementById('tab-list');
        tabList.innerHTML = '';
        tabs.forEach(tab => {
            tabList.appendChild(createTabElement(tab));
        });
    });
}

// Incremental tab updates
function addTab(tab) {
    const tabList = document.getElementById('tab-list');
    const li = createTabElement(tab);
    tabList.appendChild(li);
}

function updateTab(tabId, changeInfo, tab) {
    const li = document.getElementById('tab-' + tabId);
    if (li) {
        // See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated#changeinfo
        // Check if the tab title changed
        if (changeInfo.title !== undefined) {
            li.querySelector('.tab-title').textContent = tab.title || tab.url;
            li.querySelector('.tab-title').title = tab.url;
        }
        // Check if the tab favicon changed
        if (changeInfo.favIconUrl !== undefined) {
            const favicon = li.querySelector('.tab-favicon');
            favicon.src = tab.favIconUrl || 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(tab.url);
            favicon.style.display = favicon.src ? 'inline' : 'none';
        }
        // Check if the tab url changed
        if (changeInfo.url !== undefined) {
            li.querySelector('.tab-title').title = tab.url;
        }
    }
}

function removeTab(tabId) {
    const li = document.getElementById('tab-' + tabId);
    if (li) li.parentNode.removeChild(li);
}

// Helper to create a bookmark DOM element
function createBookmarkElement(node) {
    const li = crel(
        'li',
        { class: 'bookmark-item', id: 'bookmark-' + node.id },
        crel('img', {
            class: 'tab-favicon',
            src: 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(node.url),
            onerror: function() { this.style.display = 'none'; }
        }),
        crel('span', {
            class: 'tab-title',
            title: node.url
        }, node.title || node.url)
    );
    li.onclick = () => chrome.tabs.create({ url: node.url });
    return li;
}

function createBookmarkFolderElement(node) {
    const icon = crel('span', { class: 'folder-icon' });
    icon.innerHTML = getFolderIconSVG(false);
    const folderTitle = crel('span', { class: 'folder-title' }, node.title || 'Folder');
    const folderHeader = crel(
        'div',
        {
            class: 'bookmark-folder-header',
            style: 'display: flex; align-items: center;'
        },
        icon,
        folderTitle
    );
    const childrenUl = crel('ul', { class: 'bookmark-folder-children', style: 'display: none;' });
    if (node.children) {
        node.children.forEach(child => {
            if (child.url) {
                childrenUl.appendChild(createBookmarkElement(child));
            } else {
                childrenUl.appendChild(createBookmarkFolderElement(child));
            }
        });
    }
    const folderLi = crel(
        'li',
        { class: 'bookmark-folder', style: 'display: block;', id: 'bookmark-folder-' + node.id },
        folderHeader,
        childrenUl
    );
    folderHeader.onclick = function(e) {
        if (e.target === folderTitle || e.target === icon || e.target.closest('.folder-icon')) {
            e.stopPropagation();
            const isOpen = childrenUl.style.display !== 'none';
            if (!isOpen) {
                childrenUl.style.display = 'block';
            } else {
                childrenUl.style.display = 'none';
            }
        }
    };
    return folderLi;
}

function renderBookmarksInitial() {
    const bookmarkList = document.getElementById('bookmark-list');
    bookmarkList.innerHTML = '';
    chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
        if (!bookmarkTreeNodes || !bookmarkTreeNodes[0] || !bookmarkTreeNodes[0].children) return;
        const nodes = bookmarkTreeNodes[0].children;
        nodes.forEach(node => {
            if (node.url) {
                bookmarkList.appendChild(createBookmarkElement(node));
            } else {
                bookmarkList.appendChild(createBookmarkFolderElement(node));
            }
        });
    });
}

// Incremental bookmark updates
function addBookmark(id, bookmark) {
    const bookmarkList = document.getElementById('bookmark-list');
    if (bookmark.url) {
        bookmarkList.appendChild(createBookmarkElement(bookmark));
    } else {
        bookmarkList.appendChild(createBookmarkFolderElement(bookmark));
    }
}

function updateBookmark(id, changeInfo) {
    // Remove and re-add for simplicity
    const el = document.getElementById('bookmark-' + id) || document.getElementById('bookmark-folder-' + id);
    if (el) {
        if (changeInfo.title !== undefined) {
            el.querySelector('.tab-title').textContent = changeInfo.title || '';
            el.querySelector('.tab-title').title = changeInfo.title || '';
        }
        if (changeInfo.url !== undefined) {
            el.querySelector('.tab-favicon').src = 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(changeInfo.url);
            el.querySelector('.tab-title').title = changeInfo.url || '';
        }
    }
}

function removeBookmark(id) {
    const el = document.getElementById('bookmark-' + id) || document.getElementById('bookmark-folder-' + id);
    if (el) el.parentNode.removeChild(el);
}

// SVGs for closed and open folder icons
function getFolderIconSVG() {
    // Always return closed folder SVG
    return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h3.172a1.5 1.5 0 0 1 1.06.44l1.328 1.328A1.5 1.5 0 0 0 10.62 6H16a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 16H4A1.5 1.5 0 0 1 2.5 14.5v-9Z" stroke="#b0b3b8" stroke-width="1.5" fill="#23232a"/></svg>`;
}


function renderAll() {
    renderTabsInitial();
    renderBookmarksInitial();
}


document.addEventListener('DOMContentLoaded', renderAll);

// Tabs incremental updates
chrome.tabs.onCreated.addListener(tab => {
    addTab(tab);
});
chrome.tabs.onRemoved.addListener((tabId) => {
    removeTab(tabId);
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    updateTab(tabId, changeInfo, tab);
});

let activeTabId = null;
// Initialize activeTabId on load
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs && tabs.length > 0) {
        activeTabId = tabs[0].id;
    }
});

chrome.tabs.onActivated.addListener(activeInfo => {
    // Only update the class of the previously active and the new active tab
    const newActiveId = activeInfo.tabId;
    if (activeTabId !== null && activeTabId !== newActiveId) {
        const prevLi = document.getElementById('tab-' + activeTabId);
        if (prevLi) prevLi.classList.remove('active');
    }
    const newLi = document.getElementById('tab-' + newActiveId);
    if (newLi) newLi.classList.add('active');
    activeTabId = newActiveId;
});

// Bookmarks incremental updates
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
    addBookmark(id, bookmark);
});
chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
    removeBookmark(id);
});
chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
    updateBookmark(id, changeInfo);
});
chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
    updateBookmark(id, {});
});
