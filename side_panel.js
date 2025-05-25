
'use strict';

import { SidePanel } from './components/SidePanel.js';

// Initialize SidePanel on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const sidePanel = new SidePanel();
    sidePanel.render();
});
