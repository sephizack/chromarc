export class ArcSidebarImporter {
    constructor(sidebar) {
        console.debug("ArcSidebarImporter initialized with sidebar:", sidebar);
        this.sidebar = sidebar;
        const container = sidebar.containers[1];
        this.spaces = this.convertFlatArrayToMap(container.spaces);
        this.items = this.convertFlatArrayToMap(container.items);
    }

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

    getSpaces() {
        return Array.from(this.spaces.values());
    }

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

    convertFlatArrayToMap(array) {
        let map = new Map();
        for (let i = 0; i < array.length; i += 2) {
            map.set(array[i], array[i + 1]);
        }
        return map;
    }
}
