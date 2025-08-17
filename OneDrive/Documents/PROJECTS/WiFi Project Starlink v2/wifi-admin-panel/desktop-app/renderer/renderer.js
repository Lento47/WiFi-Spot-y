// Desktop application renderer script
class WalletPassApp {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.updateServerStatus();
        this.startHealthCheck();
    }

    initializeElements() {
        // Server controls
        this.toggleServerBtn = document.getElementById('toggle-server');
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusText = document.getElementById('status-text');
        this.serverStatusDetail = document.getElementById('server-status-detail');
        this.healthStatus = document.getElementById('health-status');

        // Form elements
        this.userIdInput = document.getElementById('userId');
        this.userEmailInput = document.getElementById('userEmail');
        this.hoursInput = document.getElementById('hours');
        this.minutesInput = document.getElementById('minutes');

        // Wallet buttons
        this.appleWalletBtn = document.getElementById('apple-wallet');
        this.googlePayBtn = document.getElementById('google-pay');
        this.samsungPayBtn = document.getElementById('samsung-pay');
        this.genericWalletBtn = document.getElementById('generic-wallet');

        // Results
        this.resultsDiv = document.getElementById('results');
        this.resultContent = document.getElementById('result-content');
    }

    bindEvents() {
        // Server toggle
        this.toggleServerBtn.addEventListener('click', () => this.toggleServer());

        // Wallet generation buttons
        this.appleWalletBtn.addEventListener('click', () => this.generateWalletPass('apple'));
        this.googlePayBtn.addEventListener('click', () => this.generateWalletPass('google'));
        this.samsungPayBtn.addEventListener('click', () => this.generateWalletPass('samsung'));
        this.genericWalletBtn.addEventListener('click', () => this.generateWalletPass('generic'));

        // Form validation
        this.userIdInput.addEventListener('input', () => this.validateForm());
        this.userEmailInput.addEventListener('input', () => this.validateForm());
        this.hoursInput.addEventListener('input', () => this.validateForm());
        this.minutesInput.addEventListener('input', () => this.validateForm());
    }

    async updateServerStatus() {
        try {
            const status = await window.electronAPI.getServerStatus();
            this.updateStatusUI(status.isRunning);
        } catch (error) {
            console.error('Error getting server status:', error);
            this.updateStatusUI(false);
        }
    }

    updateStatusUI(isRunning) {
        if (isRunning) {
            this.statusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
            this.statusText.textContent = 'Running';
            this.serverStatusDetail.textContent = 'Active';
            this.toggleServerBtn.textContent = 'Stop Server';
            this.toggleServerBtn.className = 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors';
            this.enableWalletButtons();
        } else {
            this.statusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
            this.statusText.textContent = 'Stopped';
            this.serverStatusDetail.textContent = 'Inactive';
            this.toggleServerBtn.textContent = 'Start Server';
            this.toggleServerBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors';
            this.disableWalletButtons();
        }
    }

    async toggleServer() {
        try {
            const status = await window.electronAPI.getServerStatus();
            
            if (status.isRunning) {
                await window.electronAPI.stopServer();
                this.updateStatusUI(false);
            } else {
                await window.electronAPI.startServer();
                this.updateStatusUI(true);
            }
        } catch (error) {
            console.error('Error toggling server:', error);
            this.showNotification('Error toggling server', 'error');
        }
    }

    async startHealthCheck() {
        setInterval(async () => {
            try {
                const health = await window.electronAPI.checkServerHealth();
                this.healthStatus.textContent = health.status;
                this.healthStatus.className = 'mt-1 text-lg font-semibold text-green-600 dark:text-green-400';
            } catch (error) {
                this.healthStatus.textContent = 'Unhealthy';
                this.healthStatus.className = 'mt-1 text-lg font-semibold text-red-600 dark:text-red-400';
            }
        }, 5000);
    }

    validateForm() {
        const userId = this.userIdInput.value.trim();
        const userEmail = this.userEmailInput.value.trim();
        const hours = parseInt(this.hoursInput.value) || 0;
        const minutes = parseInt(this.minutesInput.value) || 0;

        const isValid = userId && userEmail && (hours > 0 || minutes > 0);
        
        // Enable/disable wallet buttons based on form validation
        const walletButtons = [this.appleWalletBtn, this.googlePayBtn, this.samsungPayBtn, this.genericWalletBtn];
        walletButtons.forEach(btn => {
            btn.disabled = !isValid;
        });

        return isValid;
    }

    enableWalletButtons() {
        const walletButtons = [this.appleWalletBtn, this.googlePayBtn, this.samsungPayBtn, this.genericWalletBtn];
        walletButtons.forEach(btn => {
            btn.disabled = false;
        });
    }

    disableWalletButtons() {
        const walletButtons = [this.appleWalletBtn, this.googlePayBtn, this.samsungPayBtn, this.genericWalletBtn];
        walletButtons.forEach(btn => {
            btn.disabled = true;
        });
    }

    async generateWalletPass(type) {
        if (!this.validateForm()) {
            this.showNotification('Please fill in all required fields', 'warning');
            return;
        }

        const data = {
            userId: this.userIdInput.value.trim(),
            userEmail: this.userEmailInput.value.trim(),
            credits: {
                hours: parseInt(this.hoursInput.value) || 0,
                minutes: parseInt(this.minutesInput.value) || 0
            }
        };

        try {
            let result;
            const button = this.getWalletButton(type);
            const originalText = button.textContent;
            
            // Show loading state
            button.disabled = true;
            button.textContent = 'Generating...';

            // Generate pass based on type
            switch (type) {
                case 'apple':
                    result = await window.electronAPI.generateAppleWalletPass(data);
                    break;
                case 'google':
                    result = await window.electronAPI.generateGooglePayPass(data);
                    break;
                case 'samsung':
                    result = await window.electronAPI.generateSamsungPayPass(data);
                    break;
                case 'generic':
                    result = await window.electronAPI.generateGenericWalletPass(data);
                    break;
                default:
                    throw new Error('Unknown wallet type');
            }

            // Show results
            this.showResults(result, type);
            this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} pass generated successfully!`, 'success');

        } catch (error) {
            console.error('Error generating wallet pass:', error);
            this.showNotification(`Error generating ${type} pass: ${error.message}`, 'error');
        } finally {
            // Restore button state
            const button = this.getWalletButton(type);
            button.disabled = false;
            button.textContent = this.getWalletButtonText(type);
        }
    }

    getWalletButton(type) {
        switch (type) {
            case 'apple': return this.appleWalletBtn;
            case 'google': return this.googlePayBtn;
            case 'samsung': return this.samsungPayBtn;
            case 'generic': return this.genericWalletBtn;
            default: return null;
        }
    }

    getWalletButtonText(type) {
        switch (type) {
            case 'apple': return '🍎 Apple Wallet';
            case 'google': return '🔵 Google Pay';
            case 'samsung': return '📱 Samsung Pay';
            case 'generic': return '💳 Generic Wallet';
            default: return '';
        }
    }

    showResults(result, type) {
        this.resultContent.innerHTML = '';

        if (result.success) {
            const resultHTML = this.createResultHTML(result, type);
            this.resultContent.innerHTML = resultHTML;
            this.resultsDiv.classList.remove('hidden');
        } else {
            this.resultContent.innerHTML = `
                <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p class="text-red-800 dark:text-red-200">${result.message || 'Failed to generate wallet pass'}</p>
                </div>
            `;
            this.resultsDiv.classList.remove('hidden');
        }
    }

    createResultHTML(result, type) {
        let content = '';

        if (type === 'apple' && result.passUrl) {
            content = `
                <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h4 class="font-medium text-green-900 dark:text-green-100 mb-2">✅ Apple Wallet Pass Generated</h4>
                    <p class="text-green-800 dark:text-green-200 mb-3">${result.message}</p>
                    <div class="space-y-2">
                        <p class="text-sm"><strong>File:</strong> ${result.filename}</p>
                        <p class="text-sm"><strong>URL:</strong> <a href="${result.passUrl}" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">${result.passUrl}</a></p>
                    </div>
                    <div class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p class="text-sm text-blue-800 dark:text-blue-200">
                            <strong>To add to Apple Wallet:</strong><br>
                            1. Click the URL above<br>
                            2. Safari will prompt "Add to Wallet"<br>
                            3. Confirm to add the pass
                        </p>
                    </div>
                </div>
            `;
        } else if (result.data) {
            content = `
                <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h4 class="font-medium text-green-900 dark:text-green-100 mb-2">✅ ${type.charAt(0).toUpperCase() + type.slice(1)} Pass Generated</h4>
                    <p class="text-green-800 dark:text-green-200 mb-3">${result.message}</p>
                    
                    <div class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h5 class="font-medium text-blue-900 dark:text-blue-100 mb-2">Instructions:</h5>
                        <ol class="text-sm text-blue-800 dark:text-blue-200 list-decimal list-inside space-y-1">
                            ${result.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                        </ol>
                    </div>

                    <div class="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h5 class="font-medium text-gray-900 dark:text-gray-100 mb-2">Pass Data:</h5>
                        <pre class="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">${JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                </div>
            `;
        }

        return content;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
        
        // Set colors based on type
        switch (type) {
            case 'success':
                notification.className += ' bg-green-500 text-white';
                break;
            case 'error':
                notification.className += ' bg-red-500 text-white';
                break;
            case 'warning':
                notification.className += ' bg-yellow-500 text-white';
                break;
            default:
                notification.className += ' bg-blue-500 text-white';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WalletPassApp();
});
