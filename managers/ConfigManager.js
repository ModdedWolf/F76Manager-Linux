import fs from 'fs';
import path from 'path';

export class ConfigManager {
    constructor(logger, statusReporter) {
        this.logger = logger || (() => { });
        this.statusReporter = statusReporter || (() => { });
    }

    applyAll(pathManager) {
        const state = pathManager.getState();
        const settings = state.settings;
        for (const [key, value] of Object.entries(settings)) {
            this.applyTweak(pathManager, key, value);
        }
    }

    // New version that supports syncing to the other platform
    updateTweak(pathManager, section, key, value) {
        const state = pathManager.getState();
        const paths = state.paths;

        // Apply to CURRENT platform
        this.updateBothInis(paths, section, key, value);

        // SYNC logic: If enabled, write to the OTHER platform if its paths are known
        if (state.syncPlatforms) {
            const otherPlatform = state.currentPlatform === 'Steam' ? 'Xbox' : 'Steam';
            const otherPaths = pathManager[otherPlatform.toLowerCase()].paths;

            if (otherPaths.documentsPath) {
                const otherDerived = {
                    customIniPath: path.join(otherPaths.documentsPath, 'Fallout76Custom.ini'),
                    prefsIniPath: path.join(otherPaths.documentsPath, 'Fallout76Prefs.ini'),
                    documentsPath: otherPaths.documentsPath
                };
                this.log(`[SYNC] Updating ${otherPlatform} INIs as well.`);
                this.updateBothInis(otherDerived, section, key, value);
            }
        }
    }

    updateBothInis(paths, section, key, value) {
        if (!paths.documentsPath || !fs.existsSync(paths.documentsPath)) return;

        this.updateSingleIni(paths.customIniPath, section, key, value);
        this.updateSingleIni(paths.prefsIniPath, section, key, value);
    }

    updateSingleIni(filePath, section, key, value) {
        try {
            let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
            if (content.includes('\r\n')) content = content.replace(/\r\n/g, '\n');
            let lines = content.split('\n');

            this.updateIniKey(lines, section, key, value);

            fs.writeFileSync(filePath, lines.join('\n'), { encoding: 'utf8' });
        } catch (err) {
            this.error(`Failed to update INI ${path.basename(filePath)}: ${err.message}`);
        }
    }

    updateIniKey(lines, section, key, value) {
        let sectionIndex = -1;
        let foundKey = false;
        const sectionHeader = `[${section}]`.toLowerCase();

        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim().toLowerCase();
            if (trimmed === sectionHeader) {
                sectionIndex = i;
            } else if (sectionIndex !== -1 && trimmed.startsWith('[') && trimmed.endsWith(']')) {
                // Next section reached, insert if not found
                if (!foundKey) {
                    lines.splice(i, 0, `${key}=${value}`);
                    foundKey = true;
                }
                break;
            } else if (sectionIndex !== -1 && !foundKey) {
                const parts = lines[i].split('=');
                if (parts.length >= 1 && parts[0].trim().toLowerCase() === key.toLowerCase()) {
                    lines[i] = `${key}=${value}`;
                    foundKey = true;
                }
            }
        }

        if (sectionIndex === -1) {
            if (lines.length > 0 && lines[lines.length - 1].trim() !== '') lines.push('');
            lines.push(`[${section}]`);
            lines.push(`${key}=${value}`);
        } else if (!foundKey) {
            // Section existed but key didn't. Append to end of section (we'll just append to file for simplicity like C#)
            lines.push(`${key}=${value}`);
        }
    }

    log(msg) {
        this.logger(msg);
        console.log(`[ConfigManager] ${msg}`);
    }

    error(msg) {
        this.statusReporter('error', msg);
        console.error(`[ConfigManager] ERROR: ${msg}`);
    }

    getTweakMapping(id) {
        const mappings = {
            'godrays': { section: 'Display', key: 'bVolumetricLightingEnabled' },
            'grass': { section: 'Grass', key: 'bAllowCreateGrass' },
            'shadows': { section: 'Display', key: 'iShadowMapResolution' },
            'fov': { section: 'Display', key: 'fDefaultWorldFOV' },
            'dof': { section: 'Display', key: 'bDoDepthOfField' },
            'taa': { section: 'Display', key: 'sAntiAliasing' },
            'ping': { section: 'General', key: 'bNetworkOptimization' },
            'bandwidth': { section: 'General', key: 'bUncapBandwidth' }
        };
        return mappings[id];
    }

    applyTweak(pathManager, id, value) {
        const map = this.getTweakMapping(id);
        if (map) {
            let val = value;
            if (typeof value === 'boolean') val = value ? '1' : '0';

            if (id === 'fov') {
                this.updateTweak(pathManager, map.section, 'fDefaultWorldFOV', val);
                this.updateTweak(pathManager, map.section, 'fDefault1stPersonFOV', val);
            } else {
                this.updateTweak(pathManager, map.section, map.key, val);
            }
            return true;
        }
        return false;
    }

    getValue(paths, id) {
        const map = this.getTweakMapping(id);
        if (!map || !fs.existsSync(paths.prefsIniPath)) return null;

        let val = this.readIniKey(paths.prefsIniPath, map.section, map.key);
        if (fs.existsSync(paths.customIniPath)) {
            const customVal = this.readIniKey(paths.customIniPath, map.section, map.key);
            if (customVal !== null) val = customVal;
        }
        return val;
    }

    readIniKey(filePath, section, key) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split(/\r?\n/);
            let inSection = false;
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.toLowerCase() === `[${section.toLowerCase()}]`) inSection = true;
                else if (inSection && trimmed.startsWith('[')) inSection = false;
                else if (inSection) {
                    const parts = trimmed.split('=');
                    if (parts.length >= 2 && parts[0].trim().toLowerCase() === key.toLowerCase()) return parts[1].trim();
                }
            }
        } catch (e) { }
        return null;
    }
}
