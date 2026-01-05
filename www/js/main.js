import { Dashboard } from './components/Dashboard.js';
import { ModsManager } from './components/ModsManager.js';
import { TweaksManager } from './components/TweaksManager.js';
import { PipBoy } from './components/PipBoy.js';
import { Profiles } from './components/Profiles.js';
import { Logs } from './components/Logs.js';
import { Settings } from './components/Settings.js';
import { Update } from './components/Update.js';
import { ModGroupsManager } from './components/ModGroupsManager.js';

export class App {
    constructor() {
        this.sections = {};
        this.currentSection = 'dashboard';
        this.sidebar = null;
        this.contentArea = null;
        this.notificationContainer = null;
        this.realData = null;
        this.modGroups = new ModGroupsManager(this);
        this.hasRenderedInitially = false;
    }

    init() {
        console.log("App initializing...");
        this.sidebar = document.getElementById('sidebar');
        this.contentArea = document.getElementById('content-area');
        this.notificationContainer = document.getElementById('notification-container');

        // Block DevTools Shortcuts
        document.addEventListener('keydown', (e) => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && e.key === 'U')
            ) {
                e.preventDefault();
                return false;
            }
        });

        // Global Drop Handler for Linux (Electron)
        if (window.chrome && window.chrome.webview && !window.chrome.webview.shim) {
            // Already handled by Webview2 interceptors on Windows
        } else {
            window.addEventListener('dragover', (e) => {
                if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                }
            });

            window.addEventListener('drop', (e) => {
                if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
                    if (this.currentSection !== 'mods') {
                        e.preventDefault();
                        return;
                    }
                    e.preventDefault();
                    // In Electron, file.path is available
                    const files = Array.from(e.dataTransfer.files).map(f => f.path).filter(p => p);
                    if (files.length > 0) {
                        window.chrome.webview.postMessage({
                            type: 'IMPORT_FILES',
                            files: files
                        });
                    }
                }
            });
        }

        if (!this.sidebar || !this.contentArea) {
            console.error("Critical UI elements not found!");
            return;
        }

        if (window.chrome && window.chrome.webview) {
            window.chrome.webview.addEventListener('message', (event) => {
                const data = event.data;
                if (data.type === 'UPDATE_RESULT' || data.type === 'UPDATE_ERROR') {
                    // Update Sidebar Glow
                    const updateNavItem = document.querySelector('[data-section="update"]');
                    if (updateNavItem) {
                        if (data.available) {
                            updateNavItem.classList.add('nav-item-glow');
                        } else {
                            updateNavItem.classList.remove('nav-item-glow');
                        }
                    }

                    if (this.currentSection === 'update' && this.sections['update']) {
                        if (data.type === 'UPDATE_ERROR') this.sections['update'].handleError(data.text);
                        else this.sections['update'].handleResult(data);
                    }
                    return;
                }

                if (data.type === 'SERVER_STATUS') {
                    const dot = document.querySelector('.status-dot');
                    const label = document.querySelector('.status-label');
                    if (dot && label) {
                        if (data.online) {
                            dot.classList.remove('offline', 'partial');
                            dot.classList.add('online');
                            label.innerText = 'Server: Online';
                        } else {
                            dot.classList.remove('online', 'partial');
                            dot.classList.add('offline');
                            label.innerText = 'Server: Offline';
                        }
                    }
                    return;
                }

                // Handle status messages (success/error)
                // START FIX: Improved routing for banners
                let statusObj = null;
                if (data.type === 'STATUS') {
                    statusObj = data.status;
                } else if (data.status && (data.status.type === 'success' || data.status.type === 'error' || data.status.type === 'info')) {
                    statusObj = data.status;
                }
                // END FIX

                if (statusObj) {
                    console.log('[UI] Showing banner:', statusObj);
                    this.showBanner(statusObj);
                    document.dispatchEvent(new CustomEvent('app-message', { detail: statusObj }));
                    if (data.type === 'STATUS') return; // Stop if it's just a status update
                }

                this.realData = data;
                if (data.modGroups) {
                    this.modGroups.setGroups(data.modGroups);
                }

                if (this.realData.managerSettings) {
                    const ms = this.realData.managerSettings;
                    // UI Animations
                    document.body.classList.toggle('no-animations', ms.uiAnimations === false);

                    // Auto Update (Only once on init)
                    if (!window.hasCheckedUpdates && ms.autoUpdates !== false) {
                        window.hasCheckedUpdates = true;
                        window.chrome.webview.postMessage({ type: 'CHECK_FOR_UPDATES' });
                    }
                }

                this.syncProfileDropdown();
                this.syncPlatformUI();

                // Intelligently navigate:
                let targetSection = this.currentSection;
                if (this.realData && this.realData.lastSection) {
                    targetSection = this.realData.lastSection;
                }

                // FIX: Only force re-render if sectional change occurred to avoid wiping user inputs
                // OR if this is the first render ever
                const shouldForce = targetSection !== this.currentSection || !this.hasRenderedInitially;
                this.navigateTo(targetSection, shouldForce, false, true);
                this.hasRenderedInitially = true;
            });

            window.chrome.webview.postMessage({ type: 'GET_DATA' });
            window.chrome.webview.postMessage({ type: 'CHECK_SERVER_STATUS' });
            setInterval(() => window.chrome.webview.postMessage({ type: 'CHECK_SERVER_STATUS' }), 60000);
        }

        const platformToggle = document.getElementById('platform-toggle');
        if (platformToggle) {
            platformToggle.addEventListener('click', () => {
                window.chrome.webview.postMessage({ type: 'SWITCH_PLATFORM' });
            });
        }

        const profileDropdown = document.getElementById('profile-dropdown');
        if (profileDropdown) {
            profileDropdown.addEventListener('change', (e) => {
                window.chrome.webview.postMessage({
                    type: 'SWITCH_PROFILE',
                    name: e.target.value
                });
            });
        }

        document.addEventListener('app-refresh-ui', () => {
            this.refreshCurrentSection();
        });

        // Initialize Navigation
        this.setupNavigation();
        // this.navigateTo(this.currentSection); // Moved to data listener or default fallback if needed
    }

    showBanner(status) {
        console.log('showBanner called with:', status, 'notificationContainer:', this.notificationContainer);
        if (!this.notificationContainer) return;

        const banner = document.createElement('div');
        banner.className = `status-banner ${status.type} animate-fade`;

        let icon = 'info';
        if (status.type === 'success') icon = 'check-circle';
        if (status.type === 'error') icon = 'alert-circle';

        banner.innerHTML = `
            <i data-lucide="${icon}"></i>
            <span>${status.text}</span>
            <button class="close-status">&times;</button>
        `;

        const closeBtn = banner.querySelector('.close-status');
        closeBtn.onclick = () => banner.remove();

        // Clear previous notifications to avoid clutter during rapid updates
        this.notificationContainer.innerHTML = '';
        this.notificationContainer.appendChild(banner);
        lucide.createIcons();

        // Auto-hide logic
        if (status.type === 'success') {
            setTimeout(() => {
                if (banner.parentElement) banner.remove();
            }, 5000);
        } else if (status.type === 'info') {
            // Info banners stay longer (20s) as they represent ongoing processes
            setTimeout(() => {
                if (banner.parentElement) banner.remove();
            }, 20000);
        }
    }

    setupNavigation() {
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                this.navigateTo(sectionId);
            });
        });

        const toggleBtn = document.getElementById('toggle-sidebar');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.sidebar.classList.toggle('collapsed');
            });
        }
    }

    navigateTo(sectionId, force = false, persist = true, keepNotifications = false) {
        if (!force && this.currentSection === sectionId && this.contentArea.innerHTML !== '' && !document.getElementById('mods-list')) return;

        this.currentSection = sectionId;

        // Clear any existing notifications on nav change, unless explicitly told to keep them
        if (this.notificationContainer && !keepNotifications) this.notificationContainer.innerHTML = '';

        // Persist navigation
        if (persist && window.chrome && window.chrome.webview) {
            window.chrome.webview.postMessage({ type: 'NAVIGATE_TO', section: sectionId });
        }

        document.querySelectorAll('[data-section]').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
        });

        const titleEl = document.getElementById('section-title');
        if (titleEl) {
            const label = sectionId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            titleEl.textContent = label;
        }

        const section = this.sections[sectionId];
        if (section) {
            this.contentArea.innerHTML = `<div class="section-content animate-fade">${section.render(this.realData)}</div>`;
            if (section.onMount) section.onMount(this.realData);
            lucide.createIcons();
        } else {
            this.contentArea.innerHTML = `
                <div class="empty-section" style="padding:48px; text-align:center; opacity:0.5;">
                    <i data-lucide="construct" style="width:64px; height:64px; margin-bottom:16px;"></i>
                    <h2>Section "${sectionId}" under development</h2>
                    <p>This module will be available in the next update.</p>
                </div>
            `;
            lucide.createIcons();
        }
    }

    refreshCurrentSection() {
        this.navigateTo(this.currentSection, true, false);
    }

    syncProfileDropdown() {
        const dropdown = document.getElementById('profile-dropdown');
        if (!dropdown || !this.realData || !this.realData.profiles) return;

        const profiles = this.realData.profiles;
        const active = this.realData.activeProfile;

        dropdown.innerHTML = profiles.map(p =>
            `<option value="${p}" ${p === active ? 'selected' : ''}>${p}</option>`
        ).join('');
    }

    syncPlatformUI() {
        const toggle = document.getElementById('platform-toggle');
        if (!toggle || !this.realData || !this.realData.platform) return;

        const platform = this.realData.platform;
        const span = toggle.querySelector('span');
        const icon = toggle.querySelector('i');

        toggle.className = `platform-badge ${platform.toLowerCase()}`;
        if (span) span.innerText = platform;

        if (icon) {
            icon.setAttribute('data-lucide', platform.toLowerCase() === 'xbox' ? 'box' : 'gamepad-2');
            if (window.lucide) lucide.createIcons();
        }
    }

    registerSection(id, component) {
        this.sections[id] = component;
    }
}

// Instantiate and start
window.app = new App();
window.app.registerSection('dashboard', new Dashboard());
window.app.registerSection('mods', new ModsManager(window.app.modGroups));
window.app.registerSection('tweaks', new TweaksManager());
window.app.registerSection('pipboy', new PipBoy());
window.app.registerSection('profiles', new Profiles());
window.app.registerSection('logs', new Logs());
window.app.registerSection('settings', new Settings());
window.app.registerSection('update', new Update());

document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
