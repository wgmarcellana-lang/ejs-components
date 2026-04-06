function applyButtonConfig(button) {
  const {
    variant = "primary",
    size = "md",
    type: dataType,
    label: dataLabel,
    disabled: dataDisabled
  } = button.dataset;

  const type = dataType || button.getAttribute("type") || "button";
  const label = dataLabel || button.querySelector(".ui-button__label")?.textContent?.trim() || button.textContent.trim() || "Button";
  const disabled = dataDisabled === "true";

  button.classList.add("ui-button", `ui-button--${variant}`, `ui-button--${size}`);

  const labelElement = button.querySelector(".ui-button__label");
  if (labelElement) {
    labelElement.textContent = label;
  } else {
    button.textContent = label;
  }

  if (button instanceof HTMLButtonElement) {
    button.type = type;
    button.disabled = disabled;
  } else {
    button.setAttribute("aria-disabled", String(disabled));
    if (disabled) {
      button.setAttribute("tabindex", "-1");
    } else {
      button.removeAttribute("tabindex");
    }
  }
}

function initDownloadAction(button) {
  if (button.dataset.downloadButtonInitialized === "true") {
    return;
  }

  const disabled = button.dataset.disabled === "true";
  const href = button.dataset.href || "";
  const fileName = button.dataset.fileName || "";
  const targetPreview = button.dataset.targetPreview || "";
  const fallbackHref = button.dataset.fallbackHref || href;
  const fallbackFileName = button.dataset.fallbackFileName || fileName;
  const linkedPreview = targetPreview ? document.querySelector(targetPreview) : null;

  button.addEventListener("click", (event) => {
    if (button.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
    }
  });

  function applyLink(nextHref, nextFileName, isDisabled = false) {
    const nextDisabled = isDisabled || !nextHref;
    button.dataset.disabled = String(nextDisabled);

    if (!(button instanceof HTMLAnchorElement)) {
      return;
    }

    if (nextDisabled) {
      button.href = "#";
      button.setAttribute("aria-disabled", "true");
      button.setAttribute("tabindex", "-1");
      return;
    }

    button.href = nextHref;
    button.removeAttribute("tabindex");
    button.setAttribute("aria-disabled", "false");

    if (nextFileName) {
      button.setAttribute("download", nextFileName);
    } else {
      button.setAttribute("download", "");
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

  button.dataset.downloadButtonInitialized = "true";
}

// download
export function initButtons(root = document) {
  root.querySelectorAll("[data-component='button']").forEach((button) => {
    applyButtonConfig(button);

    if (button.dataset.action === "download") {
      initDownloadAction(button);
    }
  });
}

if (typeof document !== "undefined") {
  initButtons();
}
