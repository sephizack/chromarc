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

document.addEventListener('DOMContentLoaded', renderTabs);
// Optionally, listen for tab changes and refresh
chrome.tabs.onCreated.addListener(renderTabs);
chrome.tabs.onRemoved.addListener(renderTabs);
chrome.tabs.onUpdated.addListener(renderTabs);
chrome.tabs.onActivated.addListener(renderTabs);
