export class Settings {
    /**
     * Creates a new Settings instance with default values.
     */
    constructor() {
        this.tabExpirationMs = 6 * 60 * 60 * 1000; // Default is 6 hours
    }

    /**
     * Loads settings from Chrome storage and returns a Settings instance.
     * @returns {Promise<Settings>} A promise that resolves to a Settings instance.
     */
    static loadFromStorage() {
        return new Promise((resolve) => {
            let settings = new Settings();
            chrome.storage.local.get(['settings'], (result) => {
                Object.assign(settings, result.settings || {});
                resolve(settings);
            });
        });
    }

    /**
     * Saves the current settings to Chrome storage.
     * @returns {Promise<void>} A promise that resolves when the settings are saved.
     */
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