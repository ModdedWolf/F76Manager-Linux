export class Profiles {
    render(data) {
        const profiles = data ? (data.profiles || ['Default Profile']) : ['Default Profile'];
        const active = data ? (data.activeProfile || 'Default Profile') : 'Default Profile';

        return `
            <div class="profiles-page animate-fade">
                <div class="section-header">
                    <div class="header-with-icon">
                        <i data-lucide="users" class="primary-icon"></i>
                        <div>
                            <h2>Configuration Profiles</h2>
                            <p class="text-muted">Create snapshots of your mods and settings for easy switching.</p>
                        </div>
                    </div>
                </div>

                <div class="profile-creator-bar">
                    <div class="creator-input-group">
                        <i data-lucide="plus-circle"></i>
                        <input type="text" id="new-profile-name" placeholder="Profile Name (e.g. Ultra Graphics)">
                        <button class="btn primary" id="btn-create-profile">
                            <i data-lucide="save"></i>
                            <span>Create from Current</span>
                        </button>
                    </div>
                </div>

                <div class="profiles-grid">
                    ${profiles.map(name => `
                        <div class="profile-card ${name === active ? 'active' : ''}">
                            <div class="profile-icon">
                                <i data-lucide="user"></i>
                            </div>
                            <div class="profile-info">
                                <div class="profile-name">${name}</div>
                                <div class="profile-status">
                                    ${name === active ?
                '<span class="active-tag"><span class="dot"></span> Active</span>' :
                '<span class="inactive-tag">Inactive</span>'
            }
                                </div>
                            </div>
                            <div class="profile-actions">
                                ${name !== active ? `
                                    <button class="btn-sm switch-profile" data-name="${name}">
                                        <i data-lucide="refresh-cw"></i>
                                        <span>Switch</span>
                                    </button>
                                ` : ''}
                                ${name !== 'Default Profile' ? `
                                    <button class="icon-btn-sm delete-profile" data-name="${name}" title="Delete Profile">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="profiles-tip">
                    <i data-lucide="info"></i>
                    <p>Creating a profile saves your currently enabled mods and all Pip-Boy/Tweak settings.</p>
                </div>
            </div>
        `;
    }

    onMount() {
        // Create Profile
        const createBtn = document.getElementById('btn-create-profile');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                const name = document.getElementById('new-profile-name').value;
                if (!name) return;
                window.chrome.webview.postMessage({ type: 'CREATE_PROFILE', name: name });
            });
        }

        // Switch Profile
        document.querySelectorAll('.switch-profile').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.getAttribute('data-name');
                window.chrome.webview.postMessage({ type: 'SWITCH_PROFILE', name: name });
            });
        });

        // Delete Profile
        document.querySelectorAll('.delete-profile').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.getAttribute('data-name');
                if (confirm(`Are you sure you want to delete profile "${name}"?`)) {
                    window.chrome.webview.postMessage({ type: 'DELETE_PROFILE', name: name });
                }
            });
        });
    }
}
