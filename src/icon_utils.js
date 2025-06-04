'use strict';

export function getFolderIconSVG() {
    return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h3.172a1.5 1.5 0 0 1 1.06.44l1.328 1.328A1.5 1.5 0 0 0 10.62 6H16a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 16H4A1.5 1.5 0 0 1 2.5 14.5v-9Z" stroke="#b0b3b8" stroke-width="1.5" fill="#23232a"/></svg>`;
}

export function getFaviconUrl(pageUrl) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        const url = new URL(chrome.runtime.getURL('/_favicon/'));
        url.searchParams.set('pageUrl', pageUrl); // this encodes the URL as well
        url.searchParams.set('size', '32');
        return url.toString();
    }
    // Fallback to Google's favicon service
    return 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(pageUrl);
}
