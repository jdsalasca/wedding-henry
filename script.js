// PDF Viewer Manager - Handles multiple fallback methods for PDF display
class PDFViewerManager {
    constructor() {
        this.currentMethod = 0;
        this.methods = [
            { id: 'google-drive-viewer', name: 'Google Drive', timeout: 8000 },
            { id: 'pdfjs-viewer', name: 'PDF.js', timeout: 5000 },
            { id: 'embed-viewer', name: 'Embed', timeout: 3000 },
            { id: 'object-viewer', name: 'Object', timeout: 3000 },
            { id: 'google-docs-viewer', name: 'Google Docs', timeout: 5000 },
            { id: 'google-gview-viewer', name: 'Google GView', timeout: 8000 },
            { id: 'iframe-viewer', name: 'Iframe', timeout: 3000 }
        ];
        this.loader = document.getElementById('pdf-loader');
        this.fallback = document.querySelector('.pdf-fallback');
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isDesktop = !this.isMobile;
        
        console.log('PDF Viewer initialized:', { isMobile: this.isMobile, isDesktop: this.isDesktop });
    }

    async init() {
        console.log('Starting PDF viewer initialization...');
        
        // Show loader
        this.showLoader();
        
        // Start with the most appropriate method based on device
        if (this.isMobile) {
            console.log('Mobile device detected, starting with Google GView');
            this.currentMethod = 5; // Start with Google GView for mobile
        } else {
            console.log('Desktop device detected, starting with Google Drive');
            this.currentMethod = 0; // Start with Google Drive for desktop
        }
        
        await this.tryCurrentMethod();
    }

    showLoader() {
        this.loader.style.display = 'flex';
        this.hideAllViewers();
    }

    hideLoader() {
        this.loader.style.display = 'none';
    }

    hideAllViewers() {
        this.methods.forEach(method => {
            const element = document.getElementById(method.id);
            if (element) {
                element.style.display = 'none';
            }
        });
        if (this.fallback) {
            this.fallback.style.display = 'none';
        }
    }

    async tryCurrentMethod() {
        if (this.currentMethod >= this.methods.length) {
            console.log('All methods failed, showing fallback');
            this.showFallback();
            return;
        }

        const method = this.methods[this.currentMethod];
        console.log(`Trying method ${this.currentMethod + 1}/${this.methods.length}: ${method.name}`);
        
        const element = document.getElementById(method.id);
        if (!element) {
            console.log(`Element ${method.id} not found, skipping`);
            this.currentMethod++;
            await this.tryCurrentMethod();
            return;
        }

        // Special handling for PDF.js
        if (method.id === 'pdfjs-viewer') {
            await this.tryPDFjs();
            return;
        }

        // Show the current viewer
        this.hideAllViewers();
        element.style.display = 'block';
        this.hideLoader();

        // Set up success/failure detection
        const success = await this.waitForLoad(element, method);
        
        if (success) {
            console.log(`✅ ${method.name} loaded successfully`);
            this.setupViewerInteractions(element);
        } else {
            console.log(`❌ ${method.name} failed to load, trying next method`);
            this.currentMethod++;
            await this.tryCurrentMethod();
        }
    }

    async waitForLoad(element, method) {
        return new Promise((resolve) => {
            let resolved = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.log(`${method.name} timed out after ${method.timeout}ms`);
                    resolve(false);
                }
            }, method.timeout);

            // For iframes, check for load events and CSP errors
            if (element.tagName === 'IFRAME') {
                const onLoad = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        
                        // Additional check for CSP/X-Frame-Options errors
                        setTimeout(() => {
                            try {
                                // Try to access iframe content to detect blocking
                                const iframeDoc = element.contentDocument || element.contentWindow.document;
                                if (iframeDoc && iframeDoc.body && iframeDoc.body.innerHTML.trim() !== '') {
                                    console.log(`${method.name} content loaded successfully`);
                                    resolve(true);
                                } else {
                                    console.log(`${method.name} loaded but content is empty or blocked`);
                                    resolve(false);
                                }
                            } catch (e) {
                                // Cross-origin or CSP error - but iframe might still work
                                console.log(`${method.name} cross-origin access blocked (normal), assuming success`);
                                resolve(true);
                            }
                        }, 1000);
                    }
                };

                const onError = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        console.log(`${method.name} failed to load (error event)`);
                        resolve(false);
                    }
                };

                element.addEventListener('load', onLoad, { once: true });
                element.addEventListener('error', onError, { once: true });
                
                // Check for immediate CSP violations in console
                this.monitorConsoleErrors(method.name, (hasError) => {
                    if (hasError && !resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        console.log(`${method.name} blocked by CSP`);
                        resolve(false);
                    }
                });
                
            } else {
                // For embed/object elements
                element.addEventListener('load', () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        resolve(true);
                    }
                }, { once: true });

                element.addEventListener('error', () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        resolve(false);
                    }
                }, { once: true });
            }
        });
    }

    monitorConsoleErrors(methodName, callback) {
        // Monitor for CSP and X-Frame-Options errors
        const originalError = console.error;
        const originalWarn = console.warn;
        
        const checkMessage = (message) => {
            const msgStr = String(message).toLowerCase();
            if (msgStr.includes('refused to display') || 
                msgStr.includes('x-frame-options') || 
                msgStr.includes('content security policy') ||
                msgStr.includes('csp') ||
                msgStr.includes('blocked by orb')) {
                callback(true);
            }
        };

        console.error = function(...args) {
            checkMessage(args.join(' '));
            originalError.apply(console, args);
        };

        console.warn = function(...args) {
            checkMessage(args.join(' '));
            originalWarn.apply(console, args);
        };

        // Restore after timeout
        setTimeout(() => {
            console.error = originalError;
            console.warn = originalWarn;
        }, 3000);
    }

    async tryPDFjs() {
        console.log('Initializing PDF.js viewer...');
        
        if (typeof pdfjsLib === 'undefined') {
            console.log('PDF.js library not loaded, skipping');
            this.currentMethod++;
            await this.tryCurrentMethod();
            return;
        }

        try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            const canvas = document.getElementById('pdf-canvas');
            const ctx = canvas.getContext('2d');
            
            // Try to load the PDF
            const loadingTask = pdfjsLib.getDocument('wedding-invitation-compressed.pdf');
            const pdf = await loadingTask.promise;
            
            // Render first page
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.5 });
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
            
            // Show PDF.js viewer
            this.hideAllViewers();
            document.getElementById('pdfjs-viewer').style.display = 'block';
            this.hideLoader();
            
            console.log('✅ PDF.js loaded successfully');
            this.setupPDFjsControls(pdf);
            
        } catch (error) {
            console.log('❌ PDF.js failed:', error);
            this.currentMethod++;
            await this.tryCurrentMethod();
        }
    }

    setupPDFjsControls(pdf) {
        let currentPage = 1;
        const totalPages = pdf.numPages;
        
        document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages}`;
        
        // Page navigation would go here if needed
        // For a single-page invitation, this is mostly for completeness
    }

    setupViewerInteractions(element) {
        // Add any viewer-specific interactions here
        console.log(`Setting up interactions for ${element.id}`);
    }

    showFallback() {
        console.log('Showing fallback content');
        this.hideAllViewers();
        this.hideLoader();
        
        if (this.fallback) {
            this.fallback.style.display = 'block';
        }
    }
}

// Background music functionality
class BackgroundMusic {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.hasInteracted = false;
    }

    init() {
        // Create audio element
        this.audio = new Audio('background-music.mp3');
        this.audio.loop = true;
        this.audio.volume = 0.3;
        
        // Wait for user interaction before playing
        document.addEventListener('click', () => this.handleUserInteraction(), { once: true });
        document.addEventListener('touchstart', () => this.handleUserInteraction(), { once: true });
        
        console.log('Background music initialized (waiting for user interaction)');
    }

    handleUserInteraction() {
        this.hasInteracted = true;
        // Auto-play is disabled by default for better UX
        // Users can enable it by uncommenting the next line
        // this.play();
    }

    async play() {
        if (!this.hasInteracted || !this.audio) return;
        
        try {
            await this.audio.play();
            this.isPlaying = true;
            console.log('Background music started');
        } catch (error) {
            console.log('Could not play background music:', error);
        }
    }

    pause() {
        if (this.audio && this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            console.log('Background music paused');
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing PDF viewer...');
    
    const pdfManager = new PDFViewerManager();
    const musicManager = new BackgroundMusic();
    
    // Initialize PDF viewer
    await pdfManager.init();
    
    // Initialize background music (optional)
    musicManager.init();
    
    // Setup audio button functionality
    const audioToggle = document.getElementById('audio-toggle');
    const audioElement = document.getElementById('background-audio');
    
    if (audioToggle && audioElement) {
        let isPlaying = false;
        
        audioToggle.addEventListener('click', async () => {
            try {
                if (isPlaying) {
                    audioElement.pause();
                    audioToggle.classList.remove('playing');
                    audioToggle.querySelector('.audio-text').textContent = 'Activar música';
                    isPlaying = false;
                    console.log('Music paused');
                } else {
                    await audioElement.play();
                    audioToggle.classList.add('playing');
                    audioToggle.querySelector('.audio-text').textContent = 'Pausar música';
                    isPlaying = true;
                    console.log('Music started');
                }
            } catch (error) {
                console.log('Error toggling music:', error);
                // Fallback: show user-friendly message
                audioToggle.querySelector('.audio-text').textContent = 'Error de audio';
            }
        });
        
        // Handle audio events
        audioElement.addEventListener('ended', () => {
            audioToggle.classList.remove('playing');
            audioToggle.querySelector('.audio-text').textContent = 'Activar música';
            isPlaying = false;
        });
        
        audioElement.addEventListener('error', () => {
            console.log('Audio loading error');
            audioToggle.querySelector('.audio-text').textContent = 'Audio no disponible';
        });
    }
    
    console.log('All systems initialized');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden');
    } else {
        console.log('Page visible');
    }
});