function toBoolean(value) {
  return value === "true";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function findLinkedInput(root, selector) {
  if (!selector) {
    return null;
  }

  const normalized = selector.startsWith("#") || selector.startsWith(".") || selector.startsWith("[")
    ? selector
    : `#${selector}`;

  return root.querySelector(normalized) || document.querySelector(normalized);
}

function createStateApi(element, config, refs) {
  let objectUrl = "";

  function setStatus(message) {
    if (refs.status) {
      refs.status.textContent = message;
    }
  }

  function setState(state) {
    element.dataset.state = state;
  }

  function cleanupObjectUrl() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = "";
    }
  }

  function applyImageSource(source, state, statusMessage) {
    if (!refs.image) {
      return;
    }

    setState(state);
    setStatus(statusMessage);
    refs.image.dataset.renderState = state;
    refs.image.src = source;
    refs.image.alt = config.alt;
    refs.action.dataset.clickable = String(config.enlargeOnClick && state === "ready");
    refs.action.disabled = false;
  }

  function showPlaceholder() {
    cleanupObjectUrl();
    applyImageSource(config.placeholderImage, "empty", config.placeholderText);
  }

  function showError() {
    cleanupObjectUrl();
    applyImageSource(config.fallbackImage, "error", config.fallbackText);
  }

  function showLoading() {
    setState("loading");
    setStatus(config.loadingText);
    refs.action.dataset.clickable = "false";
  }

  function showResolved(source, statusMessage = "") {
    applyImageSource(source, "ready", statusMessage);
  }

  function showFile(file) {
    if (!(file instanceof File)) {
      showPlaceholder();
      return;
    }

    if (!file.type.startsWith("image/")) {
      showError();
      setStatus("Selected file is not an image.");
      return;
    }

    cleanupObjectUrl();
    objectUrl = URL.createObjectURL(file);
    refs.image.dataset.fileName = file.name;
    showLoading();
    refs.image.src = objectUrl;
  }

  function reset() {
    refs.image.dataset.fileName = "";

    if (config.src) {
      cleanupObjectUrl();
      showLoading();
      refs.image.src = config.src;
      return;
    }

    showPlaceholder();
  }

  function destroy() {
    cleanupObjectUrl();
  }

  return {
    showPlaceholder,
    showError,
    showLoading,
    showResolved,
    showFile,
    reset,
    destroy,
  };
}

function openLightbox(config, refs) {
  if (!config.enlargeOnClick || !window.uiModal || !refs.image?.src || refs.image.src === config.placeholderImage) {
    return;
  }

  window.uiModal.custom({
    target: config.modalTarget,
    title: config.label || "Image preview",
    bodyHtml: `
      <img
        class="ui-image-preview__modal-image"
        src="${escapeHtml(refs.image.src)}"
        alt="${escapeHtml(refs.image.alt || config.alt || "Image preview")}"
      />
    `,
    buttons: [{ label: "Close", variant: "secondary", close: true }]
  });
}

function initImagePreview(element) {
  if (element.dataset.imagePreviewInitialized === "true") {
    return;
  }

  const refs = {
    action: element.querySelector("[data-image-preview-trigger]"),
    image: element.querySelector("[data-image-preview-image]"),
    status: element.querySelector("[data-image-preview-status]"),
  };

  if (!refs.action || !refs.image || !refs.status) {
    return;
  }

  const config = {
    src: element.dataset.src || "",
    alt: element.dataset.alt || "",
    placeholderImage: element.dataset.placeholderImage || "/src/assets/no-user.webp",
    fallbackImage: element.dataset.fallbackImage || "/src/assets/no-user.webp",
    placeholderText: element.dataset.placeholderText || "No image selected.",
    fallbackText: element.dataset.fallbackText || "Image unavailable.",
    loadingText: element.dataset.loadingText || "Loading preview...",
    previewInput: element.dataset.previewInput || "",
    enlargeOnClick: toBoolean(element.dataset.enlargeOnClick),
    label: element.querySelector(".ui-image-preview__label")?.textContent?.trim() || "",
    modalTarget: "#generic-modal",
  };

  refs.image.style.objectFit = element.dataset.objectFit || "cover";

  const api = createStateApi(element, config, refs);
  const linkedInput = findLinkedInput(document, config.previewInput);

  refs.image.addEventListener("load", () => {
    const fileName = refs.image.dataset.fileName;
    const renderState = refs.image.dataset.renderState;

    if (renderState === "empty") {
      refs.action.dataset.clickable = "false";
      return;
    }

    if (renderState === "error") {
      refs.action.dataset.clickable = "false";
      return;
    }

    api.showResolved(refs.image.src, fileName ? `Previewing ${fileName}` : "");
  });

  refs.image.addEventListener("error", () => {
    api.showError();
  });

  refs.action.addEventListener("click", () => {
    openLightbox(config, refs);
  });

  if (linkedInput) {
    linkedInput.addEventListener("change", () => {
      const [file] = Array.from(linkedInput.files || []);
      api.showFile(file);
    });
  }

  element.resetComponent = () => {
    if (linkedInput) {
      linkedInput.value = "";
    }
    api.reset();
  };

  element.imagePreview = {
    showFile: api.showFile,
    showSource(source) {
      api.showLoading();
      refs.image.dataset.fileName = "";
      refs.image.src = source || config.placeholderImage;
    },
    reset: api.reset,
  };

  api.reset();
  element.dataset.imagePreviewInitialized = "true";

  window.addEventListener("beforeunload", () => {
    api.destroy();
  }, { once: true });
}

export function initImagePreviews(root = document) {
  root.querySelectorAll("[data-component='image-preview']").forEach(initImagePreview);
}

if (typeof document !== "undefined") {
  initImagePreviews();
}
