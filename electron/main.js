const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false, // Security best practice
            contextIsolation: true, // Security best practice
            preload: path.join(__dirname, 'preload.js'),
        },
        titleBarStyle: 'hiddenInset', // Mac-like native look
    });

    // ... existing dev/prod loading logic ...
    // Determine if we are in development or production
    const isDev = !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:3002/studio');
    } else {
        mainWindow.loadURL('http://localhost:3002/studio');
    }

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Preset Storage Logic
const getPresetsPath = () => {
    const userDataPath = app.getPath('userData');
    const presetsPath = path.join(userDataPath, 'presets');
    if (!fs.existsSync(presetsPath)) {
        fs.mkdirSync(presetsPath, { recursive: true });
    }
    return presetsPath;
};

ipcMain.handle('save-preset', async (event, { name, data }) => {
    try {
        const presetsPath = getPresetsPath();
        const id = `file-${Date.now()}`;
        const fileName = `${id}.json`;
        const filePath = path.join(presetsPath, fileName);

        const preset = {
            id,
            name,
            settings: data,
            createdAt: new Date().toISOString()
        };

        fs.writeFileSync(filePath, JSON.stringify(preset, null, 2));
        return { success: true, preset };
    } catch (error) {
        console.error('Failed to save preset:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-presets', async () => {
    try {
        const presetsPath = getPresetsPath();
        const files = fs.readdirSync(presetsPath);
        const presets = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
                try {
                    const content = fs.readFileSync(path.join(presetsPath, file), 'utf-8');
                    return JSON.parse(content);
                } catch (e) {
                    return null;
                }
            })
            .filter(p => p !== null)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return presets;
    } catch (error) {
        console.error('Failed to get presets:', error);
        return [];
    }
});

ipcMain.handle('delete-preset', async (event, id) => {
    try {
        const presetsPath = getPresetsPath();
        // ID in this file system implementation is essentially the filename prefix without extension if we strictly followed that, 
        // but for safety let's find the file with that ID in its content or filename.
        // Actually, we generated ID as `file-${Date.now()}` and saved as `${id}.json`.
        // So we can target the file directly.

        const filePath = path.join(presetsPath, `${id}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return { success: true };
        }
        return { success: false, error: 'File not found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});


app.on('ready', () => {
    if (process.platform === 'darwin') {
        // systemPreferences.askForMediaAccess('camera').then(...) 
    }
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
