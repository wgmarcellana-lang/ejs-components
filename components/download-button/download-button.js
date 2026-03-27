function initDownloadButton(element) {
  if (element.dataset.downloadButtonInitialized === "true") {
    return;
  }

  const disabled = element.dataset.disabled === "true";
  const href = element.dataset.href || "";
  const fileName = element.dataset.fileName || "";
  const targetPreview = element.dataset.targetPreview || "";
  const fallbackHref = element.dataset.fallbackHref || href;
  const fallbackFileName = element.dataset.fallbackFileName || fileName;
  const linkedPreview = targetPreview ? document.querySelector(targetPreview) : null;

  element.addEventListener("click", (event) => {
    if (element.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
    }
  });

  function applyLink(nextHref, nextFileName, isDisabled = false) {
    element.dataset.disabled = String(isDisabled || !nextHref);

    if (isDisabled || !nextHref) {
      element.href = "#";
      element.setAttribute("aria-disabled", "true");
      element.setAttribute("tabindex", "-1");
      return;
    }

    element.href = nextHref;
    element.removeAttribute("tabindex");
    element.setAttribute("aria-disabled", "false");

    if (nextFileName) {
      element.setAttribute("download", nextFileName);
    } else {
      element.setAttribute("download", "");
    }
  }

  function syncFromPreview() {
    const previewValue = linkedPreview?.imagePreview?.getValue?.();

    if (!previewValue) {
      applyLink(href || fallbackHref, fileName || fallbackFileName, disabled);
      return;
    }

    if (previewValue.kind === "uploaded" && previewValue.source) {
      applyLink(previewValue.source, previewValue.fileName || fallbackFileName, false);
      return;
    }

    if (previewValue.kind === "remote" && previewValue.source) {
      const derivedName =
        previewValue.fileName ||
        fileName ||
        fallbackFileName ||
        previewValue.source.split("/").pop() ||
        "";
      applyLink(previewValue.source, derivedName, false);
      return;
    }

    applyLink(fallbackHref, fallbackFileName, disabled && !fallbackHref);
  }

  syncFromPreview();

  if (linkedPreview) {
    linkedPreview.addEventListener("component:change", (event) => {
      const detail = event.detail || {};

      if (detail.component === "image-preview") {
        syncFromPreview();
      }
    });
  }

  element.dataset.downloadButtonInitialized = "true";
}

export function initDownloadButtons(root = document) {
  root.querySelectorAll("[data-component='download-button']").forEach(initDownloadButton);
}

if (typeof document !== "undefined") {
  initDownloadButtons();
}
