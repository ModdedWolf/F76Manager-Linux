export class Logs {
    constructor() {
        this.activeTab = 'activity';
    }

    render(data) {
        const logs = data ? (data.logs || { activity: [], errors: [] }) : { activity: [], errors: [] };
        const currentLogs = this.activeTab === 'activity' ? logs.activity : logs.errors;

        return `
            <div class="logs-page animate-fade">
                <div class="section-header">
                    <div class="header-with-icon">
                        <i data-lucide="terminal" class="primary-icon"></i>
                        <div>
                            <h2>System Logs</h2>
                            <p class="text-muted">Monitor manager events and troubleshooting errors.</p>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn secondary" id="refresh-logs">
                            <i data-lucide="refresh-cw"></i>
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                <div class="logs-container">
                    <div class="logs-tabs">
                        <button class="log-tab ${this.activeTab === 'activity' ? 'active' : ''}" data-tab="activity">
                            <i data-lucide="activity"></i>
                            <span>Activity Log</span>
                        </button>
                        <button class="log-tab ${this.activeTab === 'errors' ? 'active' : ''}" data-tab="errors">
                            <i data-lucide="alert-circle"></i>
                            <span>Error Log</span>
                            ${logs.errors.length > 0 ? `<span class="error-badge">${logs.errors.length}</span>` : ''}
                        </button>
                    </div>

                    <div class="terminal-window">
                        <div class="terminal-header">
                            <div class="terminal-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <span class="terminal-title">${this.activeTab === 'activity' ? 'activity.log' : 'error.log'}</span>
                        </div>
                        <div class="terminal-body" id="log-content">
                            ${currentLogs.length > 0 ?
                currentLogs.map(line => this.formatLogLine(line)).join('') :
                `<div class="empty-terminal">No log entries found for this category.</div>`
            }
                        </div>
                    </div>
                </div>

                <div class="logs-footer">
                    <i data-lucide="info" style="width: 14px; height: 14px;"></i>
                    <span>Logs are automatically rotation-cleaned every 15 days to save space.</span>
                </div>
            </div>
        `;
    }

    formatLogLine(line) {
        const isError = line.includes('ERROR:');
        const timestampMatch = line.match(/^\[(.*?)\]/);
        const timestamp = timestampMatch ? timestampMatch[0] : '';
        const content = line.replace(timestamp, '').trim();

        return `
            <div class="log-line ${isError ? 'error' : ''}">
                <span class="log-ts">${timestamp}</span>
                <span class="log-content">${this.escapeHtml(content)}</span>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    onMount() {
        // Tab switching
        document.querySelectorAll('.log-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activeTab = tab.getAttribute('data-tab');
                // We need to re-render. Since main.js handles navigation, 
                // we'll just trigger a data refresh which forces a re-render.
                window.chrome.webview.postMessage({ type: 'GET_DATA' });
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-logs');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                window.chrome.webview.postMessage({ type: 'GET_DATA' });
            });
        }
    }
}
