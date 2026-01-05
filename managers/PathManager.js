import path from 'path';
import os from 'os';
import fs from 'fs';

export class PathManager {
    constructor() {
        this.home = os.homedir();
        // Base config paths
        this.configDir = path.join(this.home, '.config/f76manager');
        this.settingsFile = path.join(this.configDir, 'settings.json');
        this.profilesFile = path.join(this.configDir, 'profiles.json');
        this.metadataFile = path.join(this.configDir, 'mods_metadata.json');
        this.logDir = path.join(this.configDir, 'logs');

        this.ensureDirectories();

        // State - Dual Platform to match Windows 1:1
        this.currentPlatform = 'Steam'; // 'Steam' or 'Xbox'
        this.syncPlatforms = false;

        this.steam = {
            paths: { gamePath: '', documentsPath: '', localAppDataPath: '', stringsPath: '' },
            settings: this.getDefaultSettings()
        };

        this.xbox = {
            paths: { gamePath: '', documentsPath: '', localAppDataPath: '', stringsPath: '' },
            settings: this.getDefaultSettings()
        };

        // Manager Global Settings
        this.managerSettings = {
            autoUpdates: true,
            minimizeToTray: false,
            uiAnimations: true
        };

        // Load or auto-detect
        this.loadSettings();

        // If Steam paths are empty, try auto-detect (Linux defaults)
        if (!this.steam.paths.gamePath) {
            this.autoDetect();
            this.saveSettings();
        }
    }

    getDefaultSettings() {
        return {
            fov: 90,
            godrays: true,
            grass: true,
            shadows: 2048,
            dof: true,
            taa: 'TAA',
            ping: false,
            bandwidth: false
        };
    }

    ensureDirectories() {
        [this.configDir, this.logDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    loadSettings() {
        if (fs.existsSync(this.settingsFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.settingsFile, 'utf8'));

                if (data.currentPlatform) this.currentPlatform = data.currentPlatform;
                if (data.syncPlatforms !== undefined) this.syncPlatforms = data.syncPlatforms;

                // Load Steam
                if (data.steam) {
                    this.steam.paths = { ...this.steam.paths, ...data.steam.paths };
                    this.steam.settings = { ...this.steam.settings, ...data.steam.settings };
                }
                // Migration
                else if (data.gamePath) {
                    this.steam.paths.gamePath = data.gamePath;
                    this.steam.paths.documentsPath = data.documentsPath || '';
                }

                // Load Xbox
                if (data.xbox) {
                    this.xbox.paths = { ...this.xbox.paths, ...data.xbox.paths };
                    this.xbox.settings = { ...this.xbox.settings, ...data.xbox.settings };
                }

                if (data.managerSettings) {
                    this.managerSettings = { ...this.managerSettings, ...data.managerSettings };
                }

            } catch (err) {
                console.error("Failed to load settings:", err);
            }
        }
    }

    saveSettings() {
        const data = {
            currentPlatform: this.currentPlatform,
            syncPlatforms: this.syncPlatforms,
            steam: this.steam,
            xbox: this.xbox,
            managerSettings: this.managerSettings
        };
        try {
            fs.writeFileSync(this.settingsFile, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error("Failed to save settings:", err);
        }
    }

    // --- State Management ---

    setPlatform(platform) {
        if (platform === 'Steam' || platform === 'Xbox') {
            this.currentPlatform = platform;
            this.saveSettings();
            return true;
        }
        return false;
    }

    setSync(enabled) {
        this.syncPlatforms = enabled;
        this.saveSettings();
    }

    updateSetting(key, value) {
        const active = this.currentPlatform === 'Steam' ? this.steam : this.xbox;
        active.settings[key] = value;

        if (this.syncPlatforms) {
            const other = this.currentPlatform === 'Steam' ? this.xbox : this.steam;
            other.settings[key] = value;
        }
        this.saveSettings();
    }

    resolvePath(p) {
        if (!p) return '';
        if (p.startsWith('~')) {
            return path.join(this.home, p.slice(1));
        }
        return p;
    }

    setGamePath(newPath) {
        const active = this.currentPlatform === 'Steam' ? this.steam : this.xbox;
        active.paths.gamePath = this.resolvePath(newPath);
        this.saveSettings();
    }

    setDocumentsPath(newPath) {
        const active = this.currentPlatform === 'Steam' ? this.steam : this.xbox;
        active.paths.documentsPath = this.resolvePath(newPath);
        this.saveSettings();
    }

    setLocalAppDataPath(newPath) {
        const active = this.currentPlatform === 'Steam' ? this.steam : this.xbox;
        active.paths.localAppDataPath = this.resolvePath(newPath);
        this.saveSettings();
    }

    setStringsPath(newPath) {
        const active = this.currentPlatform === 'Steam' ? this.steam : this.xbox;
        active.paths.stringsPath = this.resolvePath(newPath);
        this.saveSettings();
    }

    // --- Getters ---

    getPaths() {
        const active = this.currentPlatform === 'Steam' ? this.steam : this.xbox;
        const p = active.paths;

        return {
            platform: this.currentPlatform,
            isXbox: this.currentPlatform === 'Xbox',
            gamePath: p.gamePath,
            documentsPath: p.documentsPath,
            localAppDataPath: p.localAppDataPath || p.documentsPath,
            pluginsFilePath: path.join(p.localAppDataPath || p.documentsPath || '', 'plugins.txt'),
            customIniPath: path.join(p.documentsPath || '', 'Fallout76Custom.ini'),
            prefsIniPath: path.join(p.documentsPath || '', 'Fallout76Prefs.ini'),
            stringsPath: p.stringsPath || (p.gamePath ? path.join(p.gamePath, 'Data/Strings') : ''),

            settingsFile: this.settingsFile,
            profilesFile: this.profilesFile,
            metadataFile: this.metadataFile,
            logFolder: this.logDir
        };
    }

    getState() {
        const active = this.currentPlatform === 'Steam' ? this.steam : this.xbox;
        return {
            currentPlatform: this.currentPlatform,
            syncPlatforms: this.syncPlatforms,
            paths: this.getPaths(),
            settings: active.settings,
            managerSettings: this.managerSettings
        };
    }

    autoDetect() {
        const possiblePaths = [
            path.join(this.home, '.local/share/Steam/steamapps'),
            path.join(this.home, '.steam/steam/steamapps'),
            path.join(this.home, '.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps'),
        ];

        // Search external drives/mounts (Bazzite/SteamOS)
        try {
            const mediaBase = '/run/media/' + os.userInfo().username;
            if (fs.existsSync(mediaBase)) {
                const drives = fs.readdirSync(mediaBase);
                for (const drive of drives) {
                    possiblePaths.push(path.join(mediaBase, drive, 'SteamLibrary/steamapps'));
                }
            }
        } catch (e) { }

        const appID = '1151340'; // Fallout 76 AppID

        for (const steamPath of possiblePaths) {
            const f76Path = path.join(steamPath, 'common/Fallout76');
            if (fs.existsSync(f76Path)) {
                this.steam.paths.gamePath = f76Path;
                this.steam.paths.documentsPath = path.join(steamPath, `compatdata/${appID}/pfx/drive_c/users/steamuser/Documents/My Games/Fallout 76`);
                this.steam.paths.localAppDataPath = path.join(steamPath, `compatdata/${appID}/pfx/drive_c/users/steamuser/AppData/Local/Fallout76`);
                console.log(`[PathManager] Auto-detected Steam F76 at: ${f76Path}`);
                break;
            }
        }
    }
}
