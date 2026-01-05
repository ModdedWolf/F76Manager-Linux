export class Update {
    constructor() {
        this.status = 'idle'; // idle, checking, available, uptodate, error
        this.data = null;
        this.isUpdating = false;
    }

    render(data) {
        let content = '';

        if (this.status === 'idle') {
            content = `
                <div class="update-card animate-fade">
                    <div class="update-header-gradient">
                        <div class="update-icon-wrapper">
                            <i data-lucide="refresh-cw" class="update-icon-large"></i>
                        </div>
                        <div class="update-info">
                            <span class="update-badge" style="background:var(--bg-surface-light); color:var(--text-muted)">System Ready</span>
                            <h3 class="update-version">v${data && data.appVersion ? data.appVersion : '2.4.0'}</h3>
                            <p class="update-subtitle">Current Version</p>
                        </div>
                    </div>
                    <div class="update-body">
                        <h4><i data-lucide="info"></i> Status</h4>
                        <div class="release-notes-container" style="text-align: center;">
                            <p>The update system is online and ready. Click below to check for the latest version.</p>
                        </div>
                    </div>
                    <div class="update-footer">
                        <button class="btn primary btn-block btn-lg" id="btn-check-update">
                            <i data-lucide="search"></i> Check For Updates
                        </button>
                    </div>
                </div>
            `;
        } else if (this.status === 'checking') {
            content = `
                <div class="update-card animate-fade">
                     <div class="update-header-gradient">
                        <div class="update-icon-wrapper">
                            <i data-lucide="loader-2" class="update-icon-large spin-anim"></i>
                        </div>
                        <div class="update-info">
                            <span class="update-badge" style="background:var(--accent-amber); color:#121212">Connecting</span>
                            <h3 class="update-version" style="font-size: 2rem;">Looking For Update...</h3>
                            <p class="update-subtitle">Contacting GitHub...</p>
                        </div>
                    </div>
                    <div class="update-body">
                        <div class="release-notes-container" style="text-align: center;">
                            <p>Please wait while we fetch the latest version information.</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (this.status === 'available' && this.data) {
            const btnText = this.isUpdating ? 'Processing...' : 'Install Update Now (One-Click)';
            const btnIcon = this.isUpdating ? 'loader-2' : 'zap';
            const btnClass = this.isUpdating ? 'spin-anim' : '';
            const btnDisabled = this.isUpdating ? 'disabled' : '';

            content = `
                <div class="update-card animate-fade">
                    <div class="update-header-gradient">
                        <div class="update-icon-wrapper">
                            <i data-lucide="zap" class="update-icon-large"></i>
                        </div>
                        <div class="update-info">
                            <span class="update-badge">New Update Available</span>
                            <h3 class="update-version">v${this.data.remoteVersion}</h3>
                            <p class="update-subtitle">You are currently running v${this.data.localVersion}</p>
                        </div>
                    </div>
                    <div class="update-body">
                        <h4><i data-lucide="file-text"></i> Release Notes</h4>
                        <div class="release-notes-container">
                            <p>${this.data.notes}</p>
                        </div>
                    </div>
                    <div class="update-footer" style="display: flex; flex-direction: column; gap: 10px;">
                        <button class="btn primary btn-block btn-lg" id="btn-perform-update" ${btnDisabled}>
                            <i data-lucide="${btnIcon}" class="${btnClass}"></i> ${btnText}
                        </button>
                        <button class="btn btn-secondary btn-block" id="btn-browser-update" style="opacity: 0.7; font-size: 0.85rem;" ${btnDisabled}>
                            <i data-lucide="external-link"></i> Download Manually in Browser
                        </button>
                    </div>
                </div>
            `;
        } else if (this.status === 'uptodate') {
            content = `
                <div class="update-card animate-fade">
                    <div class="update-header-gradient">
                        <div class="update-icon-wrapper">
                            <i data-lucide="check-circle" class="update-icon-large" style="color:var(--success-green)"></i>
                        </div>
                        <div class="update-info">
                            <span class="update-badge" style="background:var(--success-green); color:#121212">Latest Version</span>
                            <h3 class="update-version" style="font-size: 2rem;">Already on the latest version</h3>
                            <p class="update-subtitle">v${data && data.appVersion ? data.appVersion : '2.4.0'} installed</p>
                        </div>
                    </div>
                    <div class="update-body">
                        <div class="release-notes-container" style="text-align: center;">
                            <p>No new updates were found. Your application is fully up to date.</p>
                        </div>
                    </div>
                    <div class="update-footer">
                        <button class="btn btn-secondary btn-block btn-lg" id="btn-check-update">
                            <i data-lucide="refresh-cw"></i> Check Again
                        </button>
                    </div>
                </div>
            `;
        } else if (this.status === 'error') {
            content = `
                <div class="update-card animate-fade">
                     <div class="update-header-gradient">
                        <div class="update-icon-wrapper">
                            <i data-lucide="alert-triangle" class="update-icon-large" style="color:var(--danger-red)"></i>
                        </div>
                        <div class="update-info">
                            <span class="update-badge" style="background:var(--danger-red); color:white">Error</span>
                            <h3 class="update-version">Check Failed</h3>
                            <p class="update-subtitle">Unable to contact update server</p>
                        </div>
                    </div>
                    <div class="update-body">
                         <h4><i data-lucide="activity"></i> Error Details</h4>
                        <div class="release-notes-container">
                            <p style="color:var(--danger-red)">${this.data}</p>
                        </div>
                    </div>
                     <div class="update-footer" style="display: flex; flex-direction: column; gap: 10px;">
                        <button class="btn primary btn-block btn-lg" id="btn-browser-update">
                            <i data-lucide="external-link"></i> Download Manually in Browser
                        </button>
                        <button class="btn btn-secondary btn-block" id="btn-check-update">
                            <i data-lucide="refresh-cw"></i> Try Check Again
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="update-page">
                <div class="section-header">
                    <h2>Updates</h2>
                </div>
                ${content}
            </div>
        `;
    }

    onMount() {
        const checkBtn = document.getElementById('btn-check-update');
        if (checkBtn) {
            checkBtn.addEventListener('click', () => {
                this.status = 'checking';
                this.refresh();
                if (window.chrome && window.chrome.webview) {
                    window.chrome.webview.postMessage({ type: 'CHECK_FOR_UPDATES' });
                }
            });
        }

        const perfBtn = document.getElementById('btn-perform-update');
        if (perfBtn && this.data && !this.isUpdating) {
            perfBtn.addEventListener('click', () => {
                this.isUpdating = true;
                this.refresh(); // Trigger immediate re-render to disable button locally

                // Instant Feedback Banner
                document.dispatchEvent(new CustomEvent('app-message', {
                    detail: { type: 'info', text: 'Starting update process... please wait.' }
                }));

                window.chrome.webview.postMessage({
                    type: 'PERFORM_UPDATE',
                    url: this.data.url,
                    updaterUrl: this.data.updaterUrl || ''
                });
            });
        }

        const browserBtn = document.getElementById('btn-browser-update');
        if (browserBtn && this.data) {
            browserBtn.addEventListener('click', () => {
                window.chrome.webview.postMessage({
                    type: 'OPEN_IN_BROWSER',
                    url: this.data.url
                });
            });
        }
    }

    handleResult(data) {
        if (data.available) {
            this.status = 'available';
            this.data = data;
        } else {
            this.status = 'uptodate';
            this.data = data;
        }
        this.refresh();
    }

    handleError(msg) {
        this.status = 'error';
        this.data = msg;
        this.refresh();
    }

    refresh() {
        const container = document.querySelector('#content-area .update-page');
        if (container) {
            // Re-render whole section
            // A bit hacky but works for now without full reactivity
            document.dispatchEvent(new CustomEvent('app-refresh-ui'));
        }
    }
}
