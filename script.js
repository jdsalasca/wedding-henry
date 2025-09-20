pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const pdfPath = "wedding-invitation.pdf";
const container = document.getElementById("pdf-container");
const loader = document.getElementById("loader");
const audio = document.getElementById("audio");
const audioToggle = document.getElementById("audio-toggle");
const linkService = new pdfjsLib.SimpleLinkService();
const state = {
  pdf: null,
  resizeTimer: null,
  isRendering: false,
  needsRerender: false,
};

if (pdfjsLib.LinkTarget) {
  linkService.externalLinkTarget = pdfjsLib.LinkTarget.BLANK;
}

function clearPages() {
  const pages = container.querySelectorAll(".pdf-page");
  pages.forEach((page) => page.remove());
}

function getScale(baseViewport) {
  const bounds = container.getBoundingClientRect();
  const availableWidth = bounds.width || window.innerWidth || baseViewport.width;
  const maxWidth = Math.min(availableWidth, 860);
  const scale = maxWidth / baseViewport.width;
  return scale > 0 ? scale : 1;
}

async function renderPage(pageNumber) {
  const page = await state.pdf.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = getScale(baseViewport);
  const viewport = page.getViewport({ scale });

  const pageHolder = document.createElement("div");
  pageHolder.className = "pdf-page";
  pageHolder.dataset.pageNumber = String(pageNumber);

  const canvas = document.createElement("canvas");
  canvas.className = "pdf-canvas";
  const context = canvas.getContext("2d", { alpha: false });

  const outputScale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

  pageHolder.appendChild(canvas);

  const annotationLayer = document.createElement("div");
  annotationLayer.className = "annotationLayer";
  pageHolder.appendChild(annotationLayer);

  container.appendChild(pageHolder);

  await page.render({
    canvasContext: context,
    viewport,
    intent: "display",
  }).promise;

  const annotations = await page.getAnnotations({ intent: "display" });
  annotationLayer.innerHTML = "";
  pdfjsLib.AnnotationLayer.render({
    annotations,
    div: annotationLayer,
    page,
    viewport,
    linkService,
    renderInteractiveForms: true,
  });
}

async function renderAllPages() {
  if (!state.pdf) {
    return;
  }

  if (state.isRendering) {
    state.needsRerender = true;
    return;
  }

  state.isRendering = true;
  state.needsRerender = false;
  clearPages();

  for (let pageNumber = 1; pageNumber <= state.pdf.numPages; pageNumber += 1) {
    // Await each page to keep order and avoid layout jumps
    await renderPage(pageNumber);
  }

  state.isRendering = false;

  if (state.needsRerender) {
    state.needsRerender = false;
    renderAllPages();
  }
}

function handleResize() {
  if (!state.pdf) {
    return;
  }

  window.clearTimeout(state.resizeTimer);
  state.resizeTimer = window.setTimeout(() => {
    state.needsRerender = true;
    renderAllPages();
  }, 220);
}

function setupAudio() {
  if (!audio || !audioToggle) {
    return;
  }

  const updateButton = () => {
    const playing = !audio.paused;
    audioToggle.textContent = playing ? "Pausar musica" : "Reproducir musica";
    audioToggle.setAttribute("aria-pressed", playing ? "true" : "false");
  };

  const tryPlay = async () => {
    try {
      await audio.play();
    } catch (error) {
      console.warn("Audio bloqueado por el navegador", error);
    } finally {
      updateButton();
    }
  };

  audioToggle.addEventListener("click", async () => {
    if (audio.paused) {
      await tryPlay();
    } else {
      audio.pause();
      updateButton();
    }
  });

  audio.addEventListener("play", updateButton);
  audio.addEventListener("pause", updateButton);
  audio.addEventListener("ended", updateButton);

  const autoStart = async () => {
    document.removeEventListener("pointerdown", autoStart);
    document.removeEventListener("keydown", autoStart);

    if (audio.paused) {
      await tryPlay();
    }
  };

  document.addEventListener("pointerdown", autoStart, { once: true });
  document.addEventListener("keydown", autoStart, { once: true });

  updateButton();
}

async function loadDocument() {
  setupAudio();

  try {
    const loadingTask = pdfjsLib.getDocument({ url: pdfPath });
    const pdf = await loadingTask.promise;
    state.pdf = pdf;
    linkService.setDocument(pdf, null);

    if (loader) {
      loader.remove();
    }

    await renderAllPages();
    window.addEventListener("resize", handleResize);
  } catch (error) {
    console.error("No se pudo renderizar el PDF", error);

    if (loader) {
      loader.innerHTML = `
        <div class="error-message">
          <p>No se pudo cargar el PDF.</p>
          <p><a href="${pdfPath}" target="_blank" rel="noopener">Abrir en otra ventana</a></p>
        </div>
      `;
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadDocument);
} else {
  loadDocument();
}



