export class QuickStats {
    render(data) {
        const stats = data ? (data.stats || { modsActive: 0, diskUsage: '0 GB', lastLaunch: 'Never' }) : { modsActive: 0, diskUsage: '0 GB', lastLaunch: 'Never' };

        return `
            <div class="widget stats-widget">
                <div class="stat-item">
                    <span class="stat-label">Mods Active</span>
                    <span class="stat-value" id="stat-mods-active">${stats.modsActive}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Last Launch</span>
                    <span class="stat-value" id="stat-last-launch">${stats.lastLaunch}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Conflicts</span>
                    <span class="stat-value ${stats.conflicts > 0 ? 'text-error' : ''}" id="stat-conflicts">${stats.conflicts || 0}</span>
                </div>
            </div>
        `;
    }
}
