const { ipcRenderer } = require('electron');

window.updateOnlineStatus = function () {
    ipcRenderer.send('online-status-changed', navigator.onLine);
};

window.addEventListener('online', window.updateOnlineStatus);
window.addEventListener('offline', window.updateOnlineStatus);

window.updateOnlineStatus();
