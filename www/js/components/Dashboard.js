import { QuickStats } from './QuickStats.js';
import { ConfigHealth } from './ConfigHealth.js';

export class Dashboard {
    constructor() {
        this.quickStats = new QuickStats();
        this.configHealth = new ConfigHealth();
    }

    render(data) {
        return `
            <div class="dashboard-page">
                <div class="hero-banner">
                    <img src="assets/fallout_hero_banner.png" alt="Hero Banner" class="hero-img">
                    <div class="hero-overlay">
                        <h1>Welcome back, Overseer.</h1>
                        <p>Appalachia is waiting. Your configuration is optimal.</p>
                    </div>
                </div>

                <div class="quick-actions-grid">
                    <button class="action-card primary" id="btn-play">
                        <i data-lucide="play"></i>
                        <div class="action-info">
                            <span class="action-title">Play Fallout 76</span>
                            <span class="action-desc">Launch the game with current mods</span>
                        </div>
                    </button>
                    <button class="action-card" id="btn-apply">
                        <i data-lucide="check-circle"></i>
                        <div class="action-info">
                            <span class="action-title">Apply Changes</span>
                            <span class="action-desc">Save and sync INI settings</span>
                        </div>
                    </button>
                    <button class="action-card" id="btn-deploy">
                        <i data-lucide="refresh-cw"></i>
                        <div class="action-info">
                            <span class="action-title">Deploy Mods</span>
                            <span class="action-desc">Update load order and BA2 files</span>
                        </div>
                    </button>
                    <button class="action-card" id="btn-test">
                        <i data-lucide="flask-conical"></i>
                        <div class="action-info">
                            <span class="action-title">Test Config</span>
                            <span class="action-desc">Run integrity check</span>
                        </div>
                    </button>
                </div>

                <div class="dashboard-widgets">
                    ${this.configHealth.render(data)}

                    <div class="widget">
                        <div class="widget-header">
                            <i data-lucide="info"></i>
                            <h3>What's New</h3>
                        </div>
                        <div class="widget-content">
                            <div class="changelog-item">
                                <span class="version tag-new">v${data && data.lastRemoteVersion ? data.lastRemoteVersion : (data && data.appVersion ? data.appVersion : '2.5.0')}</span>
                                <div class="changelog-notes">
                                    ${data && data.lastRemoteNotes ?
                data.lastRemoteNotes.split('\n').filter(l => l.trim()).map(l => `<p>${l.trim()}</p>`).join('') :
                '<p>No new updates found.</p>'}
                                </div>
                            </div>
                        </div>
                        <a href="#update" class="widget-link">View full changelog</a>
                    </div>

                    ${this.quickStats.render(data)}
                </div>
            </div>
        `;
    }

    onMount() {
        const playBtn = document.getElementById('btn-play');
        const applyBtn = document.getElementById('btn-apply');
        const deployBtn = document.getElementById('btn-deploy');
        const testBtn = document.getElementById('btn-test');

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                window.chrome.webview.postMessage({ type: 'LAUNCH_GAME' });
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                window.chrome.webview.postMessage({ type: 'APPLY_CHANGES' });
            });
        }

        if (deployBtn) {
            deployBtn.addEventListener('click', () => {
                window.chrome.webview.postMessage({ type: 'DEPLOY_ALL' });
            });
        }

        if (testBtn) {
            testBtn.addEventListener('click', () => {
                window.chrome.webview.postMessage({ type: 'TEST_CONFIG' });
            });
        }
    }
}
