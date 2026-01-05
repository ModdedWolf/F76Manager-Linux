import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';
import { exec } from 'child_process';

// Managers
import { PathManager } from './managers/PathManager.js';
import { ConfigManager } from './managers/ConfigManager.js';
import { ModManager } from './managers/ModManager.js';
import { UpdateManager } from './managers/UpdateManager.js';
import { ConflictManager } from './managers/ConflictManager.js';
import { PipBoyRelay } from './managers/PipBoyRelay.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
const pathManager = new PathManager();
const logger = (msg) => console.log(`[STATE] ${msg}`);
const statusReporter = (type, text) => {
    if (mainWindow) {
        logger(`[MSG] ${type}: ${text}`);
        mainWindow.webContents.send('webview-reply', { type: 'STATUS', status: { type, text } });
    }
};

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const appVersion = pkg.version || '3.0.0';

const configManager = new ConfigManager(logger, statusReporter);
const modManager = new ModManager(configManager, logger, statusReporter);
const updateManager = new UpdateManager(appVersion, statusReporter, logger);
const conflictManager = new ConflictManager(logger);
const pipBoyRelay = new PipBoyRelay(logger);

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: '#121212',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: path.join(__dirname, 'www/assets/Icon-nobg.png')
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile(path.join(__dirname, 'www/index.html'));

    mainWindow.webContents.on('did-finish-load', () => {
        pipBoyRelay.start((data) => {
            if (mainWindow) {
                mainWindow.webContents.send('webview-reply', {
                    type: 'PIPBOY_DATA',
                    raw: data.toString('base64')
                });
            }
        });
        // Initial sync with small delay to ensure frontend is ready
        setTimeout(() => {
            sendDataToWeb();
        }, 500);
    });

    mainWindow.on('closed', () => {
        pipBoyRelay.stop();
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handler
ipcMain.on('webview-message', async (event, message) => {
    logger(`[IPC] ${message.type}`);

    switch (message.type) {
        case 'GET_DATA':
            sendDataToWeb();
            break;

        case 'SWITCH_PLATFORM':
            const targetP = pathManager.currentPlatform === 'Steam' ? 'Xbox' : 'Steam';
            if (pathManager.setPlatform(targetP)) {
                sendDataToWeb();
                statusReporter('info', `Switched to ${targetP}`);
            }
            break;

        case 'BROWSE_FOLDER':
            handleBrowseFolder(message.target);
            break;

        case 'SAVE_MANAGER_SETTINGS':
            handleSaveManagerSettings(message.settings);
            break;

        case 'UPDATE_SETTING':
            handleUpdateSetting(message.key, message.value);
            break;

        case 'UPDATE_MOD_ORDER':
            modManager.updateModOrder(pathManager.getPaths(), message.order);
            sendDataToWeb();
            break;

        case 'SAVE_PIPBOY_COLORS':
            configManager.updateTweak(pathManager, 'Pipboy', 'fPipboySpecsColorR', (message.r / 255).toFixed(6));
            configManager.updateTweak(pathManager, 'Pipboy', 'fPipboySpecsColorG', (message.g / 255).toFixed(6));
            configManager.updateTweak(pathManager, 'Pipboy', 'fPipboySpecsColorB', (message.b / 255).toFixed(6));
            configManager.updateTweak(pathManager, 'Pipboy', 'bEnableCompanionApp', '1');
            configManager.updateTweak(pathManager, 'Pipboy', 'sCompanionAppPort', '27000');
            statusReporter('success', 'Pip-Boy settings synced & Live Connection enabled.');
            sendDataToWeb();
            break;

        case 'ADD_MOD':
            if (message.files && Array.isArray(message.files)) {
                modManager.importFiles(pathManager.getPaths(), message.files);
                sendDataToWeb();
            } else {
                handleImportMod('file');
            }
            break;

        case 'OPEN_FOLDER':
            handleImportMod('folder');
            break;

        case 'DEPLOY_MODS':
            if (message.mods) {
                modManager.updateModOrder(pathManager.getPaths(), message.mods);
                sendDataToWeb();
                statusReporter('success', `Deployed ${message.mods.length} mod(s) successfully!`);
            }
            break;

        case 'UPDATE_MOD_METADATA':
            if (message.originalName && message.metadata) {
                modManager.updateModMetadata(pathManager.getPaths(), message.originalName, message.metadata);
                sendDataToWeb();
            }
            break;

        case 'CHECK_FOR_UPDATES':
            updateManager.checkForUpdates()
                .then(update => {
                    if (update.available) {
                        statusReporter('info', `Update available: ${update.version}`);
                    } else {
                        statusReporter('info', 'Manager is up to date.');
                    }
                    mainWindow.webContents.send('webview-reply', {
                        type: 'UPDATE_RESULT',
                        available: update.available,
                        version: update.version,
                        remoteVersion: update.version,
                        localVersion: appVersion,
                        notes: update.notes,
                        url: update.url
                    });
                })
                .catch(err => {
                    logger(`[UPDATE] Error: ${err.message}`);
                    statusReporter('error', `Update check failed: ${err.message}`);
                });
            break;

        case 'CHECK_SERVER_STATUS':
            mainWindow.webContents.send('webview-reply', { type: 'SERVER_STATUS', online: true });
            break;

        case 'LAUNCH_GAME':
            handleLaunchGame();
            break;

        case 'PERFORM_UPDATE':
        case 'OPEN_IN_BROWSER':
            if (data.url) {
                shell.openExternal(data.url);
                statusReporter('info', 'Opening update download page in browser...');
            }
            break;

        case 'APPLY_CHANGES':
            configManager.applyAll(pathManager);
            statusReporter('success', 'INI changes applied and synced.');
            sendDataToWeb();
            break;

        case 'DEPLOY_ALL':
            {
                const modsSync = modManager.getModsList(pathManager.getPaths());
                const activeOnes = modsSync.filter(m => m.status === 'enabled').map(m => m.name);
                modManager.updateModOrder(pathManager.getPaths(), activeOnes);
                statusReporter('success', `Deployed ${activeOnes.length} mod(s) from your active list.`);
                sendDataToWeb();
            }
            break;

        case 'TEST_CONFIG':
            {
                const p = pathManager.getPaths();
                const gameValid = fs.existsSync(p.gamePath);
                const docsValid = fs.existsSync(p.documentsPath);
                if (gameValid && docsValid) {
                    statusReporter('success', 'Configuration check passed! Paths are valid.');
                } else {
                    const fail = !gameValid ? 'Game Path' : 'Documents Path';
                    statusReporter('error', `Integrity check failed: ${fail} is invalid.`);
                }
            }
            break;

        case 'OPEN_IN_BROWSER':
            if (message.url) shell.openExternal(message.url);
            break;

        case 'NAVIGATE_TO':
            global.lastSection = message.section;
            break;
    }
});

async function handleImportMod(type) {
    if (!mainWindow) return;

    const options = type === 'folder' ? {
        title: 'Select Folder to Import Mods',
        properties: ['openDirectory'],
        buttonLabel: 'Import Folder'
    } : {
        title: 'Select Mod Files (.ba2, .esm, .esp)',
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Fallout 76 Mods', extensions: ['ba2', 'esm', 'esp', 'strings'] }],
        buttonLabel: 'Import Mod(s)'
    };

    const result = await dialog.showOpenDialog(mainWindow, options);
    if (!result.canceled && result.filePaths.length > 0) {
        if (type === 'folder') {
            modManager.importFolder(pathManager.getPaths(), result.filePaths[0]);
        } else {
            modManager.importFiles(pathManager.getPaths(), result.filePaths);
        }
        sendDataToWeb();
    }
}

function sendDataToWeb() {
    if (!mainWindow) return;

    const state = pathManager.getState();
    const paths = state.paths;

    // Build mod lists
    const mods = modManager.getModsList(paths);
    const enabledModPaths = mods.filter(m => m.status === 'enabled').map(m => path.join(paths.gamePath, 'Data', m.relativePath));
    const conflicts = conflictManager.detectConflicts(enabledModPaths, path.join(paths.gamePath, 'Data'));

    const data = {
        type: 'DATA_SYNC',
        version: `${appVersion}-linux`,
        platform: state.currentPlatform,
        gamePath: paths.gamePath,
        documentsPath: paths.documentsPath,
        lastSection: global.lastSection || 'dashboard',
        mods: mods,
        conflicts: conflicts,
        profiles: ["Default Profile"],
        activeProfile: "Default Profile",
        settings: state.settings,
        status: { type: 'online', text: 'Backend Synced' }, // Added status fix
        stats: {
            modsActive: mods.filter(m => m.status === 'enabled').length,
            diskUsage: 'N/A',
            lastLaunch: 'Recent',
            conflicts: conflicts.length
        },
        managerSettings: {
            ...state.managerSettings,
            ...paths,
            syncPlatforms: state.syncPlatforms
        }
    };

    mainWindow.webContents.send('webview-reply', data);
}

async function handleBrowseFolder(target) {
    if (!mainWindow) return;

    logger(`[BROWSE] Request for ${target}`);

    // Safety focus - Bazzite/KDE sometimes loses focus on the main window
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true);
    setTimeout(() => { if (mainWindow) mainWindow.setAlwaysOnTop(false); }, 1000);

    const titles = {
        game: 'Select Fallout 76 Game Folder',
        docs: 'Select Fallout 76 Documents Folder',
        localAppData: 'Select Fallout 76 AppData/Local Folder',
        strings: 'Select Data/Strings Folder'
    };

    try {
        const options = {
            title: titles[target] || 'Select Folder',
            properties: ['openDirectory', 'dontAddToRecent', 'createDirectory'],
            buttonLabel: 'Select Folder',
            defaultPath: pathManager.getPaths().gamePath || os.homedir()
        };

        const result = await dialog.showOpenDialog(mainWindow, options);

        if (!result.canceled && result.filePaths.length > 0) {
            const selected = result.filePaths[0];
            logger(`[BROWSE] User selected: ${selected} for ${target}`);

            if (target === 'game') pathManager.setGamePath(selected);
            else if (target === 'docs') pathManager.setDocumentsPath(selected);
            else if (target === 'localAppData') pathManager.setLocalAppDataPath(selected);
            else if (target === 'strings') pathManager.setStringsPath(selected);

            sendDataToWeb();
            statusReporter('success', `Updated ${target} path.`);
        }
    } catch (err) {
        logger(`[BROWSE] Dialog error: ${err.message}`);
        statusReporter('error', `Failed to open dialog: ${err.message}`);
    }
}

async function handleSaveManagerSettings(settings) {
    if (!settings) return;

    pathManager.managerSettings = {
        autoUpdates: settings.autoUpdates,
        minimizeToTray: settings.minimizeToTray,
        uiAnimations: settings.uiAnimations
    };
    pathManager.setSync(settings.syncPlatforms);

    // Sanitize and update paths
    const sanitize = (val) => {
        if (!val || val === 'Not set' || val === 'undefined') return null;
        return val.trim();
    };

    const gPath = sanitize(settings.gamePath);
    const dPath = sanitize(settings.documentsPath);
    const lPath = sanitize(settings.localAppDataPath);
    const sPath = sanitize(settings.stringsPath);

    if (gPath) pathManager.setGamePath(gPath);
    if (dPath) pathManager.setDocumentsPath(dPath);
    if (lPath) pathManager.setLocalAppDataPath(lPath);
    if (sPath) pathManager.setStringsPath(sPath);

    pathManager.saveSettings();
    sendDataToWeb();
    statusReporter('success', 'Manager settings saved.');
}

async function handleUpdateSetting(key, value) {
    // 1. Update persisted state for current/sync platform
    pathManager.updateSetting(key, value);

    // 2. Apply to INI files
    configManager.applyTweak(pathManager, key, value);

    sendDataToWeb();
}

function handleLaunchGame() {
    const paths = pathManager.getPaths();
    if (paths.platform === 'Steam') {
        statusReporter('info', 'Launching via Steam...');
        exec('xdg-open steam://rungameid/1151340', (err) => {
            if (err) logger(`[LAUNCH] Steam URI failed: ${err.message}`);
        });
    } else {
        // Default to folder opening if launcher URI is unknown for the set path
        statusReporter('info', 'Launching via Launcher...');
        shell.openPath(paths.gamePath);
    }
}
