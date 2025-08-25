export class ArcSidebarImporter {
    /**
     * Creates a new ArcSidebarImporter instance.
     * @param {object} sidebar - The sidebar data object from Arc export.
     */
    constructor(sidebar) {
        console.debug("ArcSidebarImporter initialized with sidebar:", sidebar);
        this.sidebar = sidebar;
        const container = sidebar.containers[1];
        this.spaces = this.convertFlatArrayToMap(container.spaces);
        this.items = this.convertFlatArrayToMap(container.items);
    }

    /**
     * Creates an ArcSidebarImporter from a file.
     * @param {File} file - The file containing Arc sidebar export data.
     * @returns {Promise<ArcSidebarImporter>} Promise that resolves to an ArcSidebarImporter instance.
     */
    static async fromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    console.debug("File content:", e.target.result);
                    const obj = JSON.parse(e.target.result);
                    console.debug("Parsed object:", obj);
                    resolve(new ArcSidebarImporter(obj.sidebar));
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    /**
     * Gets all spaces from the sidebar.
     * @returns {Array} Array of space objects.
     */
    getSpaces() {
        return Array.from(this.spaces.values());
    }

    /**
     * Visits a space and processes its folders and tabs.
     * @param {string} spaceId - The ID of the space to visit.
     * @param {Function} onFolder - Callback function for folder items.
     * @param {Function} onTab - Callback function for tab items.
     */
    async visitSpace(spaceId, onFolder, onTab) {
        const space = this.spaces.get(spaceId);
        if (!space) {
            console.warn("Space not found:", spaceId);
            return;
        }
        console.log('Visiting space:', space.title, space);

        const containerIds = this.convertFlatArrayToMap(space.containerIDs);
        let currentFolder = this.items.get(containerIds.get("pinned"));

        console.log(space.title);
        await this.visitItem(currentFolder, null, onFolder, onTab);
    }

    /**
     * Recursively visits an item and its children.
     * @param {object} item - The item to visit.
     * @param {object} parent - The parent item.
     * @param {Function} onFolder - Callback function for folder items.
     * @param {Function} onTab - Callback function for tab items.
     * @param {number} [depth] - Current depth in the tree.
     */
    async visitItem(item, parent, onFolder, onTab, depth = 0) {
        if (item.childrenIds.length > 0) {
            // --- Folder
            if (parent !== null) {
                console.log("|  ".repeat(depth) + "|-- " + item.title);
            }
            if (onFolder) {
                await onFolder(item, parent);
            }
            for (let childId of item.childrenIds) {
                let child = this.items.get(childId);
                if (child) {
                    await this.visitItem(child, item, onFolder, onTab, depth + 1);
                } else {
                    console.warn("Child not found:", childId);
                }
            }
        } else {
            // --- Tab
            if (onTab) {
                await onTab(item, parent);
            }
            console.log("|  ".repeat(depth) + "|-- " + (item.data?.tab?.savedTitle) + " (" + (item.data?.tab?.savedURL) + ")");
        }
    }

    /**
     * Converts a flat array to a Map.
     * @param {Array} array - The flat array to convert (alternating keys and values).
     * @returns {Map} The resulting Map.
     */
    convertFlatArrayToMap(array) {
        let map = new Map();
        for (let i = 0; i < array.length; i += 2) {
            map.set(array[i], array[i + 1]);
        }
        return map;
    }
}
