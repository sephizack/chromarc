export class ContextMenu {

    static items = {};
    static pending = {};

    static init() {
        document.addEventListener('contextmenu', _ => this.build());
        chrome.contextMenus.onClicked.addListener(this.onClick.bind(this));
        // Ok so I don't know if it's an optim or a bug of Chrome.
        // But if the menu is created from scratch on contextmenu event, the extension icon is not displayed.
        // So we need to always keep at least one item in the menu, and at the beginning we create a fake item.
        this.addItem('fake', () => {});
        this.build();
    }

    static _addItem(item) {
        const id = (item.parentId || '') + item.title.toLowerCase().replace(/\s+/g, '-');
        if (this.items[id]) {
            console.error(`Context menu item with ID "${id}" already exists.`);
            return;
        }
        this.items[id] = {
            id: id,
            ...item
        };
        return id;
    }

    static addItem(title, onclick, parentId=undefined) {
        return this._addItem({
            title: title,
            onclick: onclick,
            parentId: parentId
        });
    }

    static addSubMenu(title, parentId=undefined) {
        return this._addItem({
            title: title,
            parentId: parentId,
        });
    }

    static build() {
        for (const id in this.items) {
            const item = this.items[id];
            if (this.pending[id]) {
                chrome.contextMenus.remove(id);
            }
            chrome.contextMenus.create({
                id: id,
                title: item.title,
                parentId: item.parentId || undefined,
                contexts: ['all'],
                documentUrlPatterns: [chrome.runtime.getURL('side_panel/side_panel.html')],
            });
        }
        // Remove old context menu items
        // We cannot do removeAll at the start because of the bug described in the init method
        for (const id in this.pending) {
            if (!this.items[id]) {
                chrome.contextMenus.remove(id);
            }
        }
        // Reset the items for the next menu, while still keeping the pending items
        this.pending = this.items;
        this.items = {};
    }

    static onClick(info, tab) {
        console.debug(this.pending);
        const item = this.pending[info.menuItemId];
        if (item) {
            item.onclick(info, tab);
        }
    }
}