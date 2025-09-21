// Global variables
let currentPdfDoc = null;
let currentPageNum = 1;
let totalPages = 1;
let isAudioPlaying = false;

// Audio handling
const audioElement = document.getElementById('background-audio');
const audioToggle = document.getElementById('audio-toggle');

// PDF viewer elements
const pdfLoader = document.getElementById('pdf-loader');
const oneDriveViewer = document.getElementById('onedrive-viewer');
const pdfjsViewer = document.getElementById('pdfjs-viewer');
const embedViewer = document.getElementById('embed-viewer');
const objectViewer = document.getElementById('object-viewer');
const googleViewer = document.getElementById('google-viewer');
const iframeViewer = document.getElementById('iframe-viewer');
const pdfFallback = document.querySelector('.pdf-fallback');

// PDF.js controls
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const pdfCanvas = document.getElementById('pdf-canvas');

// Document ready handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Document loaded, setting up PDF viewer...');
    
    // Initialize PDF viewer
    initializePDFViewer();
    
    // Setup audio controls
    setupAudioControls();
});

function setupAudioControls() {
    if (audioToggle && audioElement) {
        audioToggle.addEventListener('click', toggleAudio);
    }
}

function toggleAudio() {
    if (isAudioPlaying) {
        audioElement.pause();
        audioToggle.innerHTML = '<span class="audio-icon">♪</span><span class="audio-text">Activar música</span>';
        isAudioPlaying = false;
    } else {
        audioElement.play().catch(e => console.log('Audio play failed:', e));
        audioToggle.innerHTML = '<span class="audio-icon">♫</span><span class="audio-text">Pausar música</span>';
        isAudioPlaying = true;
    }
}

function setupPdfViewer() {
    console.log('Setting up PDF viewer...');
    
    // Try methods in order of preference
    const methods = [
        { name: 'OneDrive', func: tryOneDriveViewer },
        { name: 'PDF.js', func: tryPdfjsViewer },
        { name: 'Embed', func: tryEmbedViewer },
        { name: 'Object', func: tryObjectViewer },
        { name: 'Google Docs', func: tryGoogleViewer },
        { name: 'Iframe', func: tryIframeViewer }
    ];
    
    tryNextMethod(methods, 0);
}

function tryNextMethod(methods, index) {
    if (index >= methods.length) {
        console.log('All methods failed, showing fallback');
        showFallback();
        return;
    }
    
    const method = methods[index];
    console.log(`Trying method ${index + 1}: ${method.name}`);
    
    method.func(() => {
        console.log(`${method.name} viewer loaded successfully`);
        hidePdfLoader();
    }, () => {
        console.log(`${method.name} viewer failed, trying next method`);
        setTimeout(() => tryNextMethod(methods, index + 1), 1000);
    });
}

// Primary method: OneDrive Direct Link (no iframe embedding)
function tryOneDriveViewer() {
    console.log('🔗 Trying OneDrive Direct Link method...');
    
    const oneDriveViewer = document.getElementById('onedrive-viewer');
    const loader = document.getElementById('pdf-loader');
    
    if (oneDriveViewer) {
        // Hide loader
        if (loader) {
            loader.style.display = 'none';
        }
        
        oneDriveViewer.style.display = 'block';
        console.log('✅ OneDrive Direct Link method loaded successfully');
        return true;
    }
    
    console.log('❌ OneDrive Direct Link method failed');
    return false;
}

function tryPdfjsViewer(onSuccess, onError) {
    if (typeof pdfjsLib === 'undefined') {
        console.log('PDF.js library not loaded');
        onError();
        return;
    }
    
    pdfjsLib.getDocument('wedding-invitation-compressed.pdf')
        .promise
        .then(pdf => {
            currentPdfDoc = pdf;
            totalPages = pdf.numPages;
            setupPdfjsControls();
            renderPdfPage(1);
            showViewer(pdfjsViewer);
            onSuccess();
        })
        .catch(error => {
            console.log('PDF.js failed to load document:', error);
            onError();
        });
}

function setupPdfjsControls() {
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPageNum > 1) {
                currentPageNum--;
                renderPdfPage(currentPageNum);
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentPageNum < totalPages) {
                currentPageNum++;
                renderPdfPage(currentPageNum);
            }
        });
    }
}

function renderPdfPage(pageNum) {
    if (!currentPdfDoc || !pdfCanvas) return;
    
    currentPdfDoc.getPage(pageNum).then(page => {
        const viewport = page.getViewport({ scale: 1.5 });
        const context = pdfCanvas.getContext('2d');
        
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        page.render(renderContext);
        
        if (pageInfo) {
            pageInfo.textContent = `Página ${pageNum} de ${totalPages}`;
        }
        
        // Update button states
        if (prevPageBtn) {
            prevPageBtn.disabled = pageNum <= 1;
        }
        if (nextPageBtn) {
            nextPageBtn.disabled = pageNum >= totalPages;
        }
    });
}

function tryEmbedViewer(onSuccess, onError) {
    if (!embedViewer) {
        onError();
        return;
    }
    
    const timeout = setTimeout(() => {
        console.log('Embed viewer timeout');
        onError();
    }, 5000);
    
    embedViewer.onload = function() {
        clearTimeout(timeout);
        showViewer(embedViewer);
        onSuccess();
    };
    
    embedViewer.onerror = function() {
        clearTimeout(timeout);
        console.log('Embed viewer error');
        onError();
    };
    
    // Trigger load check
    if (embedViewer.src) {
        embedViewer.src = embedViewer.src;
    }
}

function tryObjectViewer(onSuccess, onError) {
    if (!objectViewer) {
        onError();
        return;
    }
    
    const timeout = setTimeout(() => {
        console.log('Object viewer timeout');
        onError();
    }, 5000);
    
    objectViewer.onload = function() {
        clearTimeout(timeout);
        showViewer(objectViewer);
        onSuccess();
    };
    
    objectViewer.onerror = function() {
        clearTimeout(timeout);
        console.log('Object viewer error');
        onError();
    };
    
    // Trigger load check
    if (objectViewer.data) {
        objectViewer.data = objectViewer.data;
    }
}

function tryGoogleViewer(onSuccess, onError) {
    if (!googleViewer) {
        onError();
        return;
    }
    
    const timeout = setTimeout(() => {
        console.log('Google viewer timeout');
        onError();
    }, 8000);
    
    googleViewer.onload = function() {
        clearTimeout(timeout);
        showViewer(googleViewer);
        onSuccess();
    };
    
    googleViewer.onerror = function() {
        clearTimeout(timeout);
        console.log('Google viewer error');
        onError();
    };
    
    // Force reload
    const currentSrc = googleViewer.src;
    googleViewer.src = '';
    setTimeout(() => {
        googleViewer.src = currentSrc;
    }, 100);
}

function tryIframeViewer(onSuccess, onError) {
    if (!iframeViewer) {
        onError();
        return;
    }
    
    const timeout = setTimeout(() => {
        console.log('Iframe viewer timeout');
        onError();
    }, 5000);
    
    iframeViewer.onload = function() {
        clearTimeout(timeout);
        showViewer(iframeViewer);
        onSuccess();
    };
    
    iframeViewer.onerror = function() {
        clearTimeout(timeout);
        console.log('Iframe viewer error');
        onError();
    };
    
    // Trigger load check
    if (iframeViewer.src) {
        iframeViewer.src = iframeViewer.src;
    }
}

function showViewer(viewerId) {
    // Hide all viewers first
    const allViewers = ['onedrive-viewer', 'google-drive-viewer', 'pdfjs-viewer', 'embed-viewer', 'object-viewer', 'google-docs-viewer', 'iframe-viewer'];
    allViewers.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
    
    // Hide fallback
    const pdfFallback = document.querySelector('.pdf-fallback');
    if (pdfFallback) {
        pdfFallback.style.display = 'none';
    }
    
    // Show selected viewer
    const selectedViewer = document.getElementById(viewerId);
    if (selectedViewer) {
        selectedViewer.style.display = 'block';
    }
}

function showFallback() {
    // Hide all viewers
    const allViewers = ['onedrive-viewer', 'google-drive-viewer', 'pdfjs-viewer', 'embed-viewer', 'object-viewer', 'google-docs-viewer', 'iframe-viewer'];
    allViewers.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
    
    // Show fallback content
    const pdfFallback = document.querySelector('.pdf-fallback');
    if (pdfFallback) {
        pdfFallback.style.display = 'block';
    }
}

function hideLoader() {
    const pdfLoader = document.getElementById('pdf-loader');
    if (pdfLoader) {
        pdfLoader.style.display = 'none';
    }
}

// PDF Viewer Methods
const pdfMethods = [
    {
        name: 'Google Drive Viewer',
        element: 'google-drive-viewer',
        test: () => tryGoogleDriveViewer(),
        priority: 1
    },
    {
        name: 'PDF.js',
        element: 'pdfjs-viewer',
        test: () => tryPDFJS(),
        priority: 2
    },
    {
        name: 'Embed',
        element: 'embed-viewer',
        test: () => tryEmbedViewer(),
        priority: 3
    },
    {
        name: 'Object',
        element: 'object-viewer',
        test: () => tryObjectViewer(),
        priority: 4
    },
    {
        name: 'Google Docs Viewer',
        element: 'google-docs-viewer',
        test: () => tryGoogleDocsViewer(),
        priority: 5
    },
    {
        name: 'Iframe',
        element: 'iframe-viewer',
        test: () => tryIframeViewer(),
        priority: 6
    }
];

// Method 1: Google Drive Viewer (Primary method)
function tryGoogleDriveViewer() {
    console.log('📱 Trying Google Drive Viewer method...');
    
    return new Promise((resolve) => {
        const iframe = document.getElementById('google-drive-viewer');
        
        if (!iframe) {
            console.log('❌ Google Drive iframe not found');
            resolve(false);
            return;
        }

        let hasLoaded = false;
        let hasErrored = false;
        let timeoutId;

        // Mobile-specific User-Agent detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('📱 Mobile device detected:', isMobile);

        // Success handler with enhanced mobile detection
        const onLoad = () => {
            if (hasErrored) return;
            console.log('📱 Google Drive iframe loaded, checking content...');
            
            // Extended wait time for mobile devices
            const checkDelay = isMobile ? 3000 : 2000;
            
            setTimeout(() => {
                try {
                    // Multiple methods to detect errors on mobile
                    let errorDetected = false;
                    let errorMessage = '';

                    // Method 1: Try to access iframe content (may fail due to CORS)
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        if (iframeDoc) {
                            const bodyText = iframeDoc.body.textContent || iframeDoc.body.innerText || '';
                            if (bodyText.includes("Couldn't preview file") || 
                                bodyText.includes("offline") || 
                                bodyText.includes("limited connectivity") ||
                                bodyText.includes("Try downloading") ||
                                bodyText.includes("You may be offline")) {
                                errorDetected = true;
                                errorMessage = bodyText.substring(0, 100);
                            }
                        }
                    } catch (corsError) {
                        console.log('📱 CORS prevented content access (expected on mobile)');
                    }

                    // Method 2: Check iframe dimensions (mobile-specific)
                    if (!errorDetected && isMobile) {
                        const rect = iframe.getBoundingClientRect();
                        if (rect.height < 100) {
                            console.log('📱 Iframe height too small on mobile:', rect.height);
                            errorDetected = true;
                            errorMessage = 'Iframe collapsed on mobile';
                        }
                    }

                    // Method 3: Check if iframe src is accessible
                    if (!errorDetected) {
                        // For mobile, we'll be more lenient and assume success if no obvious errors
                        if (isMobile) {
                            console.log('✅ Google Drive Viewer appears to be working on mobile');
                            hasLoaded = true;
                            clearTimeout(timeoutId);
                            showViewer('google-drive-viewer');
                            resolve(true);
                            return;
                        }
                    }

                    if (errorDetected) {
                        console.log('❌ Google Drive shows error on mobile:', errorMessage);
                        hasErrored = true;
                        iframe.style.display = 'none';
                        clearTimeout(timeoutId);
                        resolve(false);
                    } else {
                        console.log('✅ Google Drive Viewer loaded successfully');
                        hasLoaded = true;
                        clearTimeout(timeoutId);
                        showViewer('google-drive-viewer');
                        resolve(true);
                    }
                } catch (error) {
                    console.log('❌ Error checking Google Drive content:', error);
                    hasErrored = true;
                    iframe.style.display = 'none';
                    clearTimeout(timeoutId);
                    resolve(false);
                }
            }, checkDelay);
        };

        // Error handler
        const onError = () => {
            if (hasLoaded) return;
            console.log('❌ Google Drive iframe failed to load');
            hasErrored = true;
            iframe.style.display = 'none';
            clearTimeout(timeoutId);
            resolve(false);
        };

        // Timeout handler - more generous for mobile
        const timeoutDelay = isMobile ? 15000 : 10000;
        timeoutId = setTimeout(() => {
            if (!hasLoaded && !hasErrored) {
                console.log('⏰ Google Drive Viewer timeout on mobile');
                hasErrored = true;
                iframe.style.display = 'none';
                resolve(false);
            }
        }, timeoutDelay);

        // Set up event listeners
        iframe.addEventListener('load', onLoad);
        iframe.addEventListener('error', onError);

        // Force reload the iframe with mobile-optimized parameters
        const originalSrc = iframe.src;
        iframe.src = originalSrc + (originalSrc.includes('?') ? '&' : '?') + 'mobile=1&t=' + Date.now();
        
        console.log('📱 Loading Google Drive with mobile parameters:', iframe.src);
    });
}

// Initialize PDF viewer when page loads
async function initializePDFViewer() {
    console.log('🚀 Initializing PDF viewer...');
    
    // Sort methods by priority
    const sortedMethods = pdfMethods.sort((a, b) => a.priority - b.priority);
    
    for (const method of sortedMethods) {
        console.log(`🔄 Trying ${method.name}...`);
        
        try {
            const success = await method.test();
            if (success) {
                console.log(`✅ ${method.name} successful!`);
                hideLoader();
                return;
            }
        } catch (error) {
            console.log(`❌ ${method.name} failed:`, error);
        }
    }
    
    // If all methods fail, show fallback
    console.log('⚠️ All PDF methods failed, showing fallback content');
    showFallback();
    hideLoader();
}