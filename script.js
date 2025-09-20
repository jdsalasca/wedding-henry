// Configuración global de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

class WeddingInvitationApp {
    constructor() {
        this.pdfDoc = null;
        this.pageNum = 1;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.scale = 1;
        this.canvas = document.getElementById('pdf-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = document.getElementById('audio');
        this.isAudioPlaying = false;
        
        // Elementos del DOM
        this.loadingEl = document.getElementById('loading');
        this.prevBtn = document.getElementById('prev');
        this.nextBtn = document.getElementById('next');
        this.pageInfo = document.getElementById('page-info');
        this.audioToggle = document.getElementById('audio-toggle');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPDF();
        this.setupAudio();
        this.handleResize();
    }

    setupEventListeners() {
        // Controles de navegación
        this.prevBtn.addEventListener('click', () => this.onPrevPage());
        this.nextBtn.addEventListener('click', () => this.onNextPage());
        
        // Control de audio
        this.audioToggle.addEventListener('click', () => this.toggleAudio());
        
        // Eventos de redimensionamiento
        window.addEventListener('resize', () => this.debounce(this.handleResize.bind(this), 250));
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 500);
        });
        
        // Eventos táctiles para móviles
        this.setupTouchEvents();
        
        // Eventos de teclado
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    setupTouchEvents() {
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        const threshold = 50;
        const maxTime = 500; // Máximo tiempo para considerar un swipe

        // Usar el contenedor PDF en lugar del canvas para mejor detección
        const touchArea = this.canvas.parentElement;

        touchArea.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
        }, { passive: true });

        touchArea.addEventListener('touchmove', (e) => {
            // Prevenir scroll solo durante el movimiento activo
            if (e.touches.length === 1) {
                e.preventDefault();
            }
        }, { passive: false });

        touchArea.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = Math.abs(touch.clientY - startY);
            const deltaTime = Date.now() - startTime;
            
            // Validar que sea un swipe válido
            if (deltaTime < maxTime && deltaY < threshold && Math.abs(deltaX) > threshold) {
                if (deltaX > 0) {
                    this.onPrevPage();
                } else {
                    this.onNextPage();
                }
            }
        }, { passive: true });

        // Agregar indicadores visuales para swipe
        this.addSwipeIndicators();
    }

    addSwipeIndicators() {
        // Crear indicadores visuales para swipe en móviles
        const container = this.canvas.parentElement;
        
        // Indicador izquierdo
        const leftIndicator = document.createElement('div');
        leftIndicator.className = 'swipe-indicator swipe-left';
        leftIndicator.innerHTML = '‹';
        container.appendChild(leftIndicator);
        
        // Indicador derecho
        const rightIndicator = document.createElement('div');
        rightIndicator.className = 'swipe-indicator swipe-right';
        rightIndicator.innerHTML = '›';
        container.appendChild(rightIndicator);
        
        // Mostrar indicadores solo en móviles
        if (this.isMobile()) {
            setTimeout(() => {
                leftIndicator.style.opacity = '0.7';
                rightIndicator.style.opacity = '0.7';
                
                // Ocultar después de 3 segundos
                setTimeout(() => {
                    leftIndicator.style.opacity = '0';
                    rightIndicator.style.opacity = '0';
                }, 3000);
            }, 1000);
        }
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
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
        }
    }

    async loadPDF() {
        try {
            this.showLoading(true);
            
            const loadingTask = pdfjsLib.getDocument({
                url: 'wedding-invitation.pdf',
                cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
                cMapPacked: true
            });
            
            this.pdfDoc = await loadingTask.promise;
            this.updatePageInfo();
            this.checkSinglePage();
            this.renderPage(this.pageNum);
            
        } catch (error) {
            console.error('Error cargando PDF:', error);
            this.showError('Error al cargar la invitación');
        }
    }

    checkSinglePage() {
        // Ocultar controles de navegación si solo hay una página
        const controls = document.querySelector('.controls');
        if (this.pdfDoc.numPages === 1) {
            controls.classList.add('single-page');
        } else {
            controls.classList.remove('single-page');
        }
    }

    async renderPage(num) {
        if (this.pageRendering) {
            this.pageNumPending = num;
            return;
        }
        
        this.pageRendering = true;
        this.showLoading(true);
        
        try {
            const page = await this.pdfDoc.getPage(num);
            const viewport = this.calculateOptimalViewport(page);
            const outputScale = this.getOutputScale();
            
            this.canvas.width = Math.floor(viewport.width * outputScale.sx);
            this.canvas.height = Math.floor(viewport.height * outputScale.sy);
            this.canvas.style.width = Math.floor(viewport.width) + 'px';
            this.canvas.style.height = Math.floor(viewport.height) + 'px';

            const transform = outputScale.scaled ? [outputScale.sx, 0, 0, outputScale.sy, 0, 0] : null;

            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport,
                transform: transform,
                renderInteractiveForms: true
            };

            const renderTask = page.render(renderContext);
            await renderTask.promise;
            
            // Renderizar anotaciones (enlaces clickeables)
            await this.renderAnnotations(page, viewport);
            
            this.pageRendering = false;
            this.showLoading(false);
            
            if (this.pageNumPending !== null) {
                this.renderPage(this.pageNumPending);
                this.pageNumPending = null;
            }
            
        } catch (error) {
            console.error('Error renderizando página:', error);
            this.showError('Error al renderizar la página');
            this.pageRendering = false;
        }
    }

    async renderAnnotations(page, viewport) {
        try {
            const annotationLayer = document.getElementById('annotation-layer');
            
            // Limpiar anotaciones anteriores
            annotationLayer.innerHTML = '';
            
            // Configurar el tamaño de la capa de anotaciones
            annotationLayer.style.width = this.canvas.style.width;
            annotationLayer.style.height = this.canvas.style.height;
            
            // Obtener anotaciones de la página
            const annotations = await page.getAnnotations();
            
            if (annotations.length > 0) {
                // Renderizar anotaciones manualmente para mayor compatibilidad
                annotations.forEach((annotation, index) => {
                    if (annotation.subtype === 'Link' && annotation.url) {
                        const linkElement = document.createElement('a');
                        linkElement.href = annotation.url;
                        linkElement.target = '_blank';
                        linkElement.rel = 'noopener noreferrer';
                        linkElement.style.position = 'absolute';
                        linkElement.style.left = `${annotation.rect[0] * viewport.scale}px`;
                        linkElement.style.top = `${(viewport.height - annotation.rect[3]) * viewport.scale}px`;
                        linkElement.style.width = `${(annotation.rect[2] - annotation.rect[0]) * viewport.scale}px`;
                        linkElement.style.height = `${(annotation.rect[3] - annotation.rect[1]) * viewport.scale}px`;
                        linkElement.style.background = 'transparent';
                        linkElement.style.border = 'none';
                        linkElement.style.cursor = 'pointer';
                        linkElement.style.zIndex = '10';
                        linkElement.style.pointerEvents = 'auto';
                        linkElement.innerHTML = '&nbsp;'; // Contenido invisible pero clickeable
                        
                        // Efecto hover
                        linkElement.addEventListener('mouseenter', () => {
                            linkElement.style.background = 'rgba(255, 255, 0, 0.2)';
                            linkElement.style.border = '1px solid rgba(255, 255, 0, 0.8)';
                        });
                        
                        linkElement.addEventListener('mouseleave', () => {
                            linkElement.style.background = 'transparent';
                            linkElement.style.border = 'none';
                        });
                        
                        // Debug: agregar título para identificar el enlace
                        linkElement.title = `Enlace: ${annotation.url}`;
                        
                        annotationLayer.appendChild(linkElement);
                    }
                });
            }
            
        } catch (error) {
            console.error('Error renderizando anotaciones:', error);
        }
    }

    calculateOptimalViewport(page) {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 32; // padding
        const containerHeight = container.clientHeight - 32;
        
        // Obtener viewport original
        const originalViewport = page.getViewport({ scale: 1 });
        
        // Calcular escalas para ajustar al contenedor
        const scaleX = containerWidth / originalViewport.width;
        const scaleY = containerHeight / originalViewport.height;
        
        // Usar la escala menor para mantener proporciones
        let scale = Math.min(scaleX, scaleY);
        
        // Ajustes específicos para móviles
        if (this.isMobile()) {
            scale = Math.min(scale, 2); // Limitar escala máxima en móviles
            
            // En landscape, priorizar el ancho
            if (window.innerWidth > window.innerHeight) {
                scale = scaleX * 0.9;
            }
        }
        
        // Asegurar escala mínima para legibilidad
        scale = Math.max(scale, 0.5);
        
        return page.getViewport({ scale: scale });
    }

    getOutputScale() {
        // Usar devicePixelRatio para pantallas de alta densidad
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        // Limitar en móviles para evitar problemas de memoria
        if (this.isMobile()) {
            return Math.min(devicePixelRatio, 2);
        }
        
        return devicePixelRatio;
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    handleResize() {
        if (this.pdfDoc && !this.pageRendering) {
            this.renderPage(this.pageNum);
        }
    }

    onPrevPage() {
        if (this.pageNum <= 1) return;
        this.pageNum--;
        this.updatePageInfo();
        this.renderPage(this.pageNum);
    }

    onNextPage() {
        if (this.pageNum >= this.pdfDoc.numPages) return;
        this.pageNum++;
        this.updatePageInfo();
        this.renderPage(this.pageNum);
    }

    updatePageInfo() {
        if (!this.pdfDoc) return;
        
        this.pageInfo.textContent = `${this.pageNum} / ${this.pdfDoc.numPages}`;
        
        // Actualizar estado de botones
        this.prevBtn.disabled = this.pageNum <= 1;
        this.nextBtn.disabled = this.pageNum >= this.pdfDoc.numPages;
    }

    setupAudio() {
        this.audio.volume = 0.6;
        
        // Eventos de audio
        this.audio.addEventListener('loadeddata', () => {
            console.log('Audio cargado correctamente');
        });
        
        this.audio.addEventListener('error', (e) => {
            console.error('Error cargando audio:', e);
        });
        
        this.audio.addEventListener('play', () => {
            this.isAudioPlaying = true;
            this.updateAudioButton();
        });
        
        this.audio.addEventListener('pause', () => {
            this.isAudioPlaying = false;
            this.updateAudioButton();
        });
    }

    async toggleAudio() {
        try {
            if (this.isAudioPlaying) {
                this.audio.pause();
            } else {
                await this.audio.play();
            }
        } catch (error) {
            console.error('Error controlando audio:', error);
            // En móviles, el audio requiere interacción del usuario
            if (error.name === 'NotAllowedError') {
                console.log('Audio bloqueado por el navegador');
            }
        }
    }

    updateAudioButton() {
        const icon = this.audioToggle.querySelector('.icon');
        icon.textContent = this.isAudioPlaying ? '🔇' : '🎵';
        this.audioToggle.setAttribute('aria-label', 
            this.isAudioPlaying ? 'Pausar música' : 'Reproducir música');
    }

    showLoading(show) {
        this.loadingEl.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        console.error(message);
        // Crear elemento de error si no existe
        let errorEl = document.getElementById('error-message');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.id = 'error-message';
            errorEl.className = 'error-message';
            errorEl.innerHTML = `
                <p>${message}</p>
                <button onclick="location.reload()">Reintentar</button>
            `;
            this.canvas.parentElement.appendChild(errorEl);
        }
        errorEl.style.display = 'block';
        this.showLoading(false);
    }

    // Utilidad para debounce
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new WeddingInvitationApp();
});

// Manejar errores globales
window.addEventListener('error', (e) => {
    console.error('Error global:', e.error);
});

// Prevenir zoom en iOS
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

// Optimización para dispositivos táctiles
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
}