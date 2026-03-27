function initDownloadButton(element) {
  if (element.dataset.downloadButtonInitialized === "true") {
    return;
  }

  const disabled = element.dataset.disabled === "true";
  const href = element.dataset.href || "";
  const fileName = element.dataset.fileName || "";

  if (disabled || !href) {
    element.setAttribute("aria-disabled", "true");
    element.setAttribute("tabindex", "-1");
    element.addEventListener("click", (event) => {
      event.preventDefault();
    });
  } else {
    element.href = href;

    if (fileName) {
      element.setAttribute("download", fileName);
    } else {
      element.setAttribute("download", "");
    }
  }

  element.dataset.downloadButtonInitialized = "true";
}

export function initDownloadButtons(root = document) {
  root.querySelectorAll("[data-component='download-button']").forEach(initDownloadButton);
}

if (typeof document !== "undefined") {
  initDownloadButtons();
}
