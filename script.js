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
    const pdfEmbed = document.getElementById('pdf-embed');
    const pdfObject = document.getElementById('pdf-object');
    const pdfGoogleViewer = document.getElementById('pdf-google-viewer');
    const pdfIframe = document.getElementById('pdf-iframe');
    const pdfLoader = document.getElementById('pdf-loader');
    const pdfFallback = document.querySelector('.pdf-fallback');

    if (!pdfEmbed || !pdfObject || !pdfGoogleViewer || !pdfIframe || !pdfLoader) {
      console.warn('PDF viewer elements not found');
      return;
    }

    // Show loader initially
    pdfLoader.style.display = 'flex';

    // Try different PDF loading methods in order
    this.tryPDFMethod('embed', pdfEmbed, () => {
      this.tryPDFMethod('object', pdfObject, () => {
        this.tryPDFMethod('google-viewer', pdfGoogleViewer, () => {
          this.tryPDFMethod('iframe', pdfIframe, () => {
            // All methods failed, show fallback
            console.warn('All PDF loading methods failed, showing fallback');
            this.hideAllPDFViewers();
            pdfLoader.style.display = 'none';
            if (pdfFallback) {
              pdfFallback.style.display = 'block';
            }
          });
        });
      });
    });
  }

  tryPDFMethod(method, element, fallback) {
    console.log(`Trying PDF method: ${method}`);
    
    let hasLoaded = false;
    const timeout = setTimeout(() => {
      if (!hasLoaded) {
        console.log(`PDF method ${method} timed out`);
        fallback();
      }
    }, 5000);

    const onSuccess = () => {
      if (hasLoaded) return;
      hasLoaded = true;
      clearTimeout(timeout);
      
      // For embed and object, check if content is actually rendered
      if (method === 'embed' || method === 'object') {
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          if (rect.height > 100 && rect.width > 100) {
            console.log(`PDF method ${method} loaded successfully`);
            this.showPDFViewer(element);
          } else {
            console.log(`PDF method ${method} loaded but no content visible`);
            fallback();
          }
        }, 1000);
      } else {
        // For iframes (including Google Docs viewer), assume success
        console.log(`PDF method ${method} loaded successfully`);
        this.showPDFViewer(element);
      }
    };

    const onError = () => {
      if (hasLoaded) return;
      hasLoaded = true;
      clearTimeout(timeout);
      console.log(`PDF method ${method} failed to load`);
      fallback();
    };

    // Set up event listeners based on element type
    if (method === 'embed' || method === 'object') {
      element.addEventListener('load', onSuccess);
      element.addEventListener('error', onError);
    } else if (method === 'google-viewer' || method === 'iframe') {
      element.addEventListener('load', onSuccess);
      element.addEventListener('error', onError);
      // For Google Docs viewer, also try to detect if it loads properly
      if (method === 'google-viewer') {
        // Give Google Docs viewer a bit more time to load
        setTimeout(() => {
          if (!hasLoaded) {
            onSuccess(); // Assume it worked if no error occurred
          }
        }, 3000);
      }
    }

    // Show the element to trigger loading
    element.style.display = 'block';
  }

  showPDFViewer(element) {
    const pdfLoader = document.getElementById('pdf-loader');
    
    // Hide loader
    if (pdfLoader) {
      pdfLoader.style.display = 'none';
    }
    
    // Hide all other PDF viewers
    this.hideAllPDFViewers();
    
    // Show the successful viewer
    element.style.display = 'block';
    
    // Setup PDF link handling
    this.setupPDFLinkHandling();
  }

  hideAllPDFViewers() {
    const viewers = [
      document.getElementById('pdf-embed'),
      document.getElementById('pdf-object'),
      document.getElementById('pdf-google-viewer'),
      document.getElementById('pdf-iframe')
    ];
    
    viewers.forEach(viewer => {
      if (viewer) {
        viewer.style.display = 'none';
      }
    });
  }

  showFallback() {
    const pdfEmbed = document.getElementById('pdf-embed');
    const pdfObject = document.getElementById('pdf-object');
    const pdfIframe = document.getElementById('pdf-iframe');
    const pdfLoader = document.getElementById('pdf-loader');
    const fallback = document.querySelector('.pdf-fallback');
    
    // Hide all PDF viewers
    if (pdfEmbed) pdfEmbed.style.display = 'none';
    if (pdfObject) pdfObject.style.display = 'none';
    if (pdfIframe) pdfIframe.style.display = 'none';
    if (pdfLoader) pdfLoader.style.display = 'none';
    if (fallback) fallback.style.display = 'flex';
  }

  setupPDFLinkHandling() {
    // Handle clicks on the document that might be from PDF links
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