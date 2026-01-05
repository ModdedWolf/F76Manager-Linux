import fs from 'fs';
import path from 'path';

export class ModManager {
    constructor(configManager, logger, statusReporter) {
        this.configManager = configManager;
        this.logger = logger || (() => { });
        this.statusReporter = statusReporter || (() => { });
    }

    getModsList(paths) {
        try {
            const enabledArchives = this.getEnabledArchives(paths);
            const enabledPlugins = this.getEnabledPlugins(paths);
            const dataPath = path.join(paths.gamePath, 'Data');

            if (!fs.existsSync(dataPath)) {
                this.log(`Data folder not found at ${dataPath}`);
                return [];
            }

            if (!fs.existsSync(paths.stringsPath)) fs.mkdirSync(paths.stringsPath, { recursive: true });

            const searchExtensions = ['.ba2', '.esm', '.esp', '.strings', '.dlstrings', '.ilstrings'];
            const allFiles = this.getAllFiles(dataPath)
                .map(f => ({
                    path: f,
                    name: path.basename(f),
                    ext: path.extname(f).toLowerCase(),
                    relativePath: path.relative(dataPath, f)
                }))
                .filter(f => {
                    const cleanExt = f.ext === '.disabled' ? path.extname(path.basename(f, '.disabled')).toLowerCase() : f.ext;
                    return searchExtensions.includes(cleanExt) || f.ext === '.disabled';
                })
                .filter(f => !f.name.toLowerCase().startsWith('seventysix - ') &&
                    f.name.toLowerCase() !== 'seventysix.ba2' &&
                    f.name.toLowerCase() !== 'seventysix.esm' &&
                    f.name.toLowerCase() !== 'nw.esm');

            const sortedList = [];

            for (const file of allFiles) {
                let status = 'disabled';
                let type = 'archive';
                let name = file.name;

                if (file.ext === '.ba2') {
                    type = 'archive';
                    if (enabledArchives.includes(file.name)) status = 'enabled';
                }
                else if (file.ext === '.esm' || file.ext === '.esp') {
                    type = 'plugin';
                    if (enabledPlugins.includes(file.name)) status = 'enabled';
                }
                else if (file.ext === '.strings' || file.ext === '.dlstrings' || file.ext === '.ilstrings') {
                    type = 'strings';
                    status = 'enabled';
                }
                else if (file.ext === '.disabled') {
                    status = 'disabled';
                    name = path.basename(file.name, '.disabled');
                    const realExt = path.extname(name).toLowerCase();
                    if (realExt === '.esm' || realExt === '.esp') type = 'plugin';
                    else if (realExt === '.strings' || realExt === '.dlstrings' || realExt === '.ilstrings') type = 'strings';
                    else type = 'archive';
                }

                // Metadata Overlay
                const metadata = this.getMetadata(paths);
                let displayName = name;
                let author = 'Unknown';
                let version = '1.0';
                let tags = [];

                if (metadata[file.name]) {
                    const meta = metadata[file.name];
                    if (meta.alias) displayName = meta.alias;
                    if (meta.author) author = meta.author;
                    if (meta.version) version = meta.version;
                    if (meta.tags) tags = meta.tags;
                }

                sortedList.push({
                    name: displayName,
                    originalName: file.name,
                    status,
                    type,
                    relativePath: file.relativePath,
                    author,
                    version,
                    tags
                });
            }

            return sortedList.sort((a, b) => {
                if (a.status === 'enabled' && b.status !== 'enabled') return -1;
                if (a.status !== 'enabled' && b.status === 'enabled') return 1;
                return a.name.localeCompare(b.name);
            });
        } catch (err) {
            this.error(`Failed to list mods: ${err.message}`);
            return [];
        }
    }

    getEnabledArchives(paths) {
        if (!fs.existsSync(paths.customIniPath)) return [];
        const content = fs.readFileSync(paths.customIniPath, 'utf8');
        const line = content.split('\n').find(l => l.toLowerCase().startsWith('sresourcearchive2list='));
        if (line) {
            const parts = line.split('=');
            if (parts.length > 1) {
                return parts[1].split(',').map(m => m.trim()).filter(m => m.length > 0);
            }
        }
        return [];
    }

    getEnabledPlugins(paths) {
        if (!fs.existsSync(paths.pluginsFilePath)) return [];
        const content = fs.readFileSync(paths.pluginsFilePath, 'utf8');
        return content.split('\n')
            .map(l => l.trim())
            .filter(l => l.startsWith('*'))
            .map(l => l.substring(1).trim());
    }

    getAllFiles(dirPath, arrayOfFiles) {
        const files = fs.readdirSync(dirPath);
        arrayOfFiles = arrayOfFiles || [];

        files.forEach((file) => {
            if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                arrayOfFiles = this.getAllFiles(dirPath + "/" + file, arrayOfFiles);
            } else {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        });

        return arrayOfFiles;
    }

    importMod(paths, files) {
        this.importFiles(paths, files);
    }

    importFolder(paths, folderPath) {
        if (!fs.existsSync(folderPath)) return;
        const searchExtensions = ['.ba2', '.esm', '.esp', '.strings', '.dlstrings', '.ilstrings'];
        const files = this.getAllFiles(folderPath)
            .filter(f => searchExtensions.includes(path.extname(f).toLowerCase()));

        this.importFiles(paths, files);
    }

    importFiles(paths, files) {
        const dataPath = path.join(paths.gamePath, 'Data');
        let count = 0;
        for (const file of files) {
            try {
                const fileName = path.basename(file);
                const ext = path.extname(fileName).toLowerCase();
                let destPath = dataPath;

                if (['.strings', '.dlstrings', '.ilstrings'].includes(ext)) {
                    destPath = paths.stringsPath;
                    if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
                }

                fs.copyFileSync(file, path.join(destPath, fileName));
                this.log(`Imported mod: ${fileName}`);
                count++;
            } catch (err) {
                this.error(`Failed to import ${file}: ${err.message}`);
            }
        }
        this.statusReporter('success', `Imported ${count} mod(s).`);
    }

    deleteMod(paths, name) {
        const dataPath = path.join(paths.gamePath, 'Data');
        try {
            const allFiles = this.getAllFiles(dataPath);
            for (const f of allFiles) {
                const baseName = path.basename(f);
                if (baseName === name || baseName === name + '.disabled') {
                    fs.unlinkSync(f);
                    this.log(`Deleted mod file: ${f}`);
                }
            }
            this.removeModFromIni(paths, name);
            this.removeModFromPlugins(paths, name);
        } catch (err) {
            this.error(`Failed to delete mod: ${err.message}`);
        }
    }

    removeModFromIni(paths, modName) {
        if (!fs.existsSync(paths.customIniPath)) return;
        try {
            const archives = this.getEnabledArchives(paths);
            const newArchives = archives.filter(a => a.toLowerCase() !== modName.toLowerCase());

            if (newArchives.length !== archives.length) {
                this.configManager.updateBothInis(paths, 'Archive', 'sResourceArchive2List', newArchives.join(', '));
                this.log(`Removed ${modName} from INI archive list.`);
            }
        } catch (err) {
            this.error(`Failed to remove mod from INI: ${err.message}`);
        }
    }

    removeModFromPlugins(paths, modName) {
        try {
            if (fs.existsSync(paths.pluginsFilePath)) {
                const content = fs.readFileSync(paths.pluginsFilePath, 'utf8');
                const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                const newList = lines.filter(l => l.toLowerCase() !== modName.toLowerCase() && l.toLowerCase() !== '*' + modName.toLowerCase());

                if (newList.length !== lines.length) {
                    fs.writeFileSync(paths.pluginsFilePath, newList.join('\n'));
                    this.log(`Removed ${modName} from plugins.txt.`);
                }
            }
        } catch (err) {
            this.error(`Failed to remove mod from plugins: ${err.message}`);
        }
    }

    updateModOrder(paths, newOrder) {
        const archives = [];
        const plugins = [];
        const strings = [];

        for (const mod of newOrder) {
            const ext = path.extname(mod).toLowerCase();
            if (ext === '.ba2') archives.push(mod);
            else if (ext === '.esm' || ext === '.esp') plugins.push(mod);
            else if (['.strings', '.dlstrings', '.ilstrings'].includes(ext)) strings.push(mod);
        }

        // 1. Archives
        this.configManager.updateBothInis(paths, 'Archive', 'sResourceArchive2List', archives.join(', '));
        this.configManager.updateBothInis(paths, 'Archive', 'bInvalidateOlderFiles', '1');
        this.configManager.updateBothInis(paths, 'Archive', 'sResourceDataDirsFinal', '');

        // 2. Plugins
        this.updatePluginsTxt(paths, plugins);

        // 3. Strings
        this.updateStringMods(paths, strings);

        this.log(`Full deployment complete.`);
    }

    updatePluginsTxt(paths, enabledPlugins) {
        try {
            const dataPath = path.join(paths.gamePath, 'Data');
            const localAppData = path.dirname(paths.pluginsFilePath);
            if (!fs.existsSync(localAppData)) fs.mkdirSync(localAppData, { recursive: true });

            const allFiles = this.getAllFiles(dataPath);
            const allPlugins = allFiles
                .map(f => path.basename(f))
                .filter(n => {
                    const ext = path.extname(n).toLowerCase();
                    if (ext === '.disabled') {
                        const inner = path.extname(path.basename(n, '.disabled')).toLowerCase();
                        return inner === '.esm' || inner === '.esp';
                    }
                    return ext === '.esm' || ext === '.esp';
                })
                .map(n => n.endsWith('.disabled') ? path.basename(n, '.disabled') : n);

            const uniquePlugins = [...new Set(allPlugins)];
            const newLines = uniquePlugins.map(p => enabledPlugins.includes(p) ? '*' + p : p);

            fs.writeFileSync(paths.pluginsFilePath, newLines.join('\n'));
        } catch (err) {
            this.error(`Failed to update plugins.txt: ${err.message}`);
        }
    }

    updateStringMods(paths, enabledStrings) {
        try {
            const dataPath = path.join(paths.gamePath, 'Data');
            const stringExtensions = ['.strings', '.dlstrings', '.ilstrings'];
            const allFiles = this.getAllFiles(dataPath);

            for (const f of allFiles) {
                const name = path.basename(f);
                const ext = path.extname(f).toLowerCase();
                let cleanName = name;
                let isCurrentlyDisabled = false;

                if (ext === '.disabled') {
                    isCurrentlyDisabled = true;
                    cleanName = path.basename(name, '.disabled');
                }

                const innerExt = path.extname(cleanName).toLowerCase();
                if (!stringExtensions.includes(innerExt)) continue;

                const shouldBeEnabled = enabledStrings.includes(cleanName);

                if (shouldBeEnabled && isCurrentlyDisabled) {
                    const newPath = path.join(path.dirname(f), cleanName);
                    fs.renameSync(f, newPath);
                } else if (!shouldBeEnabled && !isCurrentlyDisabled) {
                    const newPath = f + '.disabled';
                    fs.renameSync(f, newPath);
                }
            }
        } catch (err) {
            this.error(`Failed to update string mods: ${err.message}`);
        }
    }

    log(msg) {
        this.logger(msg);
        console.log(`[ModManager] ${msg}`);
    }

    error(msg) {
        this.statusReporter('error', msg);
        console.error(`[ModManager] ERROR: ${msg}`);
    }

    getMetadata(paths) {
        if (!fs.existsSync(paths.metadataFile)) return {};
        try {
            return JSON.parse(fs.readFileSync(paths.metadataFile, 'utf8'));
        } catch (err) {
            this.log(`Failed to load metadata: ${err.message}`);
            return {};
        }
    }

    saveMetadata(paths, metadata) {
        try {
            fs.writeFileSync(paths.metadataFile, JSON.stringify(metadata, null, 2));
        } catch (err) {
            this.error(`Failed to save metadata: ${err.message}`);
        }
    }

    updateModMetadata(paths, originalName, data) {
        const metadata = this.getMetadata(paths);
        metadata[originalName] = data;
        this.saveMetadata(paths, metadata);
    }
}
