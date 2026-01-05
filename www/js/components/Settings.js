export class Settings {
    render(data) {
        const ms = data ? (data.managerSettings || {}) : {};
        const gamePath = ms.gamePath || '';
        const docsPath = ms.documentsPath || '';
        const localAppDataPath = ms.localAppDataPath || '';
        const stringsPath = ms.stringsPath || '';
        const autoUpdates = ms.autoUpdates !== false; // Default true
        const minimizeToTray = ms.minimizeToTray === true; // Default false
        const uiAnimations = ms.uiAnimations !== false; // Default true

        return `
            <div class="settings-page animate-fade">
                <div class="section-header" style="margin-bottom: 12px; padding: 0;">
                    <div class="header-with-icon">
                        <i data-lucide="settings" class="primary-icon" style="width:24px; height:24px;"></i>
                        <div>
                            <h2 style="font-size: 1.2rem;">Manager Settings</h2>
                            <p class="text-muted" style="font-size: 0.8rem;">Configure your Fallout 76 Manager environment.</p>
                        </div>
                    </div>
                </div>

                <div class="settings-grid">
                    <!-- Paths Section -->
                    <div class="settings-card full-width">
                        <div class="card-header">
                            <i data-lucide="folder-tree"></i>
                            <span>Installation Paths</span>
                        </div>
                        <div class="card-body">
                            <div class="paths-grid">
                                <div class="setting-group">
                                    <label>Game Installation Path</label>
                                    <div class="path-input-group">
                                        <input type="text" value="${gamePath}" id="game-path-input" placeholder="Game EXE folder">
                                        <button class="icon-btn-sm browse-btn" data-target="game" title="Browse">
                                            <i data-lucide="folder-open"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="setting-group">
                                    <label>Documents / INI Path</label>
                                    <div class="path-input-group">
                                        <input type="text" value="${docsPath}" id="docs-path-input" placeholder="My Games folder">
                                        <button class="icon-btn-sm browse-btn" data-target="docs" title="Browse">
                                            <i data-lucide="folder-open"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="setting-group">
                                    <label>Local AppData (plugins.txt)</label>
                                    <div class="path-input-group">
                                        <input type="text" value="${localAppDataPath}" id="local-appdata-path-input" placeholder="Fallout76 AppData folder">
                                        <button class="icon-btn-sm browse-btn" data-target="localAppData" title="Browse">
                                            <i data-lucide="folder-open"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="setting-group">
                                    <label>Strings Mod Path</label>
                                    <div class="path-input-group">
                                        <input type="text" value="${stringsPath}" id="strings-path-input" placeholder="Data/Strings folder">
                                        <button class="icon-btn-sm browse-btn" data-target="strings" title="Browse">
                                            <i data-lucide="folder-open"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Preferences Section -->
                    <div class="settings-card full-width">
                        <div class="card-header">
                            <i data-lucide="layout"></i>
                            <span>Manager Preferences</span>
                        </div>
                        <div class="card-body">
                            <div class="preferences-row">
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <span class="setting-label">Auto Updates</span>
                                        <span class="setting-desc">Check on startup</span>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" id="auto-updates-toggle" ${autoUpdates ? 'checked' : ''}>
                                        <span class="slider"></span>
                                    </label>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <span class="setting-label">Minimize to Tray</span>
                                        <span class="setting-desc">Hide in tray</span>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" id="tray-toggle" ${minimizeToTray ? 'checked' : ''}>
                                        <span class="slider"></span>
                                    </label>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <span class="setting-label">UI Animations</span>
                                        <span class="setting-desc">Smooth effects</span>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" id="animations-toggle" ${uiAnimations ? 'checked' : ''}>
                                        <span class="slider"></span>
                                    </label>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <span class="setting-label">Sync Platforms</span>
                                        <span class="setting-desc">Apply edits to both</span>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" id="sync-platforms-toggle" ${ms.syncPlatforms ? 'checked' : ''}>
                                        <span class="slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Advanced Section -->
                    <div class="settings-card full-width">
                        <div class="card-header">
                            <i data-lucide="shield-alert"></i>
                            <span>Advanced & Maintenance</span>
                        </div>
                        <div class="card-body advanced-actions" style="padding-top: 8px; padding-bottom: 8px;">
                            <button class="btn secondary btn-slim">
                                <i data-lucide="copy"></i>
                                <span>Backup INIs</span>
                            </button>
                            <button class="btn secondary btn-slim" id="reset-config">
                                <i data-lucide="history"></i>
                                <span>Reset Config</span>
                            </button>
                            <button class="btn danger btn-slim">
                                <i data-lucide="trash-2"></i>
                                <span>Clear Cache</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="settings-footer">
                    <div class="app-info">
                        <span class="version-text">v${data && data.appVersion ? data.appVersion : '2.9.5'}</span>
                        <span class="author-text">Created for the Wastelanders</span>
                    </div>
                    <button class="btn primary" id="save-settings" style="padding: 8px 24px;">
                        <i data-lucide="save"></i>
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>
        `;
    }

    onMount() {
        // Handle Browse Buttons
        document.querySelectorAll('.browse-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-target');
                window.chrome.webview.postMessage({
                    type: 'BROWSE_FOLDER',
                    target: target
                });
            });
        });

        // Handle Save Button
        const saveBtn = document.getElementById('save-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const gamePath = document.getElementById('game-path-input').value;
                const docsPath = document.getElementById('docs-path-input').value;
                const localAppDataPath = document.getElementById('local-appdata-path-input').value;
                const stringsPath = document.getElementById('strings-path-input').value;
                const autoUpdates = document.getElementById('auto-updates-toggle').checked;
                const minimizeToTray = document.getElementById('tray-toggle').checked;
                const uiAnimations = document.getElementById('animations-toggle').checked;
                const syncPlatforms = document.getElementById('sync-platforms-toggle').checked;

                window.chrome.webview.postMessage({
                    type: 'SAVE_MANAGER_SETTINGS',
                    settings: {
                        gamePath: gamePath,
                        documentsPath: docsPath,
                        localAppDataPath: localAppDataPath,
                        stringsPath: stringsPath,
                        autoUpdates: autoUpdates,
                        minimizeToTray: minimizeToTray,
                        uiAnimations: uiAnimations,
                        syncPlatforms: syncPlatforms
                    }
                });
            });
        }

        // Advanced Buttons
        const backupBtn = document.querySelector('.advanced-actions button:nth-child(1)');
        if (backupBtn) backupBtn.addEventListener('click', () => window.chrome.webview.postMessage({ type: 'BACKUP_INI' }));

        const resetBtn = document.getElementById('reset-config');
        if (resetBtn) resetBtn.addEventListener('click', () => window.chrome.webview.postMessage({ type: 'RESET_CONFIG' }));

        const cacheBtn = document.querySelector('.advanced-actions button:nth-child(3)');
        if (cacheBtn) cacheBtn.addEventListener('click', () => window.chrome.webview.postMessage({ type: 'CLEAR_CACHE' }));
    }
}
