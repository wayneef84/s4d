/**
 * Debug Menu
 * Developer tools for testing and demonstration
 *
 * Keyboard Shortcut: Ctrl+Shift+D (or Cmd+Shift+D on Mac)
 *
 * @author Wayne Fong (wayneef84)
 * @version 1.0.0
 */

(function(window) {
    'use strict';

    var DebugMenu = {
        isOpen: false,
        overlay: null,

        /**
         * Initialize debug menu
         */
        init: function() {
            var self = this;

            // Keyboard shortcut: Ctrl+Shift+D (or Cmd+Shift+D)
            document.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                    e.preventDefault();
                    self.toggle();
                }
            });

            // Close button
            var closeBtn = document.getElementById('debugCloseBtn');
            if (closeBtn) {
                closeBtn.onclick = function() {
                    self.close();
                };
            }

            // Load Dataset Buttons
            document.getElementById('loadMixedDataset').onclick = function() { self.loadMixedDataset(); };
            document.getElementById('loadDHLDataset').onclick = function() { self.loadDHLDataset(); };
            document.getElementById('loadFedExDataset').onclick = function() { self.loadFedExDataset(); };
            document.getElementById('loadUPSDataset').onclick = function() { self.loadUPSDataset(); };

            // Quick Add Buttons
            document.getElementById('addDHLActive').onclick = function() { self.addTracking('1234567890', 'DHL'); };
            document.getElementById('addDHLDelivered').onclick = function() { self.addTracking('9876543210', 'DHL'); };
            document.getElementById('addFedExTransit').onclick = function() { self.addTracking('222222222222', 'FedEx'); };
            document.getElementById('addFedExException').onclick = function() { self.addTracking('999999999999', 'FedEx'); };
            document.getElementById('addUPSOutForDelivery').onclick = function() { self.addTracking('1Z999AA10123456781', 'UPS'); };
            document.getElementById('addUPSDelivered').onclick = function() { self.addTracking('1Z999AA10123456780', 'UPS'); };

            // Action Buttons
            document.getElementById('refreshAllTracking').onclick = function() { self.refreshAll(); };
            document.getElementById('clearAllData').onclick = function() { self.clearAll(); };

            console.log('[Debug] Debug menu initialized. Press Ctrl+Shift+D to toggle.');
        },

        /**
         * Toggle debug menu visibility
         */
        toggle: function() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },

        /**
         * Open debug menu
         */
        open: function() {
            var menu = document.getElementById('debugMenu');
            if (!menu) return;

            // Create overlay
            this.overlay = document.createElement('div');
            this.overlay.className = 'debug-overlay';
            this.overlay.onclick = this.close.bind(this);
            document.body.appendChild(this.overlay);

            // Show menu
            menu.style.display = 'block';
            this.isOpen = true;

            // Update stats
            this.updateStats();

            console.log('[Debug] Menu opened');
        },

        /**
         * Close debug menu
         */
        close: function() {
            var menu = document.getElementById('debugMenu');
            if (!menu) return;

            menu.style.display = 'none';

            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }

            this.isOpen = false;
            console.log('[Debug] Menu closed');
        },

        /**
         * Update debug stats display
         */
        updateStats: function() {
            if (!window.app || !window.app.trackings) return;

            var count = window.app.trackings.length;
            document.getElementById('debugTrackingCount').textContent = 'Trackings: ' + count;

            // Estimate DB size
            var dbSize = this.estimateDBSize();
            document.getElementById('debugDBSize').textContent = 'DB Size: ' + dbSize;
        },

        /**
         * Estimate IndexedDB size
         */
        estimateDBSize: function() {
            if (!window.app || !window.app.trackings) return '0 KB';

            var json = JSON.stringify(window.app.trackings);
            var bytes = new Blob([json]).size;

            if (bytes < 1024) {
                return bytes + ' B';
            } else if (bytes < 1024 * 1024) {
                return (bytes / 1024).toFixed(1) + ' KB';
            } else {
                return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
            }
        },

        /**
         * Load mixed test dataset (all carriers, various statuses)
         */
        loadMixedDataset: function() {
            console.log('[Debug] Loading mixed dataset...');

            var trackings = [
                { awb: '1234567890', carrier: 'DHL' },         // Active
                { awb: '9876543210', carrier: 'DHL' },         // Delivered
                { awb: '111111111111', carrier: 'FedEx' },     // Delivered
                { awb: '222222222222', carrier: 'FedEx' },     // In Transit
                { awb: '1Z999AA10123456784', carrier: 'UPS' }, // Out for Delivery
                { awb: '1Z999AA10123456789', carrier: 'UPS' }  // Exception
            ];

            this.loadTrackings(trackings);
        },

        /**
         * Load DHL test dataset (official sandbox numbers)
         */
        loadDHLDataset: function() {
            console.log('[Debug] Loading DHL test dataset...');

            var trackings = [
                { awb: '00340434161094042557', carrier: 'DHL' },
                { awb: '00340434161094038253', carrier: 'DHL' },
                { awb: '00340434161094032954', carrier: 'DHL' },
                { awb: '00340434161094027318', carrier: 'DHL' },
                { awb: '00340434161094022115', carrier: 'DHL' },
                { awb: '00340434161094015902', carrier: 'DHL' }
            ];

            this.loadTrackings(trackings);
        },

        /**
         * Load FedEx test dataset
         */
        loadFedExDataset: function() {
            console.log('[Debug] Loading FedEx test dataset...');

            var trackings = [
                { awb: '111111111111', carrier: 'FedEx' },     // Delivered
                { awb: '222222222222', carrier: 'FedEx' },     // In Transit
                { awb: '999999999999', carrier: 'FedEx' }      // Exception
            ];

            this.loadTrackings(trackings);
        },

        /**
         * Load UPS test dataset
         */
        loadUPSDataset: function() {
            console.log('[Debug] Loading UPS test dataset...');

            var trackings = [
                { awb: '1Z999AA10123456780', carrier: 'UPS' }, // Delivered
                { awb: '1Z999AA10123456784', carrier: 'UPS' }, // In Transit
                { awb: '1Z999AA10123456789', carrier: 'UPS' }  // Exception
            ];

            this.loadTrackings(trackings);
        },

        /**
         * Load array of trackings
         * @param {Array} trackings - Array of {awb, carrier} objects
         */
        loadTrackings: function(trackings) {
            if (!window.app || !window.app.ready || !window.app.db) {
                alert('⚠️ App not fully initialized. Please wait a moment and try again.');
                console.error('[Debug] App not initialized or not ready');
                return;
            }

            var self = this;
            var loaded = 0;
            var toLoad = [];

            // Filter out duplicates first
            trackings.forEach(function(tracking) {
                var exists = window.app.trackings.some(function(t) {
                    return t.awb === tracking.awb;
                });

                if (exists) {
                    console.log('[Debug] Skipping duplicate:', tracking.awb);
                } else {
                    toLoad.push(tracking);
                }
            });

            if (toLoad.length === 0) {
                alert('All trackings already exist!');
                return;
            }

            // Load trackings sequentially with 2.5 second delay to avoid rate limits
            function loadNext(index) {
                if (index >= toLoad.length) {
                    console.log('[Debug] Loaded ' + loaded + ' trackings');
                    self.updateStats();
                    window.app.showToast('Loaded ' + loaded + ' test trackings', 'success');
                    return;
                }

                var tracking = toLoad[index];
                console.log('[Debug] Loading ' + (index + 1) + '/' + toLoad.length + ':', tracking.awb);

                self.trackAndSave(tracking.awb, tracking.carrier)
                    .then(function() {
                        loaded++;
                        // Wait 2.5 seconds before next request
                        setTimeout(function() {
                            loadNext(index + 1);
                        }, 2500);
                    })
                    .catch(function(error) {
                        console.error('[Debug] Failed to load:', tracking.awb, error);
                        // Continue to next even on error
                        setTimeout(function() {
                            loadNext(index + 1);
                        }, 2500);
                    });
            }

            // Start loading
            loadNext(0);
            this.close();
        },

        /**
         * Add single tracking
         * @param {string} awb - Tracking number
         * @param {string} carrier - Carrier name
         */
        addTracking: function(awb, carrier) {
            console.log('[Debug] Adding tracking:', awb, carrier);

            if (!window.app || !window.app.ready || !window.app.db) {
                alert('⚠️ App not fully initialized. Please wait a moment and try again.');
                console.error('[Debug] App not initialized or not ready');
                return;
            }

            // Check if already exists
            var exists = window.app.trackings.some(function(t) {
                return t.awb === awb;
            });

            if (exists) {
                alert('Tracking already exists: ' + awb);
                return;
            }

            this.trackAndSave(awb, carrier);
            this.close();
        },

        /**
         * Track shipment and save to DB
         * @param {string} awb - Tracking number
         * @param {string} carrier - Carrier name
         */
        trackAndSave: function(awb, carrier) {
            var adapter;

            switch (carrier.toUpperCase()) {
                case 'DHL':
                    adapter = window.DHLAdapter;
                    break;
                case 'FEDEX':
                    adapter = window.FedExAdapter;
                    break;
                case 'UPS':
                    adapter = window.UPSAdapter;
                    break;
                default:
                    console.error('[Debug] Unknown carrier:', carrier);
                    return Promise.reject(new Error('Unknown carrier'));
            }

            return adapter.trackShipment(awb)
                .then(function(data) {
                    return window.app.db.saveTracking(data);
                })
                .then(function() {
                    return window.app.loadTrackings();
                })
                .catch(function(error) {
                    console.error('[Debug] Failed to add tracking:', error);
                    alert('Failed to add tracking: ' + error.message);
                });
        },

        /**
         * Refresh all trackings
         */
        refreshAll: function() {
            if (!window.app || !window.app.ready || !window.app.db) {
                alert('⚠️ App not fully initialized. Please wait a moment and try again.');
                console.error('[Debug] App not initialized or not ready');
                return;
            }

            if (!confirm('Refresh all trackings? This will fetch latest data for all shipments.')) {
                return;
            }

            console.log('[Debug] Refreshing all trackings...');

            window.app.refreshAllTracking()
                .then(function() {
                    console.log('[Debug] Refresh complete');
                    alert('All trackings refreshed successfully!');
                })
                .catch(function(error) {
                    console.error('[Debug] Refresh failed:', error);
                    alert('Failed to refresh: ' + error.message);
                });

            this.close();
        },

        /**
         * Clear all data
         */
        clearAll: function() {
            if (!window.app || !window.app.ready || !window.app.db) {
                alert('⚠️ App not fully initialized. Please wait a moment and try again.');
                console.error('[Debug] App not initialized or not ready');
                return;
            }

            if (!confirm('⚠️ Delete all tracking data? This cannot be undone!')) {
                return;
            }

            console.log('[Debug] Clearing all data...');

            window.app.db.clearAllTrackings()
                .then(function() {
                    return window.app.loadTrackings();
                })
                .then(function() {
                    console.log('[Debug] All data cleared');
                    alert('All data cleared successfully!');
                })
                .catch(function(error) {
                    console.error('[Debug] Clear failed:', error);
                    alert('Failed to clear data: ' + error.message);
                });

            this.close();
        }
    };

    // Export to global
    window.DebugMenu = DebugMenu;

})(window);
