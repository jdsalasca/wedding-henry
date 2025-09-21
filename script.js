// Audio functionality
class WeddingInvitation {
  constructor() {
    this.audio = document.getElementById('background-audio');
    this.audioToggle = document.getElementById('audio-toggle');
    this.isPlaying = false;
    
    this.init();
  }

  init() {
    this.setupAudio();
    this.setupPDFViewer();
    this.setupAccessibility();
  }

  setupPDFViewer() {
    const pdfViewer = document.getElementById('pdf-viewer');
    const pdfLoader = document.getElementById('pdf-loader');
    const fallback = document.querySelector('.pdf-fallback');
    
    if (!pdfViewer || !pdfLoader || !fallback) {
      console.warn('PDF viewer elements not found');
      return;
    }

    // Get the current domain for the PDF URL
    const currentDomain = window.location.origin;
    const pdfUrl = `${currentDomain}/wedding-invitation.pdf`;
    
    // Google Docs Viewer URL with mobile-optimized parameters
    const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true&chrome=false&navpanes=false&toolbar=false&statusbar=false&messages=false&scrollbar=false`;
    
    // Set the iframe source
    pdfViewer.src = googleViewerUrl;
    
    // Handle iframe load events
    pdfViewer.addEventListener('load', () => {
      console.log('PDF viewer loaded');
      
      // Check if Google Docs shows error message
      setTimeout(() => {
        this.checkGoogleDocsStatus();
      }, 2000);
    });
    
    pdfViewer.addEventListener('error', () => {
      console.warn('PDF viewer failed to load');
      this.showFallback();
    });
    
    // Fallback timeout - if Google Docs doesn't load within 8 seconds
    setTimeout(() => {
      if (pdfLoader.style.display !== 'none') {
        console.warn('PDF viewer timeout, showing fallback');
        this.showFallback();
      }
    }, 8000);
  }

  checkGoogleDocsStatus() {
    const pdfViewer = document.getElementById('pdf-viewer');
    const pdfLoader = document.getElementById('pdf-loader');
    
    try {
      // Try to access iframe content to check for error messages
      const iframeDoc = pdfViewer.contentDocument || pdfViewer.contentWindow.document;
      
      if (iframeDoc) {
        const bodyText = iframeDoc.body ? iframeDoc.body.innerText.toLowerCase() : '';
        
        // Check for Google Docs error messages
        if (bodyText.includes('couldn\'t preview file') || 
            bodyText.includes('file is too large') ||
            bodyText.includes('preview not available') ||
            bodyText.includes('unable to preview')) {
          console.warn('Google Docs Viewer shows error, using fallback');
          this.showFallback();
          return;
        }
        
        // If we get here, Google Docs is working
        pdfLoader.style.display = 'none';
        pdfViewer.style.display = 'block';
        this.setupPDFLinkHandling();
      } else {
        // Iframe not accessible, but that's normal for Google Docs
        pdfLoader.style.display = 'none';
        pdfViewer.style.display = 'block';
        this.setupPDFLinkHandling();
      }
    } catch (error) {
      // CORS error is expected with Google Docs Viewer
      // Assume it's working if we can't access it
      pdfLoader.style.display = 'none';
      pdfViewer.style.display = 'block';
      this.setupPDFLinkHandling();
    }
  }

  showFallback() {
    const pdfViewer = document.getElementById('pdf-viewer');
    const pdfLoader = document.getElementById('pdf-loader');
    const fallback = document.querySelector('.pdf-fallback');
    
    if (pdfViewer) pdfViewer.style.display = 'none';
    if (pdfLoader) pdfLoader.style.display = 'none';
    if (fallback) fallback.style.display = 'flex';
  }

  setupPDFLinkHandling() {
    // Handle messages from the iframe (Google Docs Viewer)
    window.addEventListener('message', (event) => {
      // Google Docs Viewer sends messages about link clicks
      if (event.data && event.data.type === 'link-click') {
        this.openLinkInPopup(event.data.url);
      }
    });

    // Also handle clicks on the document that might be from PDF links
    document.addEventListener('click', (e) => {
      // Check if the click target is a link
      if (e.target.tagName === 'A' && e.target.href) {
        e.preventDefault();
        this.openLinkInPopup(e.target.href);
      }
    });
  }

  openLinkInPopup(url) {
    // Open link in popup window
    const popup = window.open(
      url, 
      '_blank', 
      'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
    );
    
    if (!popup) {
      // Fallback if popup is blocked
      window.open(url, '_blank');
    }
  }

  setupAudio() {
    if (!this.audio || !this.audioToggle) {
      console.warn('Audio elements not found');
      return;
    }

    // Update button text and state
    const updateButton = () => {
      this.isPlaying = !this.audio.paused;
      
      const audioText = this.audioToggle.querySelector('.audio-text');
      const audioIcon = this.audioToggle.querySelector('.audio-icon');
      
      if (this.isPlaying) {
        this.audioToggle.classList.add('playing');
        this.audioToggle.setAttribute('aria-pressed', 'true');
        audioText.textContent = 'Desactivar música';
        audioIcon.textContent = '♫';
      } else {
        this.audioToggle.classList.remove('playing');
        this.audioToggle.setAttribute('aria-pressed', 'false');
        audioText.textContent = 'Activar música';
        audioIcon.textContent = '♪';
      }
    };

    // Handle audio toggle click
    this.audioToggle.addEventListener('click', async () => {
      await this.toggleAudio();
    });

    // Handle audio events
    this.audio.addEventListener('play', updateButton);
    this.audio.addEventListener('pause', updateButton);
    this.audio.addEventListener('ended', updateButton);
    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.showAudioError();
    });

    // Initial state
    updateButton();

    // Auto-play on first user interaction (required by browsers)
    this.setupAutoPlay();
  }

  async toggleAudio() {
    try {
      if (this.audio.paused) {
        await this.playAudio();
      } else {
        this.audio.pause();
      }
    } catch (error) {
      console.error('Audio toggle error:', error);
      this.showAudioError();
    }
  }

  async playAudio() {
    try {
      // Reset audio to beginning if it ended
      if (this.audio.ended) {
        this.audio.currentTime = 0;
      }
      
      await this.audio.play();
    } catch (error) {
      console.error('Playback failed:', error);
      
      // Handle autoplay policy restrictions
      if (error.name === 'NotAllowedError') {
        this.showUserInteractionMessage();
      } else {
        this.showAudioError();
      }
    }
  }

  setupAutoPlay() {
    // Try to auto-play on first user interaction
    const tryAutoPlay = async () => {
      if (this.audio.paused) {
        await this.playAudio();
      }
      
      // Remove listeners after first successful interaction
      document.removeEventListener('click', tryAutoPlay);
      document.removeEventListener('touchstart', tryAutoPlay);
      document.removeEventListener('keydown', tryAutoPlay);
    };

    // Add listeners for user interaction
    document.addEventListener('click', tryAutoPlay, { once: true });
    document.addEventListener('touchstart', tryAutoPlay, { once: true });
    document.addEventListener('keydown', tryAutoPlay, { once: true });
  }

  setupAccessibility() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Space bar to toggle audio
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        this.toggleAudio();
      }
    });

    // Focus management
    this.audioToggle.addEventListener('focus', () => {
      this.audioToggle.style.outline = '3px solid #2c2c2c';
      this.audioToggle.style.outlineOffset = '2px';
    });

    this.audioToggle.addEventListener('blur', () => {
      this.audioToggle.style.outline = 'none';
      this.audioToggle.style.outlineOffset = '0';
    });
  }

  showUserInteractionMessage() {
    // Create a subtle notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2c2c2c;
      color: white;
      padding: 10px 16px;
      border-radius: 4px;
      font-size: 0.85rem;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
      font-family: 'Crimson Text', serif;
    `;
    notification.textContent = 'Haz clic en el botón para activar la música';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 2500);
  }

  showAudioError() {
    const audioText = this.audioToggle.querySelector('.audio-text');
    if (audioText) {
      audioText.textContent = 'Error de audio';
      this.audioToggle.style.background = '#f5f5f5';
      this.audioToggle.style.borderColor = '#ccc';
      this.audioToggle.style.color = '#999';
    }
  }
}

// Utility functions
const utils = {
  // Check if device is mobile
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // Check if device supports touch
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // Optimize for mobile
  optimizeForMobile() {
    if (this.isMobile()) {
      // Add mobile-specific optimizations
      document.body.classList.add('mobile-device');
      
      // Prevent zoom on double tap
      let lastTouchEnd = 0;
      document.addEventListener('touchend', (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
    }
  }
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the main application
  new WeddingInvitation();
  
  // Optimize for mobile devices
  utils.optimizeForMobile();
  
  // Log successful initialization
  console.log('🎵 Wedding Invitation loaded successfully!');
});

// Handle page visibility changes (pause audio when tab is hidden)
document.addEventListener('visibilitychange', () => {
  const audio = document.getElementById('background-audio');
  if (audio) {
    if (document.hidden) {
      audio.pause();
    }
  }
});