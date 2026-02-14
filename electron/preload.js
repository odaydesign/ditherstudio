const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    savePreset: (name, data) => ipcRenderer.invoke('save-preset', { name, data }),
    loadPreset: (name) => ipcRenderer.invoke('load-preset', name),
    getPresets: () => ipcRenderer.invoke('get-presets'),
    deletePreset: (id) => ipcRenderer.invoke('delete-preset', id),
});
