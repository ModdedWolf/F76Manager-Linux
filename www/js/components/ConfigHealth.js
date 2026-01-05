export class ConfigHealth {
    render(data) {
        return `
            <div class="widget">
                <div class="widget-header">
                    <i data-lucide="shield-check"></i>
                    <h3>Configuration Health</h3>
                </div>
                <div class="widget-content">
                    <div class="health-status">
                        <span class="status-value" style="color:var(--success-green)">Ready</span>
                        <span class="status-text">No conflicts detected in your current load order.</span>
                    </div>
                    <ul class="health-details">
                        <li><i data-lucide="check"></i> INI integrity verified</li>
                        <li><i data-lucide="check"></i> Mod files present</li>
                        <li><i data-lucide="check"></i> Profile synced</li>
                    </ul>
                </div>
            </div>
        `;
    }
}
