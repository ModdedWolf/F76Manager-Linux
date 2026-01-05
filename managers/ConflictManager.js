import fs from 'fs';
import path from 'path';

export class ConflictManager {
    constructor(logger) {
        this.logger = logger || (() => { });
    }

    detectConflicts(enabledMods, dataPath) {
        // Map: virtualFilePath -> [modNames]
        const fileMap = {};

        for (const modPath of enabledMods) {
            if (!fs.existsSync(modPath)) continue;

            const modName = path.basename(modPath);
            const filesInMod = this.getFilesInMod(modPath);

            for (const file of filesInMod) {
                const cleanFile = file.toLowerCase().replace(/\\/g, '/');
                if (!fileMap[cleanFile]) {
                    fileMap[cleanFile] = [];
                }
                fileMap[cleanFile].push(modName);
            }
        }

        const conflicts = [];
        for (const [filePath, modNames] of Object.entries(fileMap)) {
            if (modNames.length > 1) {
                conflicts.push({
                    filePath,
                    modNames
                });
            }
        }

        return conflicts;
    }

    getFilesInMod(modPath) {
        const results = [];
        try {
            const stat = fs.statSync(modPath);
            if (stat.isFile()) {
                const ext = path.extname(modPath).toLowerCase();
                if (ext === '.ba2') {
                    return this.parseBA2(modPath);
                } else if (['.esm', '.esp', '.strings', '.dlstrings', '.ilstrings'].includes(ext)) {
                    results.push(path.basename(modPath));
                }
            } else if (stat.isDirectory()) {
                return this.getAllFiles(modPath).map(f => path.relative(modPath, f));
            }
        } catch (err) {
            this.log(`Error identifying files in ${path.basename(modPath)}: ${err.message}`);
        }
        return results;
    }

    parseBA2(filePath) {
        const files = [];
        let fd;
        try {
            fd = fs.openSync(filePath, 'r');
            const header = Buffer.alloc(24);
            fs.readSync(fd, header, 0, 24, 0);

            // BTDX signature
            if (header.toString('ascii', 0, 4) !== 'BTDX') {
                return files;
            }

            const numFiles = header.readUInt32LE(12);
            const nameTableOffset = Number(header.readBigUInt64LE(16));

            if (numFiles === 0) return files;

            // Jump to NameTable
            let currentOffset = nameTableOffset;
            for (let i = 0; i < numFiles; i++) {
                const lenBuf = Buffer.alloc(2);
                fs.readSync(fd, lenBuf, 0, 2, currentOffset);
                const len = lenBuf.readUInt16LE(0);
                currentOffset += 2;

                const nameBuf = Buffer.alloc(len);
                fs.readSync(fd, nameBuf, 0, len, currentOffset);
                files.push(nameBuf.toString('utf8'));
                currentOffset += len;
            }
        } catch (err) {
            this.log(`Failed to parse BA2 ${path.basename(filePath)}: ${err.message}`);
        } finally {
            if (fd !== undefined) fs.closeSync(fd);
        }
        return files;
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

    log(msg) {
        this.logger(`[ConflictManager] ${msg}`);
    }
}
