// Fetch and display all open tabs

function renderTabs() {
    chrome.tabs.query({}, function(tabs) {
        const tabList = document.getElementById('tab-list');
        tabList.innerHTML = '';
        tabs.forEach(tab => {
            const li = document.createElement('li');
            li.className = 'tab-item';
            if (tab.active) li.classList.add('active');
            if (tab.pinned) li.classList.add('pinned');

            // Favicon
            const favicon = document.createElement('img');
            favicon.className = 'tab-favicon';
            // favicon.src = tab.favIconUrl || 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(tab.url);
            favicon.src = tab.favIconUrl;
            favicon.onerror = function() { this.style.display = 'none'; };
            li.appendChild(favicon);

            // Title
            const title = document.createElement('span');
            title.className = 'tab-title';
            title.textContent = tab.title || tab.url;
            title.title = tab.url;
            li.appendChild(title);

            // Close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'tab-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                chrome.tabs.remove(tab.id);
            };
            li.appendChild(closeBtn);

            // Activate tab on click
            li.onclick = () => chrome.tabs.update(tab.id, {active: true});

            tabList.appendChild(li);
        });
    });
}



function renderBookmarks() {
    const bookmarkList = document.getElementById('bookmark-list');
    bookmarkList.innerHTML = '';

    // Render bookmarks and expandable/collapsible folders
    chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
        if (!bookmarkTreeNodes || !bookmarkTreeNodes[0] || !bookmarkTreeNodes[0].children) return;
        const nodes = bookmarkTreeNodes[0].children;
        function renderNodes(nodes, parentElement) {
            nodes.forEach(node => {
                console.log(node);
                if (node.url) {
                    // Bookmark item
                    const li = document.createElement('li');
                    li.className = 'bookmark-item';
                    // Favicon
                    const favicon = document.createElement('img');
                    favicon.className = 'tab-favicon';
                    favicon.src = 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(node.url);
                    favicon.onerror = function() { this.style.display = 'none'; };
                    li.appendChild(favicon);
                    // Title
                    const title = document.createElement('span');
                    title.className = 'tab-title';
                    title.textContent = node.title || node.url;
                    title.title = node.url;
                    li.appendChild(title);
                    // Open bookmark on click
                    li.onclick = () => chrome.tabs.create({ url: node.url });
                    parentElement.appendChild(li);
                } else if (node.children) {
                    // Folder item (expandable/collapsible)
                    const folderLi = document.createElement('li');
                    folderLi.className = 'bookmark-folder';
                    folderLi.style.display = 'block';
                    // Folder header (flex)
                    const folderHeader = document.createElement('div');
                    folderHeader.className = 'bookmark-folder-header';
                    folderHeader.style.display = 'flex';
                    folderHeader.style.alignItems = 'center';
                    // Folder icon (SVG, closed by default)
                    const icon = document.createElement('span');
                    icon.className = 'folder-icon';
                    icon.innerHTML = getFolderIconSVG(false);
                    folderHeader.appendChild(icon);
                    // Folder title
                    const folderTitle = document.createElement('span');
                    folderTitle.className = 'folder-title';
                    folderTitle.textContent = node.title || 'Folder';
                    folderHeader.appendChild(folderTitle);
                    folderLi.appendChild(folderHeader);
                    // Children container
                    const childrenUl = document.createElement('ul');
                    childrenUl.className = 'bookmark-folder-children';
                    childrenUl.style.display = 'none';
                    renderNodes(node.children, childrenUl);
                    folderLi.appendChild(childrenUl);
                    // Toggle expand/collapse, no animation, always closed folder icon
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
                    parentElement.appendChild(folderLi);
                }
// SVGs for closed and open folder icons
function getFolderIconSVG() {
    // Always return closed folder SVG
    return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h3.172a1.5 1.5 0 0 1 1.06.44l1.328 1.328A1.5 1.5 0 0 0 10.62 6H16a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 16H4A1.5 1.5 0 0 1 2.5 14.5v-9Z" stroke="#b0b3b8" stroke-width="1.5" fill="#23232a"/></svg>`;
}
            });
        }
        renderNodes(nodes, bookmarkList);
    });
}

function renderAll() {
    renderTabs();
    renderBookmarks();
}

document.addEventListener('DOMContentLoaded', renderAll);
chrome.tabs.onCreated.addListener(renderAll);
chrome.tabs.onRemoved.addListener(renderAll);
chrome.tabs.onUpdated.addListener(renderAll);
chrome.tabs.onActivated.addListener(renderAll);
