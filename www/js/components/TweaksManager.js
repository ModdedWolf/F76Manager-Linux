export class TweaksManager {
    constructor() {
        this.categories = [
            {
                id: 'performance',
                label: 'Performance',
                icon: 'zap',
                tweaks: [
                    { id: 'godrays', label: 'Disable Godrays', desc: 'Slightly improves FPS by disabling volumetric lighting.', value: true },
                    { id: 'grass', label: 'Reduced Grass Density', desc: 'Increases visibility and improves performance in forest areas.', value: false },
                    { id: 'shadows', label: 'Shadow Quality', desc: 'Adjust the distance and resolution of shadows.', type: 'select', options: ['Low', 'Medium', 'High', 'Ultra'], value: 'Medium' },
                    { id: 'fastload', label: 'Faster Loading (Beta)', desc: 'Reduces fade-in times to load into worlds faster.', value: false }
                ]
            },
            {
                id: 'graphics',
                label: 'Graphics',
                icon: 'image',
                tweaks: [
                    { id: 'fov', label: 'Field of View', desc: 'Adjust your viewing angle (Default: 70).', type: 'range', min: 70, max: 120, value: 90 },
                    { id: 'dof', label: 'Depth of Field', desc: 'Enable or disable background blur.', value: true },
                    { id: 'taa', label: 'Anti-Aliasing', desc: 'Choose between TAA, FXAA, or None.', type: 'select', options: ['None', 'FXAA', 'TAA'], value: 'TAA' }
                ]
            },
            {
                id: 'network',
                label: 'Network',
                icon: 'wifi',
                tweaks: [
                    { id: 'ping', label: 'Network Optimization', desc: 'Attempts to reduce latency and jitter.', value: true },
                    { id: 'bandwidth', label: 'Bandwidth Uncap', desc: 'Allow the game to use more available bandwidth.', value: true }
                ]
            }
        ];

        this.presets = {
            'Vanilla+': { godrays: false, grass: false, shadows: 'High', fov: 90, dof: true, taa: 'TAA', ping: false, bandwidth: false },
            'Performance': { godrays: true, grass: true, shadows: 'Low', fov: 95, dof: false, taa: 'FXAA', ping: true, bandwidth: true },
            'Ultra': { godrays: false, grass: false, shadows: 'Ultra', fov: 100, dof: true, taa: 'TAA', ping: true, bandwidth: true },
            'Potato PC': { godrays: true, grass: true, shadows: 'Low', fov: 70, dof: false, taa: 'None', ping: true, bandwidth: true }
        };

        this.activePreset = null;
    }

    render(data) {
        if (data && data.activeTweaksPreset) {
            this.activePreset = data.activeTweaksPreset;
        }

        // Use real settings if available to override defaults
        if (data && data.settings) {
            this.categories.forEach(cat => {
                cat.tweaks.forEach(tweak => {
                    if (data.settings[tweak.id] !== undefined) {
                        tweak.value = data.settings[tweak.id];
                    }
                });
            });
        }

        return `
            <div class="tweaks-page animate-fade">
                <div class="presets-bar">
                    <span class="presets-label">Quick Presets:</span>
                    ${Object.keys(this.presets).map(p => `
                        <button class="preset-btn ${this.activePreset === p ? 'active' : ''}" data-preset="${p}">${p}</button>
                    `).join('')}
                </div>

                <div class="tweaks-grid">
                    ${this.categories.map(cat => `
                        <div class="tweak-category">
                            <div class="category-header">
                                <i data-lucide="${cat.icon}"></i>
                                <h3>${cat.label}</h3>
                            </div>
                            <div class="tweak-list">
                                ${cat.tweaks.map(tweak => this.renderTweak(tweak)).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderTweak(tweak) {
        let control = '';

        if (tweak.type === 'select') {
            control = `
                <select class="tweak-select" data-id="${tweak.id}">
                    ${tweak.options.map(opt => `<option value="${opt}" ${opt == tweak.value ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
            `;
        } else if (tweak.type === 'range') {
            control = `
                <div class="range-control">
                    <input type="range" min="${tweak.min}" max="${tweak.max}" value="${tweak.value}" class="tweak-range" data-id="${tweak.id}">
                    <span class="range-value" id="val-${tweak.id}">${tweak.value}</span>
                </div>
            `;
        } else {
            control = `
                <label class="switch">
                    <input type="checkbox" ${tweak.value === true || tweak.value === '1' ? 'checked' : ''} class="tweak-check" data-id="${tweak.id}">
                    <span class="slider"></span>
                </label>
            `;
        }

        return `
            <div class="tweak-item">
                <div class="tweak-info">
                    <div class="tweak-label">${tweak.label}</div>
                    <div class="tweak-desc">${tweak.desc}</div>
                </div>
                <div class="tweak-control">
                    ${control}
                </div>
            </div>
        `;
    }

    onMount() {
        // Handle Presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const presetName = btn.getAttribute('data-preset');
                this.activePreset = presetName; // Set active state
                const settings = this.presets[presetName];

                // Manually trigger re-render of buttons to show active state immediately
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                window.chrome.webview.postMessage({ type: 'UPDATE_SETTINGS_BATCH', settings: settings, presetName: presetName });
            });
        });

        // Handle Checkboxes
        document.querySelectorAll('.tweak-check').forEach(el => {
            el.addEventListener('change', (e) => {
                const id = el.getAttribute('data-id');
                window.chrome.webview.postMessage({ type: 'UPDATE_SETTING', key: id, value: e.target.checked });
            });
        });

        // Handle Selects
        document.querySelectorAll('.tweak-select').forEach(el => {
            el.addEventListener('change', (e) => {
                const id = el.getAttribute('data-id');
                window.chrome.webview.postMessage({ type: 'UPDATE_SETTING', key: id, value: e.target.value });
            });
        });

        // Handle Ranges
        document.querySelectorAll('.tweak-range').forEach(el => {
            const updateSliderFill = (input) => {
                const min = parseInt(input.min) || 0;
                const max = parseInt(input.max) || 100;
                const val = parseInt(input.value) || 0;
                const percent = ((val - min) / (max - min)) * 100;
                input.style.setProperty('--value', percent + '%');
            };

            // Initialize fill
            updateSliderFill(el);

            el.addEventListener('input', (e) => {
                const id = el.getAttribute('data-id');
                const valEl = document.getElementById(`val-${id}`);
                if (valEl) valEl.textContent = e.target.value;
                updateSliderFill(e.target);
            });

            el.addEventListener('change', (e) => {
                const id = el.getAttribute('data-id');
                window.chrome.webview.postMessage({ type: 'UPDATE_SETTING', key: id, value: parseInt(e.target.value) });
            });
        });
    }
}
