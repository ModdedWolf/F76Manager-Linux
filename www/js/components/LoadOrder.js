export class LoadOrder {
    render(data) {
        return `
            <div class="load-order-page">
                <div class="section-header">
                    <h2>Plugin Load Order</h2>
                    <p class="text-muted">Manage your ESP/ESM plugin sequence.</p>
                </div>
                <div class="empty-state">
                    <i data-lucide="list-ordered" style="width:64px; height:64px; opacity:0.2;"></i>
                    <p>Load order management is coming in the next update.</p>
                </div>
            </div>
        `;
    }
}
