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
  let currentSource = "";
  let currentFileName = "";
  let currentKind = "placeholder";
  let requestId = 0;

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

  function finalizeState(source, statusMessage = "") {
    currentSource = source;
    currentKind = currentFileName ? "uploaded" : "remote";
    applyImageSource(source, "ready", statusMessage);
    emitPreviewChange();
  }

  function loadResolvedSource(source, onSuccess, onError) {
    const image = new Image();
    image.onload = () => onSuccess(source);
    image.onerror = () => onError();
    image.src = source;
  }

  function emitPreviewChange() {
    element.dispatchEvent(
      new CustomEvent("component:change", {
        bubbles: true,
        detail: {
          component: "image-preview",
          id: element.id || "",
          source: currentSource,
          fileName: currentFileName,
          kind: currentKind,
          downloadable: currentKind === "uploaded" || currentKind === "remote",
        }
      })
    );
  }

  function showPlaceholder() {
    cleanupObjectUrl();
    currentSource = config.placeholderImage;
    currentFileName = "";
    currentKind = "placeholder";
    applyImageSource(config.placeholderImage, "empty", config.placeholderText);
    emitPreviewChange();
  }

  function showError() {
    cleanupObjectUrl();
    currentSource = config.fallbackImage;
    currentFileName = "";
    currentKind = "fallback";
    applyImageSource(config.fallbackImage, "error", config.fallbackText);
    emitPreviewChange();
  }

  function showLoading() {
    setState("loading");
    setStatus(config.loadingText);
    refs.image.dataset.renderState = "loading";
    refs.action.dataset.clickable = "false";
  }

  function showSource(source, fileName = "") {
    const nextRequestId = ++requestId;
    refs.image.dataset.fileName = fileName;
    currentFileName = fileName;
    currentKind = fileName ? "remote" : "placeholder";
    showLoading();
    loadResolvedSource(
      source || config.placeholderImage,
      (resolvedSource) => {
        if (nextRequestId !== requestId) {
          return;
        }

        if (!fileName && resolvedSource === config.placeholderImage) {
          showPlaceholder();
          return;
        }

        finalizeState(resolvedSource, fileName ? `Previewing ${fileName}` : "");
      },
      () => {
        if (nextRequestId === requestId) {
          showError();
        }
      }
    );
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
    currentFileName = file.name;
    showLoading();
    const nextRequestId = ++requestId;

    loadResolvedSource(
      objectUrl,
      (resolvedSource) => {
        if (nextRequestId === requestId) {
          finalizeState(resolvedSource, `Previewing ${file.name}`);
        }
      },
      () => {
        if (nextRequestId === requestId) {
          showError();
        }
      }
    );
  }

  function reset() {
    refs.image.dataset.fileName = "";
    currentFileName = "";

    if (config.src) {
      cleanupObjectUrl();
      showSource(config.src);
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
    showFile,
    showSource,
    reset,
    destroy,
    getValue() {
      return {
        source: currentSource,
        fileName: currentFileName,
        kind: currentKind,
        isInteractive: currentKind === "uploaded" || currentKind === "remote",
      };
    },
  };
}

function buildInlineLightboxMarkup(config, refs) {
  return `
    <div class="ui-image-preview__lightbox-shell">
      <img
        class="ui-image-preview__modal-image"
        src="${escapeHtml(refs.image.src)}"
        alt="${escapeHtml(refs.image.alt || config.alt || "Image preview")}"
      />
    </div>
  `;
}

function getFocusableElements(container) {
  if (!(container instanceof HTMLElement)) {
    return [];
  }

  return Array.from(
    container.querySelectorAll(
      "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
    )
  ).filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
}

function toggleBackgroundInert(overlay, isInert) {
  Array.from(document.body.children).forEach((child) => {
    if (child === overlay) {
      return;
    }

    if (isInert) {
      child.setAttribute("aria-hidden", "true");
      child.inert = true;
    } else {
      child.removeAttribute("aria-hidden");
      child.inert = false;
    }
  });
}

function closeInlineLightbox() {
  const overlay = document.querySelector("[data-image-preview-lightbox]");
  const dialog = overlay?.querySelector(".ui-image-preview__lightbox-dialog");
  const previousFocus = overlay?._previousFocus || null;

  if (overlay) {
    overlay.hidden = true;
    toggleBackgroundInert(overlay, false);
  }

  document.body.classList.remove("modal-open");
  previousFocus?.focus?.();
}

function ensureInlineLightbox() {
  let overlay = document.querySelector("[data-image-preview-lightbox]");

  if (overlay) {
    return overlay;
  }

  overlay = document.createElement("div");
  overlay.className = "ui-image-preview__lightbox";
  overlay.setAttribute("data-image-preview-lightbox", "");
  overlay.setAttribute("hidden", "");
  overlay.innerHTML = `
    <div class="ui-image-preview__lightbox-backdrop" data-image-preview-lightbox-close></div>
    <div class="ui-image-preview__lightbox-dialog" role="dialog" aria-modal="true" aria-labelledby="image-preview-lightbox-title" tabindex="-1">
      <h2 class="ui-image-preview__lightbox-title" id="image-preview-lightbox-title">Image preview</h2>
      <button class="ui-image-preview__lightbox-close" type="button" data-image-preview-lightbox-close aria-label="Close image preview">&times;</button>
      <div class="ui-image-preview__lightbox-body" data-image-preview-lightbox-body></div>
    </div>
  `;

  const closeTargets = overlay.querySelectorAll("[data-image-preview-lightbox-close]");
  closeTargets.forEach((target) => {
    target.addEventListener("click", () => {
      closeInlineLightbox();
    });
  });

  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeInlineLightbox();
      return;
    }

    if (event.key === "Tab") {
      const dialog = overlay.querySelector(".ui-image-preview__lightbox-dialog");
      const focusable = getFocusableElements(dialog);

      if (!focusable.length) {
        event.preventDefault();
        dialog?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  document.body.appendChild(overlay);
  return overlay;
}

function openLightbox(config, refs) {
  if (
    !config.enlargeOnClick ||
    !refs.image?.src ||
    refs.image.src === config.placeholderImage ||
    refs.image.dataset.renderState !== "ready"
  ) {
    return;
  }

  if (config.modalTarget && window.uiModal) {
    window.uiModal.custom({
      target: config.modalTarget,
      title: config.label || "Image preview",
      bodyHtml: buildInlineLightboxMarkup(config, refs),
      buttons: [{ label: "Close", variant: "secondary", close: true }]
    });
    return;
  }

  const overlay = ensureInlineLightbox();
  const body = overlay.querySelector("[data-image-preview-lightbox-body]");
  const title = overlay.querySelector("#image-preview-lightbox-title");
  const dialog = overlay.querySelector(".ui-image-preview__lightbox-dialog");
  const previousActiveElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  if (!body || !dialog) {
    return;
  }

  if (title) {
    title.textContent = config.label || "Image preview";
  }

  body.innerHTML = buildInlineLightboxMarkup(config, refs);
  overlay.hidden = false;
  document.body.classList.add("modal-open");
  overlay._previousFocus = previousActiveElement;
  toggleBackgroundInert(overlay, true);

  const focusable = getFocusableElements(dialog);
  (focusable[0] || dialog)?.focus();
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
    enlargeLabel: element.dataset.enlargeLabel || "View larger",
    previewInput: element.dataset.previewInput || "",
    enlargeOnClick: toBoolean(element.dataset.enlargeOnClick),
    label: element.querySelector(".ui-image-preview__label")?.textContent?.trim() || "",
    modalTarget: element.dataset.modalTarget || "#generic-modal",
  };

  refs.image.style.objectFit = element.dataset.objectFit || "cover";

  const api = createStateApi(element, config, refs);
  const linkedInput = findLinkedInput(document, config.previewInput);

  refs.action.addEventListener("click", () => {
    openLightbox(config, refs);
  });

  document.addEventListener("keydown", (event) => {
    const overlay = document.querySelector("[data-image-preview-lightbox]");

    if (!overlay || overlay.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closeInlineLightbox();
    }
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
    showSource: api.showSource,
    reset: api.reset,
    getValue: api.getValue,
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
