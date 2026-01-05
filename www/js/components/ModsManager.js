export class ModsManager {
    constructor(modGroupsManager) {
        this.modGroupsManager = modGroupsManager;
        this.currentPreset = 'all';
        this.sortField = 'name';
        this.sortOrder = 'asc';
    }

    render(data) {
        const mods = data ? (data.mods || data.Mods || []) : [];
        const groups = this.modGroupsManager.getGroups();

        // Categorize mods
        const categorized = {};
        const uncategorized = [];

        mods.forEach(mod => {
            const groupName = this.modGroupsManager.getModGroup(mod.name);
            if (groupName && groups[groupName]) {
                if (!categorized[groupName]) categorized[groupName] = [];
                categorized[groupName].push(mod);
            } else {
                uncategorized.push(mod);
            }
        });

        return `
            <div class="mods-page">
                <div class="mods-header single-row">
                    <div class="header-left">
                        <div class="search-box no-icon">
                            <input type="text" placeholder="Search mods..." id="mod-search">
                        </div>
                        
                        <div class="preset-controls-unified">
                            <div class="preset-selector-group">
                                <span class="preset-label">Preset</span>
                                <select class="preset-select-global" id="preset-switcher">
                                    <option value="all" ${this.currentPreset === 'all' ? 'selected' : ''}>All Mods</option>
                                    <option value="uncategorized" ${this.currentPreset === 'uncategorized' ? 'selected' : ''}>Uncategorized</option>
                                    ${Object.keys(groups).map(g => `<option value="${g}" ${this.currentPreset === g ? 'selected' : ''}>${g}</option>`).join('')}
                                    <option value="__NEW__">[( New Preset )]</option>
                                </select>
                            </div>
                            
                            ${this.currentPreset !== 'all' ? `
                                <button class="preset-delete-integrated" id="delete-current-preset" title="Delete Preset">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <div class="header-right">
                        <button class="btn primary btn-deploy-slim" id="deploy-mods">
                            <i data-lucide="refresh-cw"></i>
                            <span>Deploy</span>
                        </button>
                        
                        <div class="action-group-compact">
                            <button class="btn btn-add-slim" id="add-mod">
                                <i data-lucide="plus"></i>
                                <span>Add</span>
                            </button>
                            <button class="btn-icon-only-slim" id="open-folder" title="Bulk Import (Select Folder)">
                                <i data-lucide="folder"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div id="preset-modal" class="modal-overlay">
                    <div class="custom-modal">
                        <div class="modal-header">
                            <h3>Create New Preset</h3>
                        </div>
                        <div class="modal-body">
                            <input type="text" id="new-preset-input" class="modal-input" placeholder="Enter preset name...">
                        </div>
                        <div class="modal-footer">
                            <button class="btn" id="modal-cancel">Cancel</button>
                            <button class="btn primary" id="modal-confirm">Create</button>
                        </div>
                    </div>
                </div>

                <!-- Edit Details Modal -->
                <div id="edit-mod-modal" class="modal-overlay">
                    <div class="custom-modal" style="width: 400px;">
                        <div class="modal-header">
                            <h3>Edit Mod Details</h3>
                        </div>
                        <div class="modal-body">
                            <input type="hidden" id="edit-mod-original-name">
                            <div class="form-group" style="margin-bottom: 12px;">
                                <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--text-muted);">Display Name</label>
                                <input type="text" id="edit-mod-alias" class="modal-input" placeholder="Custom mod name">
                            </div>
                            <div class="form-group" style="margin-bottom: 12px;">
                                <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--text-muted);">Author</label>
                                <input type="text" id="edit-mod-author" class="modal-input" placeholder="Mod Author">
                            </div>
                            <div class="form-group" style="margin-bottom: 12px;">
                                <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--text-muted);">Version</label>
                                <input type="text" id="edit-mod-version" class="modal-input" placeholder="1.0">
                            </div>
                            <div class="form-group" style="margin-bottom: 12px;">
                                <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--text-muted);">Tags (comma separated)</label>
                                <input type="text" id="edit-mod-tags" class="modal-input" placeholder="texture, weapon, sound">
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--text-muted);">Highlight Color</label>
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <input type="color" id="edit-mod-color" style="width: 40px; height: 30px; border: none; background: transparent; cursor: pointer;">
                                    <button class="btn-text" id="clear-mod-color" style="font-size:0.8rem;">Reset</button>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn" id="edit-modal-cancel">Cancel</button>
                            <button class="btn primary" id="edit-modal-save">Save Changes</button>
                        </div>
                    </div>
                </div>

                <!-- Conflict Modal -->
                <div id="conflict-modal" class="modal-overlay">
                    <div class="custom-modal" style="width: 600px; max-height:80vh; display:flex; flex-direction:column;">
                        <div class="modal-header" style="background: #3a1c1c; border-bottom: 1px solid #5a2e2e;">
                            <h3 style="color: #ff8a8a; display:flex; align-items:center; gap:10px;">
                                <i data-lucide="alert-triangle"></i> Conflicts Detected
                            </h3>
                        </div>
                        <div class="modal-body" style="overflow-y:auto; padding:0;">
                            <div style="padding:16px; background:#2a1515; border-bottom:1px solid #3d1f1f;">
                                <p style="color:#e0e0e0; font-size:0.9rem;">The following files are modified by multiple enabled mods. The last one loaded (bottom of list) will win.</p>
                            </div>
                            <div id="conflict-list" style="padding:16px;">
                                <!-- Populated dynamically -->
                            </div>
                        </div>
                        <div class="modal-footer" style="background:#2a1515; border-top:1px solid #3d1f1f;">
                            <button class="btn" id="conflict-cancel">Cancel Deployment</button>
                            <button class="btn primary" id="conflict-confirm" style="background:#7f1d1d; border-color:#991b1b;">
                                <i data-lucide="alert-octagon"></i> Deploy Anyway
                            </button>
                        </div>
                    </div>
                </div>

                <div class="mods-table-container">
                    <table class="mods-table">
                        <thead>
                            <tr>
                                <th style="width: 40px;"></th>
                                <th style="width: 40px;"><input type="checkbox" id="select-all"></th>
                                <th style="width: 40%;" class="sortable-header ${this.sortField === 'name' ? 'active' : ''}" data-sort="name">
                                    Mod Name ${this.renderSortIcon('name')}
                                </th>
                                <th style="width: 20%;" class="sortable-header ${this.sortField === 'author' ? 'active' : ''}" data-sort="author">
                                    Author ${this.renderSortIcon('author')}
                                </th>
                                <th style="width: 10%;" class="sortable-header ${this.sortField === 'version' ? 'active' : ''}" data-sort="version">
                                    Version ${this.renderSortIcon('version')}
                                </th>
                                <th class="sortable-header ${this.sortField === 'tags' ? 'active' : ''}" data-sort="tags" style="text-align: center;">
                                    Tags ${this.renderSortIcon('tags')}
                                </th>
                                <th style="width: 100px;" class="sortable-header ${this.sortField === 'type' ? 'active' : ''}" data-sort="type">
                                    Method ${this.renderSortIcon('type')}
                                </th>
                                <th style="width: 60px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="mods-list">
                            ${(() => {
                let filtered = mods;
                if (this.currentPreset === 'uncategorized') {
                    filtered = mods.filter(m => !this.modGroupsManager.getModGroup(m.name));
                } else if (this.currentPreset !== 'all') {
                    const presetMods = this.modGroupsManager.getGroups()[this.currentPreset] || [];
                    filtered = mods.filter(m => presetMods.includes(m.name));
                }

                // Apply Sorting
                filtered.sort((a, b) => {
                    let valA = a[this.sortField] || '';
                    let valB = b[this.sortField] || '';

                    if (this.sortField === 'tags') {
                        valA = (a.tags || []).join(', ');
                        valB = (b.tags || []).join(', ');
                    }

                    if (this.sortField === 'version') {
                        // Simple version comparison (can be refined to semver)
                        return this.sortOrder === 'asc'
                            ? String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' })
                            : String(valB).localeCompare(String(valA), undefined, { numeric: true, sensitivity: 'base' });
                    }

                    if (typeof valA === 'string') {
                        return this.sortOrder === 'asc'
                            ? valA.localeCompare(valB)
                            : valB.localeCompare(valA);
                    }

                    return this.sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
                });

                return filtered.map(mod => this.renderModRow(mod)).join('');
            })()}
                            ${mods.length === 0 ? this.renderNoMods(data) : ''}
                        </tbody>
                    </table>
                </div>

                <div class="mods-footer">
                    <span>${mods.length} mods total</span>
                </div>
            </div>
        `;
    }

    renderGroup(name, groupMods, isUncategorized = false) {
        return `
            <tr class="mod-group-row" data-group-name="${name}">
                <td colspan="2">
                    <div class="group-title-cell">
                        <i data-lucide="${isUncategorized ? 'package' : 'folder'}" style="width:16px; height:16px;"></i>
                        <span>${name}</span>
                    </div>
                </td>
                <td colspan="6">
                    <span class="text-secondary" style="font-size: 0.8rem; opacity: 0.6;">${groupMods.length} mods</span>
                </td>
                <td style="text-align: right;">
                    ${!isUncategorized ? `
                        <button class="icon-btn-sm delete-group" data-name="${name}" title="Delete Group">
                            <i data-lucide="x"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
            ${groupMods.map(mod => this.renderModRow(mod)).join('')}
        `;
    }

    renderModRow(mod) {
        const isEnabled = mod.status === 'enabled';
        const type = mod.type || 'archive';

        let icon = 'package';
        let method = 'BA2';
        let methodClass = 'ba2';

        if (type === 'plugin') {
            icon = 'file-code';
            method = 'Plugin';
            methodClass = 'plugin';
        } else if (type === 'strings') {
            icon = 'languages';
            method = 'Strings';
            methodClass = 'strings';
        }

        return `
            <tr class="mod-row ${isEnabled ? '' : 'disabled'}" data-name="${mod.name}" draggable="true">
                <td style="width: 30px;">
                    <div class="drag-handle">
                        <i data-lucide="grip-vertical" style="width:14px; height:14px;"></i>
                    </div>
                </td>
                <td><input type="checkbox" class="mod-check" ${isEnabled ? 'checked' : ''} data-name="${mod.name}"></td>
                <td>
                    <div class="mod-name-cell">
                        <i data-lucide="${icon}" style="width:16px; height:16px; opacity:0.6;"></i>
                        <span class="mod-name">${mod.name}</span>
                    </div>
                </td>
                <td>${mod.author || 'Unknown'}</td>
                <td>${mod.version || '1.0'}</td>
                <td>
                    <div class="tag-list" style="justify-content: center;">
                        ${(mod.tags || []).map(tag => {
            const style = mod.color
                ? `border-color:${mod.color}; color:${mod.color}; background-color:${mod.color}15;` // 15 = ~8% opacity
                : '';
            return `<span class="tag" style="${style}">${tag}</span>`;
        }).join('')}
                    </div>
                </td>
                <td><span class="method-badge ${methodClass}">${method}</span></td>
                <td>
                    <div class="row-actions">
                        <button class="icon-btn-sm edit-mod" title="Edit Details" data-name="${mod.name}" data-original="${mod.originalName || mod.name}" 
                                data-alias="${mod.name}" data-author="${mod.author || ''}" data-version="${mod.version || ''}" 
                                data-tags="${(mod.tags || []).join(', ')}" data-color="${mod.color || ''}">
                            <i data-lucide="more-vertical"></i>
                        </button>
                        <button class="icon-btn-sm delete-mod" title="Delete Mod" data-name="${mod.name}">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderNoMods(data) {
        const diag = data ? data.diagnostic : null;
        return `
            <tr>
                <td colspan="8">
                    <div class="no-mods-found">
                        <i data-lucide="package-search" style="width:64px; height:64px; margin-bottom:16px; opacity:0.3;"></i>
                        <h3>Internal Error: No Mods Found</h3>
                        <p>Scanning at: ${diag ? (diag.scanPath || diag.gamePath) : 'Unknown path'}</p>
                        <p class="text-muted">Last check: ${diag ? diag.timestamp : 'N/A'}</p>
                        <div style="display:flex; gap:10px; margin-top:16px;">
                            <button class="btn" onclick="window.chrome.webview.postMessage({type:'GET_DATA'})">
                                <i data-lucide="refresh-cw"></i> Retry Scan
                            </button>
                            <button class="btn secondary" onclick="window.chrome.webview.postMessage({type:'BROWSE_FOLDER', target:'game'})">
                                <i data-lucide="folder-search"></i> Change Game Path
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    renderSortIcon(field) {
        if (this.sortField !== field) return `<span class="sort-icon-container"><i data-lucide="chevrons-up-down" class="sort-icon"></i></span>`;

        return `
            <span class="sort-icon-container">
                <i data-lucide="${this.sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'}" class="sort-icon"></i>
            </span>
        `;
    }

    onMount(data) {
        // Setup Sortable Headers
        document.querySelectorAll('.sortable-header').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.getAttribute('data-sort');
                if (this.sortField === field) {
                    // Toggle order
                    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    // New field, default to asc
                    this.sortField = field;
                    this.sortOrder = 'asc';
                }
                document.dispatchEvent(new CustomEvent('app-refresh-ui'));
            });
        });

        // Setup Search
        const searchInput = document.getElementById('mod-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                document.querySelectorAll('.mod-row').forEach(row => {
                    const name = row.getAttribute('data-name').toLowerCase();
                    row.style.display = name.includes(term) ? '' : 'none';
                });
            });
        }

        // Setup Preset Switcher
        const presetSwitcher = document.getElementById('preset-switcher');
        if (presetSwitcher) {
            presetSwitcher.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val === '__NEW__') {
                    this.showPresetModal();
                    // Reset to previous or all to avoid staying on __NEW__
                    presetSwitcher.value = 'all';
                } else {
                    this.currentPreset = val;
                    document.dispatchEvent(new CustomEvent('app-refresh-ui'));

                    // Option to Activate: Done via re-render and user choice or auto
                    // If switching to a specific group, we can also auto-check if desired
                    if (val !== 'all' && val !== 'uncategorized') {
                        // We'll let the user click a "Apply" button or just do it
                        // For simplicity as requested "easily switch", let's just do it
                        this.activatePreset(val);
                    }
                }
            });
        }

        // Setup Modal Events
        const modal = document.getElementById('preset-modal');
        const modalCancel = document.getElementById('modal-cancel');
        const modalConfirm = document.getElementById('modal-confirm');
        const modalInput = document.getElementById('new-preset-input');

        if (modalCancel) modalCancel.onclick = () => modal.classList.remove('active');
        if (modalConfirm) {
            modalConfirm.onclick = () => {
                const name = modalInput.value;
                if (name) {
                    this.modGroupsManager.createGroup(name);
                    modal.classList.remove('active');
                    modalInput.value = '';
                    document.dispatchEvent(new CustomEvent('app-refresh-ui'));
                }
            };
        }

        // Setup Delete Preset
        const deletePresetBtn = document.getElementById('delete-current-preset');
        if (deletePresetBtn) {
            deletePresetBtn.addEventListener('click', () => {
                const name = this.currentPreset;
                if (!name || name === 'all') return;

                if (name === 'uncategorized') {
                    alert("The 'Uncategorized' preset is a system filter for mods that don't belong to any group. It cannot be deleted.");
                    return;
                }

                if (confirm(`Delete preset "${name}"? Mods will remain in your list but will no longer be part of this group.`)) {
                    const success = this.modGroupsManager.deleteGroup(name);
                    if (success) {
                        this.currentPreset = 'all';
                        document.dispatchEvent(new CustomEvent('app-refresh-ui'));
                    } else {
                        alert(`Could not delete preset "${name}". It may have already been removed.`);
                        this.currentPreset = 'all';
                        document.dispatchEvent(new CustomEvent('app-refresh-ui'));
                    }
                }
            });
        }

        // Setup Select All
        const selectAll = document.getElementById('select-all');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const checked = e.target.checked;
                document.querySelectorAll('.mod-check').forEach(cb => {
                    cb.checked = checked;
                    // Note: We do NOT toggle 'disabled' class here anymore.
                    // Rows stay grey until the user hits 'Deploy'.
                });
            });
        }

        // Setup individual checkbox toggling
        document.querySelectorAll('.mod-check').forEach(cb => {
            cb.addEventListener('change', (e) => {
                // Rows stay grey until 'Deploy' confirms the state.
            });
        });

        // Setup Deploy Button
        const deployBtn = document.getElementById('deploy-mods');
        if (deployBtn) {
            deployBtn.addEventListener('click', () => {
                const checkedMods = Array.from(document.querySelectorAll('.mod-check:checked'))
                    .map(cb => cb.getAttribute('data-name'));

                deployBtn.disabled = true;
                const originalContent = deployBtn.innerHTML;
                deployBtn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> <span>Deploying...</span>`;
                lucide.createIcons();

                window.chrome.webview.postMessage({
                    type: 'DEPLOY_MODS',
                    mods: checkedMods
                });
            });
        }

        // Setup Add Mod Button
        const addModBtn = document.getElementById('add-mod');
        if (addModBtn) {
            addModBtn.addEventListener('click', () => {
                window.chrome.webview.postMessage({ type: 'ADD_MOD' });
            });
        }

        // Setup Open Folder Button
        const openFolderBtn = document.getElementById('open-folder');
        if (openFolderBtn) {
            openFolderBtn.addEventListener('click', () => {
                window.chrome.webview.postMessage({ type: 'OPEN_FOLDER' });
            });
        }

        // Setup Delete Buttons
        document.querySelectorAll('.delete-mod').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.getAttribute('data-name');
                if (confirm(`Are you sure you want to delete ${name}?`)) {
                    window.chrome.webview.postMessage({
                        type: 'DELETE_MOD',
                        name: name
                    });
                }
            });
        });



        // Setup Edit Mod Buttons
        document.querySelectorAll('.edit-mod').forEach(btn => {
            btn.addEventListener('click', () => {
                const original = btn.getAttribute('data-original');
                const alias = btn.getAttribute('data-alias');
                const author = btn.getAttribute('data-author');
                const version = btn.getAttribute('data-version');
                const tags = btn.getAttribute('data-tags');
                const color = btn.getAttribute('data-color');

                document.getElementById('edit-mod-original-name').value = original;
                document.getElementById('edit-mod-alias').value = alias;
                document.getElementById('edit-mod-author').value = author;
                document.getElementById('edit-mod-version').value = version;
                document.getElementById('edit-mod-tags').value = tags;
                document.getElementById('edit-mod-color').value = color || '#000000'; // Default black if empty, or handle specially

                const modal = document.getElementById('edit-mod-modal');
                if (modal) modal.classList.add('active');
            });
        });

        // Setup Edit Modal Actions
        const editModal = document.getElementById('edit-mod-modal');
        if (editModal) {
            document.getElementById('edit-modal-cancel').onclick = () => editModal.classList.remove('active');

            document.getElementById('clear-mod-color').onclick = () => {
                document.getElementById('edit-mod-color').value = '#000000'; // Or some visual reset
                // We'll treat empty string as clear in logic
            };

            document.getElementById('edit-modal-save').onclick = () => {
                const originalName = document.getElementById('edit-mod-original-name').value;
                const newAlias = document.getElementById('edit-mod-alias').value;

                // Color logic: if user picked black #000000 (standard default) and clicked reset, maybe send empty?
                // For now, let's just send what's there.
                const colorVal = document.getElementById('edit-mod-color').value;

                const meta = {
                    Alias: newAlias,
                    Author: document.getElementById('edit-mod-author').value,
                    Version: document.getElementById('edit-mod-version').value,
                    Tags: document.getElementById('edit-mod-tags').value.split(',').map(t => t.trim()).filter(t => t),
                    Color: colorVal
                };

                window.chrome.webview.postMessage({
                    type: 'UPDATE_MOD_METADATA',
                    originalName: originalName,
                    metadata: meta
                });

                editModal.classList.remove('active');
            };
        }

        // Setup Group Dropdowns
        document.querySelectorAll('.group-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const modName = select.getAttribute('data-name');
                const groupName = e.target.value;

                if (groupName === '__NEW_GROUP__') {
                    const newName = prompt("Enter new group name:");
                    if (newName) {
                        this.modGroupsManager.createGroup(newName);
                        this.modGroupsManager.addModToGroup(newName, modName);
                        document.dispatchEvent(new CustomEvent('app-refresh-ui'));
                    } else {
                        // Reset to previous value
                        e.target.value = this.modGroupsManager.getModGroup(modName) || "";
                    }
                }
            });
        });

        this.setupDragAndDrop();

        // Listen for completion messages to reset the deploy button
        document.addEventListener('app-message', (e) => {
            const status = e.detail;
            const deployBtn = document.getElementById('deploy-mods');

            if (status.type === 'conflicts_found') {
                // HIDE SPINNER
                if (deployBtn) {
                    deployBtn.disabled = false;
                    deployBtn.innerHTML = `<i data-lucide="refresh-cw"></i> <span>Deploy Mods</span>`;
                    lucide.createIcons();
                }

                // SHOW MODAL
                const modal = document.getElementById('conflict-modal');
                const list = document.getElementById('conflict-list');

                if (list && status.conflicts) {
                    list.innerHTML = status.conflicts.map(c => `
                        <div class="conflict-item" style="margin-bottom:12px; font-size:0.9rem;">
                            <div style="font-weight:bold; color:#ff8a8a; margin-bottom:4px; font-family:monospace;">${c.FilePath}</div>
                            <div style="padding-left:12px; border-left:2px solid #5a2e2e;">
                                ${c.ModNames.map((m, i) => `
                                    <div style="color:${i === c.ModNames.length - 1 ? '#4ade80' : '#a0aec0'};">
                                        ${i === c.ModNames.length - 1 ? 'WINNER: ' : 'OVERWRITTEN: '} ${m}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('');
                }

                if (modal) modal.classList.add('active');
                lucide.createIcons();
                return;
            }

            if (deployBtn && (status.type === 'success' || status.type === 'error')) {
                deployBtn.disabled = false;
                deployBtn.innerHTML = `
                    <i data-lucide="refresh-cw"></i>
                    <span>Deploy Mods</span>
                `;
                lucide.createIcons();
            }
        });

        // Setup Conflict Modal Buttons
        const conflictModal = document.getElementById('conflict-modal');
        if (conflictModal) {
            document.getElementById('conflict-cancel').onclick = () => conflictModal.classList.remove('active');

            document.getElementById('conflict-confirm').onclick = () => {
                const checkedMods = Array.from(document.querySelectorAll('.mod-check:checked'))
                    .map(cb => cb.getAttribute('data-name'));

                const deployBtn = document.getElementById('deploy-mods');
                if (deployBtn) {
                    deployBtn.disabled = true;
                    deployBtn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> <span>Deploying (Forced)...</span>`;
                    lucide.createIcons();
                }

                window.chrome.webview.postMessage({
                    type: 'DEPLOY_MODS',
                    mods: checkedMods,
                    force: true
                });

                conflictModal.classList.remove('active');
            };
        }
    }

    setupDragAndDrop() {
        const list = document.getElementById('mods-list');
        if (!list) return;

        let draggedRow = null;

        list.addEventListener('dragstart', (e) => {
            draggedRow = e.target.closest('.mod-row');
            if (!draggedRow) return;
            draggedRow.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedRow.getAttribute('data-name'));
        });

        list.addEventListener('dragend', () => {
            if (draggedRow) draggedRow.classList.remove('dragging');
            draggedRow = null;
            document.querySelectorAll('.mod-row, .mod-group-row').forEach(r => r.classList.remove('drop-target'));
        });

        // NATIVE FILE DROP SUPPORT
        const dropZone = document.querySelector('.mods-table-container');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.types.includes('Files')) {
                    dropZone.classList.add('file-drop-active');
                }
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('file-drop-active');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('file-drop-active');

                const files = Array.from(e.dataTransfer.files).map(f => f.path);
                const modFiles = files.filter(f => {
                    const ext = f.split('.').pop().toLowerCase();
                    return ['ba2', 'esm', 'esp', 'strings'].includes(ext);
                });

                if (modFiles.length > 0) {
                    console.log('[UI] Dropped mods:', modFiles);
                    window.chrome.webview.postMessage({
                        type: 'ADD_MOD',
                        files: modFiles
                    });
                }
            });
        }

        list.addEventListener('dragover', (e) => {
            if (e.dataTransfer.types.includes('Files')) return;
            e.preventDefault();
            const row = e.target.closest('.mod-row');
            if (row && row !== draggedRow) row.classList.add('drop-target');
        });

        list.addEventListener('drop', (e) => {
            if (e.dataTransfer.types.includes('Files')) return;
            e.preventDefault();
            const row = e.target.closest('.mod-row');
            const modName = e.dataTransfer.getData('text/plain');

            if (row && draggedRow && row !== draggedRow) {
                const rect = row.getBoundingClientRect();
                const next = (e.clientY - rect.top) > (rect.height / 2);
                if (next) row.parentNode.insertBefore(draggedRow, row.nextSibling);
                else row.parentNode.insertBefore(draggedRow, row);
                this.updateModOrder();
            }
        });
    }

    updateModOrder() {
        const order = Array.from(document.querySelectorAll('.mod-row'))
            .map(row => row.getAttribute('data-name'));

        window.chrome.webview.postMessage({
            type: 'UPDATE_MOD_ORDER',
            order: order
        });
    }


    showPresetModal() {
        const modal = document.getElementById('preset-modal');
        if (modal) {
            modal.classList.add('active');
            const input = document.getElementById('new-preset-input');
            if (input) input.focus();
        }
    }

    activatePreset(name) {
        const groups = this.modGroupsManager.getGroups();
        const presetMods = groups[name] || [];

        document.querySelectorAll('.mod-check').forEach(cb => {
            const modName = cb.getAttribute('data-name');
            cb.checked = presetMods.includes(modName);
        });

        // Trigger logic to save or notify backend if needed
        const deployBtn = document.getElementById('deploy-mods');
        if (deployBtn) deployBtn.click();
    }
}
