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
    this.setupFallback();
    this.setupAccessibility();
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

  setupFallback() {
    // Check if PDF embed is supported
    const pdfViewer = document.querySelector('.pdf-viewer');
    const fallback = document.querySelector('.pdf-fallback');
    
    if (!pdfViewer || !fallback) return;

    // Test if embed worked
    setTimeout(() => {
      try {
        // If the embed has no content, show fallback
        if (pdfViewer.offsetHeight < 100) {
          pdfViewer.style.display = 'none';
          fallback.style.display = 'flex';
        } else {
          // PDF loaded successfully, ensure interactive elements work
          this.enhancePDFInteractivity();
        }
    } catch (error) {
        console.warn('PDF embed check failed:', error);
        pdfViewer.style.display = 'none';
        fallback.style.display = 'flex';
      }
    }, 2000);
  }

  enhancePDFInteractivity() {
    // Ensure PDF interactive elements work properly
    const pdfViewer = document.querySelector('.pdf-viewer');
    if (!pdfViewer) return;

    // Add event listeners to handle PDF interactions
    pdfViewer.addEventListener('load', () => {
      console.log('PDF loaded with interactive elements');
    });

    // Handle PDF link clicks that might not work in embed
    pdfViewer.addEventListener('click', (e) => {
      // Let the PDF handle its own interactions
      // This is just a fallback for edge cases
    });

    // Ensure the PDF gets focus for keyboard navigation
    pdfViewer.setAttribute('tabindex', '0');
    
    // Add some styling to ensure interactive elements are visible
    pdfViewer.style.cssText += `
      pointer-events: auto !important;
      user-select: none;
    `;
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
      this.audioToggle.style.outline = '3px solid #667eea';
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
  
  .mobile-device .pdf-viewer {
    min-height: 400px !important;
  }
  
  @media (max-width: 768px) {
    .mobile-device .pdf-viewer {
      min-height: 350px !important;
    }
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