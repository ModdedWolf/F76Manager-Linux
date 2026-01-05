export class PipBoy {
    constructor() {
        this.settings = [
            { id: 'pipboy', label: 'Pip-Boy Color', r: 26, g: 255, b: 128 }
        ];

        this.presets = [
            { name: 'Classic', color: '#1eff00', r: 30, g: 255, b: 0 },
            { name: 'Amber', color: '#ffb642', r: 255, g: 182, b: 66 },
            { name: 'Blue', color: '#46c7ff', r: 70, g: 199, b: 255 },
            { name: 'White', color: '#ffffff', r: 255, g: 255, b: 255 }
        ];
    }

    render(data) {
        if (data && data.settings) {
            const pb = this.settings.find(s => s.id === 'pipboy');
            if (pb) {
                if (data.settings.pipboyRed !== undefined) pb.r = data.settings.pipboyRed;
                if (data.settings.pipboyGreen !== undefined) pb.g = data.settings.pipboyGreen;
                if (data.settings.pipboyBlue !== undefined) pb.b = data.settings.pipboyBlue;
            }
        }

        const pb = this.settings.find(s => s.id === 'pipboy');
        const currentHex = this.rgbToHex(pb.r, pb.g, pb.b);

        return `
            <div class="pipboy-page">
                <div class="pipboy-layout">
                    <div class="pipboy-controls">
                        <div class="glass-panel-unified">
                            <div class="panel-header">
                                <h2>Interface Color Control</h2>
                                <p class="text-muted">Select a preset or fine-tune your Pip-Boy display.</p>
                            </div>

                            <div class="presets-section">
                                <label class="section-label">PRESETS</label>
                                <div class="presets-chips">
                                    ${this.presets.map(p => `
                                        <button class="preset-chip" 
                                                data-r="${p.r}" data-g="${p.g}" data-b="${p.b}" 
                                                style="--chip-color: ${p.color}">
                                            <div class="chip-glow"></div>
                                            <span class="chip-name">${p.name}</span>
                                        </button>
                                    `).join('')}
                                </div>
                            </div>

                            <div class="divider-line"></div>

                            <div class="customizer-section">
                                <div class="customizer-header">
                                    <label class="section-label">CUSTOM VALUES</label>
                                    <div class="hex-badge">
                                        <span class="hash">#</span>
                                        <input type="text" class="hex-input-transparent" id="hex-pipboy" value="${currentHex}" maxlength="6">
                                    </div>
                                </div>

                                ${this.settings.map(s => `
                                    <div class="sliders-stack">
                                        <div class="slider-row">
                                            <span class="channel-label red">R</span>
                                            <div class="slider-track red">
                                                <input type="range" min="0" max="255" value="${s.r}" class="modern-slider" data-target="${s.id}" data-channel="r">
                                            </div>
                                            <span class="channel-val" id="val-${s.id}-r">${s.r}</span>
                                        </div>
                                        <div class="slider-row">
                                            <span class="channel-label green">G</span>
                                            <div class="slider-track green">
                                                <input type="range" min="0" max="255" value="${s.g}" class="modern-slider" data-target="${s.id}" data-channel="g">
                                            </div>
                                            <span class="channel-val" id="val-${s.id}-g">${s.g}</span>
                                        </div>
                                        <div class="slider-row">
                                            <span class="channel-label blue">B</span>
                                            <div class="slider-track blue">
                                                <input type="range" min="0" max="255" value="${s.b}" class="modern-slider" data-target="${s.id}" data-channel="b">
                                            </div>
                                            <span class="channel-val" id="val-${s.id}-b">${s.b}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="panel-actions">
                                <button class="btn-glass primary" id="save-colors">
                                    <i data-lucide="check"></i> Apply
                                </button>
                                <button class="btn-glass" id="reset-colors">
                                    <i data-lucide="rotate-ccw"></i> Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="pipboy-preview-container">
                        <div class="pipboy-wrapper">
                            <div class="pipboy-screen" id="live-pb-screen" style="--pb-color: rgb(${pb.r}, ${pb.g}, ${pb.b})">
                                <div class="live-connection-badge" id="pb-live-badge"></div>
                                <div class="screen-scanline"></div>
                                <div class="screen-glow-overlay"></div>
                                <div class="screen-header">
                                    <span>STAT</span>
                                    <span class="active">INV</span>
                                    <span>DATA</span>
                                    <span>MAP</span>
                                    <span>RADIO</span>
                                </div>
                                <div class="screen-body">
                                    <div class="item-list">
                                        <div class="item active">9mm Pistol (12)</div>
                                        <div class="item">Combat Knife</div>
                                        <div class="item">Stimpak (4)</div>
                                        <div class="item">RadAway (2)</div>
                                        <div class="item">Nuka-Cola</div>
                                    </div>
                                    <div class="vault-boy-status">
                                        <div class="vb-icon-container">
                                            <i data-lucide="user" class="vb-icon"></i>
                                        </div>
                                        <div class="health-bar-container">
                                            <div class="health-label">HP 85/100</div>
                                            <div class="health-bar-track">
                                                <div class="health-fill" style="width: 85%;"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="screen-footer">
                                    <span>LEVEL 24</span>
                                    <span>AP 60/60</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    onMount() {
        const updatePreviews = (fromHex = false) => {
            let pbR, pbG, pbB;
            if (fromHex) {
                const hexVal = document.getElementById('hex-pipboy').value;
                if (/^[0-9A-Fa-f]{6}$/.test(hexVal)) {
                    const rgb = this.hexToRgb(hexVal);
                    pbR = rgb.r; pbG = rgb.g; pbB = rgb.b;
                    document.querySelector(`.modern-slider[data-channel="r"]`).value = pbR;
                    document.querySelector(`.modern-slider[data-channel="g"]`).value = pbG;
                    document.querySelector(`.modern-slider[data-channel="b"]`).value = pbB;
                } else return;
            } else {
                pbR = parseInt(document.querySelector(`.modern-slider[data-target="pipboy"][data-channel="r"]`).value);
                pbG = parseInt(document.querySelector(`.modern-slider[data-target="pipboy"][data-channel="g"]`).value);
                pbB = parseInt(document.querySelector(`.modern-slider[data-target="pipboy"][data-channel="b"]`).value);
            }

            if (!fromHex) document.getElementById('hex-pipboy').value = this.rgbToHex(pbR, pbG, pbB);
            document.getElementById('val-pipboy-r').textContent = pbR;
            document.getElementById('val-pipboy-g').textContent = pbG;
            document.getElementById('val-pipboy-b').textContent = pbB;

            const screen = document.getElementById('live-pb-screen');
            if (screen) screen.style.setProperty('--pb-color', `rgb(${pbR}, ${pbG}, ${pbB})`);

            const pb = this.settings.find(s => s.id === 'pipboy');
            if (pb) { pb.r = pbR; pb.g = pbG; pb.b = pbB; }
        };

        document.querySelectorAll('.modern-slider').forEach(el => el.addEventListener('input', () => updatePreviews(false)));
        const hexInput = document.getElementById('hex-pipboy');
        if (hexInput) hexInput.addEventListener('input', () => updatePreviews(true));

        document.querySelectorAll('.preset-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector(`.modern-slider[data-channel="r"]`).value = btn.dataset.r;
                document.querySelector(`.modern-slider[data-channel="g"]`).value = btn.dataset.g;
                document.querySelector(`.modern-slider[data-channel="b"]`).value = btn.dataset.b;
                updatePreviews(false);
            });
        });

        const saveBtn = document.getElementById('save-colors');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const pb = this.settings.find(s => s.id === 'pipboy');
                window.chrome.webview.postMessage({
                    type: 'SAVE_PIPBOY_COLORS',
                    r: pb.r, g: pb.g, b: pb.b
                });
            });
        }

        const resetBtn = document.getElementById('reset-colors');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const defaults = { r: 26, g: 255, b: 128 };
                document.querySelectorAll('.modern-slider').forEach(el => {
                    el.value = defaults[el.getAttribute('data-channel')];
                });
                updatePreviews(false);
            });
        }

        window.chrome.webview.addEventListener('message', (event) => {
            if (event.data.type === 'PIPBOY_DATA') {
                const badge = document.getElementById('pb-live-badge');
                if (badge) {
                    badge.textContent = 'LIVE';
                    badge.classList.add('live');
                    if (this._liveTimeout) clearTimeout(this._liveTimeout);
                    this._liveTimeout = setTimeout(() => {
                        badge.textContent = '';
                        badge.classList.remove('live');
                    }, 5000);
                }
            }
        });
    }

    rgbToHex(r, g, b) {
        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    hexToRgb(hex) {
        const bigint = parseInt(hex, 16);
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
    }
}
