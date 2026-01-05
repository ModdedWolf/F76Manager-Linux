import net from 'net';

export class PipBoyRelay {
    constructor(logger) {
        this.logger = logger || (() => { });
        this.client = null;
        this.isConnected = false;
        this.retryTimer = null;
        this.dataCallback = null;
    }

    start(onData) {
        this.dataCallback = onData;
        this.connect();
    }

    connect() {
        if (this.client) {
            this.client.destroy();
        }

        this.client = new net.Socket();

        this.client.on('connect', () => {
            this.isConnected = true;
            this.log('Connected to Pip-Boy on port 27000');
            if (this.retryTimer) {
                clearInterval(this.retryTimer);
                this.retryTimer = null;
            }
        });

        this.client.on('data', (data) => {
            if (this.dataCallback) {
                // PipBoy protocol involves a complex data structure.
                // We relay the raw buffer or basic info.
                // For now, we'll try to parse basic JSON if it is that format, 
                // but usually it's a binary protocol.
                this.dataCallback(data);
            }
        });

        this.client.on('error', (err) => {
            if (this.isConnected) {
                this.log(`Pip-Boy error: ${err.message}`);
            }
            this.isConnected = false;
            this.scheduleRetry();
        });

        this.client.on('close', () => {
            if (this.isConnected) {
                this.log('Pip-Boy connection closed');
            }
            this.isConnected = false;
            this.scheduleRetry();
        });

        this.client.connect(27000, '127.0.0.1');
    }

    scheduleRetry() {
        if (!this.retryTimer) {
            this.retryTimer = setInterval(() => {
                this.log('Retrying Pip-Boy connection...');
                this.connect();
            }, 10000); // Retry every 10s
        }
    }

    stop() {
        if (this.retryTimer) {
            clearInterval(this.retryTimer);
            this.retryTimer = null;
        }
        if (this.client) {
            this.client.destroy();
            this.client = null;
        }
        this.isConnected = false;
    }

    log(msg) {
        this.logger(`[PipBoyRelay] ${msg}`);
    }
}
