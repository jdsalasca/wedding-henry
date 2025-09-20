// Wedding Invitation App - Main JavaScript
class WeddingInvitationApp {
    constructor() {
        this.pdfDoc = null;
        this.pageNum = 1;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.scale = 1.5;
        this.canvas = document.getElementById('pdf-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = document.getElementById('wedding-audio');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPDF();
        this.setupAudioControls();
        this.handleMobileOptimizations();
    }

    setupEventListeners() {
        // PDF navigation
        document.getElementById('prev-page').addEventListener('click', () => this.onPrevPage());
        document.getElementById('next-page').addEventListener('click', () => this.onNextPage());
        
        // Audio controls
        document.getElementById('play-pause-btn').addEventListener('click', () => this.toggleAudio());
        document.getElementById('volume-slider').addEventListener('input', (e) => this.setVolume(e.target.value));
        
        // Retry button
        document.getElementById('retry-btn').addEventListener('click', () => this.loadPDF());
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Touch events for mobile
        this.setupTouchEvents();
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    async loadPDF() {
        try {
            this.showLoading(true);
            this.hideError();
            
            // Configure PDF.js worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            // Load PDF
            const loadingTask = pdfjsLib.getDocument('wedding-invitation.pdf');
            this.pdfDoc = await loadingTask.promise;
            
            // Update page info
            document.getElementById('page-info').textContent = `Página ${this.pageNum} de ${this.pdfDoc.numPages}`;
            
            // Render first page
            await this.renderPage(this.pageNum);
            
            this.showLoading(false);
            this.updateNavigationButtons();
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showError();
            this.showLoading(false);
        }
    }

    async renderPage(num) {
        if (this.pageRendering) {
            this.pageNumPending = num;
            return;
        }
        
        this.pageRendering = true;
        
        try {
            const page = await this.pdfDoc.getPage(num);
            
            // Calculate scale based on container size
            const container = document.querySelector('.pdf-viewer');
            const containerWidth = container.clientWidth - 40; // Account for padding
            const containerHeight = container.clientHeight - 40;
            
            const viewport = page.getViewport({ scale: 1 });
            const scaleX = containerWidth / viewport.width;
            const scaleY = containerHeight / viewport.height;
            this.scale = Math.min(scaleX, scaleY, 2); // Max scale of 2
            
            const scaledViewport = page.getViewport({ scale: this.scale });
            
            // Set canvas dimensions
            this.canvas.height = scaledViewport.height;
            this.canvas.width = scaledViewport.width;
            
            // Render PDF page into canvas context
            const renderContext = {
                canvasContext: this.ctx,
                viewport: scaledViewport
            };
            
            await page.render(renderContext).promise;
            
            this.pageRendering = false;
            
            if (this.pageNumPending !== null) {
                await this.renderPage(this.pageNumPending);
                this.pageNumPending = null;
            }
            
        } catch (error) {
            console.error('Error rendering page:', error);
            this.pageRendering = false;
            this.showError();
        }
    }

    onPrevPage() {
        if (this.pageNum <= 1) return;
        this.pageNum--;
        this.queueRenderPage(this.pageNum);
    }

    onNextPage() {
        if (this.pageNum >= this.pdfDoc.numPages) return;
        this.pageNum++;
        this.queueRenderPage(this.pageNum);
    }

    queueRenderPage(num) {
        if (this.pageRendering) {
            this.pageNumPending = num;
        } else {
            this.renderPage(num);
        }
        
        // Update page info
        document.getElementById('page-info').textContent = `Página ${num} de ${this.pdfDoc.numPages}`;
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        prevBtn.disabled = this.pageNum <= 1;
        nextBtn.disabled = this.pageNum >= this.pdfDoc.numPages;
    }

    setupAudioControls() {
        // Set initial volume
        this.audio.volume = 0.7;
        
        // Audio event listeners
        this.audio.addEventListener('loadstart', () => console.log('Audio loading started'));
        this.audio.addEventListener('canplay', () => console.log('Audio can play'));
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.showAudioError();
        });
        
        // Update button text based on audio state
        this.audio.addEventListener('play', () => this.updateAudioButton(true));
        this.audio.addEventListener('pause', () => this.updateAudioButton(false));
        this.audio.addEventListener('ended', () => this.updateAudioButton(false));
    }

    toggleAudio() {
        if (this.audio.paused) {
            this.playAudio();
        } else {
            this.pauseAudio();
        }
    }

    async playAudio() {
        try {
            await this.audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
            this.showAudioError();
        }
    }

    pauseAudio() {
        this.audio.pause();
    }

    setVolume(value) {
        this.audio.volume = parseFloat(value);
    }

    updateAudioButton(isPlaying) {
        const btn = document.getElementById('play-pause-btn');
        const playIcon = btn.querySelector('.play-icon');
        const pauseIcon = btn.querySelector('.pause-icon');
        const btnText = btn.querySelector('.btn-text');
        
        if (isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline';
            btnText.textContent = 'Pausar Música';
        } else {
            playIcon.style.display = 'inline';
            pauseIcon.style.display = 'none';
            btnText.textContent = 'Reproducir Música';
        }
    }

    showAudioError() {
        const btn = document.getElementById('play-pause-btn');
        const btnText = btn.querySelector('.btn-text');
        btnText.textContent = 'Error de Audio';
        btn.disabled = true;
        
        setTimeout(() => {
            btnText.textContent = 'Reproducir Música';
            btn.disabled = false;
        }, 3000);
    }

    handleMobileOptimizations() {
        // Detect mobile devices
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Adjust scale for mobile
            this.scale = Math.min(this.scale, 1.2);
            
            // Add mobile-specific classes
            document.body.classList.add('mobile-device');
            
            // Handle orientation change
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.handleResize();
                }, 500);
            });
        }
        
        // Handle touch-friendly interactions
        this.setupTouchGestures();
    }

    setupTouchEvents() {
        let startX = 0;
        let startY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        }, { passive: true });
        
        this.canvas.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const touch = e.changedTouches[0];
            const diffX = startX - touch.clientX;
            const diffY = startY - touch.clientY;
            
            // Horizontal swipe detection
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - next page
                    this.onNextPage();
                } else {
                    // Swipe right - previous page
                    this.onPrevPage();
                }
            }
            
            startX = 0;
            startY = 0;
        }, { passive: true });
    }

    setupTouchGestures() {
        // Pinch to zoom (basic implementation)
        let initialDistance = 0;
        let currentScale = this.scale;
        
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = this.getDistance(e.touches[0], e.touches[1]);
                currentScale = this.scale;
            }
        }, { passive: true });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const scaleChange = currentDistance / initialDistance;
                this.scale = Math.max(0.5, Math.min(3, currentScale * scaleChange));
                this.renderPage(this.pageNum);
            }
        });
    }

    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    handleKeyboard(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                this.onPrevPage();
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                this.onNextPage();
                break;
            case ' ':
                e.preventDefault();
                this.toggleAudio();
                break;
            case 'Escape':
                this.pauseAudio();
                break;
        }
    }

    handleResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            if (this.pdfDoc) {
                this.renderPage(this.pageNum);
            }
        }, 250);
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const pdfViewer = document.querySelector('.pdf-viewer');
        
        if (show) {
            loading.style.display = 'flex';
            pdfViewer.style.display = 'none';
        } else {
            loading.style.display = 'none';
            pdfViewer.style.display = 'flex';
        }
    }

    showError() {
        const errorMsg = document.getElementById('error-message');
        const pdfViewer = document.querySelector('.pdf-viewer');
        
        errorMsg.style.display = 'block';
        pdfViewer.style.display = 'none';
    }

    hideError() {
        const errorMsg = document.getElementById('error-message');
        errorMsg.style.display = 'none';
    }

    // Auto-play attempt with user interaction fallback
    attemptAutoplay() {
        // Try to autoplay after user interaction
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Autoplay was prevented, show play button
                console.log('Autoplay prevented, user interaction required');
            });
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new WeddingInvitationApp();
    
    // Attempt autoplay on first user interaction
    let hasInteracted = false;
    const enableAutoplay = () => {
        if (!hasInteracted) {
            hasInteracted = true;
            app.attemptAutoplay();
            document.removeEventListener('click', enableAutoplay);
            document.removeEventListener('touchstart', enableAutoplay);
        }
    };
    
    document.addEventListener('click', enableAutoplay);
    document.addEventListener('touchstart', enableAutoplay);
});

// Service Worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}