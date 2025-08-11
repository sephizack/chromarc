
export class BookmarkUtils {

    static bookmarkTree = null;

    static async init() {
        const refreshBookmarkTree = async () => {
            this.bookmarkTree = await chrome.bookmarks.getTree();
        };
        await refreshBookmarkTree();
        chrome.bookmarks.onCreated.addListener((id, bookmark) => refreshBookmarkTree());
        chrome.bookmarks.onRemoved.addListener((id) => refreshBookmarkTree());
        chrome.bookmarks.onChanged.addListener((id, changeInfo) => refreshBookmarkTree());
        chrome.bookmarks.onMoved.addListener((id, moveInfo) => refreshBookmarkTree());
    }

    static getTree() {
        if (!this.bookmarkTree) {
            throw new Error('BookmarkUtils is not initialized');
        }
        return this.bookmarkTree;
    }

    static getBar() {
        let bookmarkTreeNodes = this.getTree();
        if (!bookmarkTreeNodes || !bookmarkTreeNodes[0] || !bookmarkTreeNodes[0].children) {
            console.error('No bookmarks found or invalid structure');
            return;
        }
        // Chrome's bookmarks tree: [0] is root, children: [0]=Bookmarks Bar, [1]=Other Bookmarks, [2]=Mobile Bookmarks
        const nodes = bookmarkTreeNodes[0].children;
        // Find the Bookmarks Bar node (usually id '1' or title 'Bookmarks Bar')
        const bookmarkBar = nodes.find(
            node => node.id === '1' || node.title === 'Bookmarks Bar'
        );
        if (!bookmarkBar || !bookmarkBar.children) {
            console.error('Bookmarks Bar not found');
            return;
        }
        return bookmarkBar;
    }
}