export class Settings {
    constructor() {
        this.tabExpirationMs = 6 * 60 * 60 * 1000; // Default is 6 hours
    }

    static loadFromStorage() {
        return new Promise((resolve) => {
            let settings = new Settings();
            chrome.storage.local.get(['settings'], (result) => {
                Object.assign(settings, result.settings || {});
                resolve(settings);
            });
        });
    }

    saveToStorage() {
        return new Promise((resolve) => {
            chrome.storage.local.set({ settings: this }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error saving options:', chrome.runtime.lastError.message);
                }
                resolve();
            });
        });
    }
}