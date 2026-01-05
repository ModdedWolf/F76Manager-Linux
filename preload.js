const { contextBridge, ipcRenderer } = require('electron');

// WebView2 Shim
// This allows the existing frontend code to work without modification
contextBridge.exposeInMainWorld('f76_ipc', {
    webview: {
        postMessage: (message) => {
            ipcRenderer.send('webview-message', message);
        },
        addEventListener: (type, callback) => {
            if (type === 'message') {
                ipcRenderer.on('webview-reply', (event, data) => {
                    callback({ data });
                });
            }
        },
        removeEventListener: (type, callback) => {
            // Basic cleanup
            ipcRenderer.removeAllListeners('webview-reply');
        }
    }
});

// Add a helper for native Node logic if needed later
contextBridge.exposeInMainWorld('linuxHost', {
    platform: process.platform,
    isLinux: true
});
