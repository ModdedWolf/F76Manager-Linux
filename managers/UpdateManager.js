import https from 'https';

export class UpdateManager {
    constructor(currentVersion, statusReporter, logger) {
        this.statusReporter = statusReporter || (() => { });
        this.logger = logger || (() => { });
        this.currentVersion = currentVersion || '1.0.0';
    }

    async checkForUpdates(url) {
        // Default to the project's GitHub release API if no URL provided
        const targetUrl = url || 'https://api.github.com/repos/ModdedWolf/F76Manager-Linux/releases/latest';
        this.log(`Checking for updates at ${targetUrl}`);

        return new Promise((resolve, reject) => {
            try {
                const options = {
                    headers: { 'User-Agent': 'Fallout-76-Manager-Linux' }
                };

                https.get(targetUrl, options, (res) => {
                    if (res.statusCode === 404) {
                        this.log('Update check returned 404 (Repo likely has no public releases yet). Silencing.');
                        return resolve({ available: false });
                    }

                    if (res.statusCode !== 200) {
                        return reject(new Error(`Server returned ${res.statusCode}`));
                    }

                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            const remoteVersion = json.tag_name || json.version || '0.0.0';
                            const available = this.isNewerVersion(remoteVersion, this.currentVersion);

                            resolve({
                                available,
                                version: remoteVersion,
                                notes: json.body || json.notes || 'No release notes available.',
                                url: json.html_url || json.downloadUrl || ''
                            });
                        } catch (err) {
                            reject(new Error(`Failed to parse update data: ${err.message}`));
                        }
                    });
                }).on('error', (err) => {
                    this.log(`Network error: ${err.message}`);
                    reject(err);
                }).on('timeout', () => {
                    reject(new Error('Update check timed out'));
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    isNewerVersion(remote, local) {
        const r = remote.split('.').map(Number);
        const l = local.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (r[i] > l[i]) return true;
            if (r[i] < l[i]) return false;
        }
        return false;
    }

    log(msg) {
        this.logger(msg);
        console.log(`[UpdateManager] ${msg}`);
    }
}
