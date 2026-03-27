function toBoolean(value) {
  return value === "true";
}

function fileMatchesAccept(file, accept) {
  if (!accept || accept === "*") {
    return true;
  }

  const accepted = accept
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return accepted.some((rule) => {
    if (rule === "*") {
      return true;
    }

    if (rule.endsWith("/*")) {
      return file.type.startsWith(rule.slice(0, -1));
    }

    if (rule.startsWith(".")) {
      return file.name.toLowerCase().endsWith(rule.toLowerCase());
    }

    return file.type === rule;
  });
}

function initFileUpload(element) {
  if (element.dataset.fileUploadInitialized === "true") {
    return;
  }

  const zone = element.querySelector("[data-file-upload-zone]");
  const input = element.querySelector("[data-file-upload-input]");
  const fileName = element.querySelector("[data-file-upload-file-name]");
  const status = element.querySelector("[data-file-upload-status]");

  if (!zone || !input || !fileName || !status) {
    return;
  }

  const config = {
    previewTarget: element.dataset.previewTarget || "",
    accept: element.dataset.accept || "*",
    invalidTypeText: element.dataset.invalidTypeText || "This file type is not allowed.",
    invalidSizeText: element.dataset.invalidSizeText || "This file is too large.",
    emptyLabel: element.dataset.emptyLabel || "No file selected.",
    selectedPrefix: element.dataset.selectedPrefix || "Selected file",
    maxFileSize: Number(element.dataset.maxFileSize || 0),
    multiple: toBoolean(element.dataset.multiple),
    disabled: toBoolean(element.dataset.disabled),
  };
  const preview = config.previewTarget ? document.querySelector(config.previewTarget) : null;

  function setState(state, message = "") {
    element.dataset.state = state;
    zone.dataset.invalid = String(state === "invalid");
    zone.dataset.disabled = String(config.disabled);
    status.textContent = message;
    input.setAttribute("aria-invalid", String(state === "invalid"));
  }

  function writeFileMeta(files) {
    if (!files.length) {
      fileName.textContent = config.emptyLabel;
      return;
    }

    if (files.length === 1) {
      fileName.textContent = `${config.selectedPrefix}: ${files[0].name}`;
      return;
    }

    fileName.textContent = `${files.length} files selected`;
  }

  function emitChange(files) {
    element.dispatchEvent(
      new CustomEvent("component:change", {
        bubbles: true,
        detail: {
          component: "file-upload",
          name: input.name,
          value: config.multiple ? files : files[0] || null,
          files,
        }
      })
    );
  }

  function updatePreview(files) {
    const [firstFile] = files;
    const previewApi = preview?.imagePreview;

    if (!previewApi) {
      return;
    }

    if (!firstFile) {
      previewApi.reset?.();
      return;
    }

    if (firstFile.type.startsWith("image/")) {
      previewApi.showFile?.(firstFile);
      return;
    }

    previewApi.reset?.();
  }

  function applyFiles(files) {
    const picked = Array.from(files || []);
    const normalized = config.multiple ? picked : picked.slice(0, 1);
    const invalidFile = normalized.find((file) => !fileMatchesAccept(file, config.accept));

    if (!invalidFile && config.maxFileSize > 0) {
      const oversizedFile = normalized.find((file) => file.size > config.maxFileSize);

      if (oversizedFile) {
        input.value = "";
        writeFileMeta([]);
        updatePreview([]);
        setState("invalid", `${config.invalidSizeText} (${oversizedFile.name})`);
        emitChange([]);
        return;
      }
    }

    if (invalidFile) {
      input.value = "";
      writeFileMeta([]);
      updatePreview([]);
      setState("invalid", `${config.invalidTypeText} (${invalidFile.name})`);
      emitChange([]);
      return;
    }

    writeFileMeta(normalized);
    updatePreview(normalized);
    setState(normalized.length ? "ready" : "idle", normalized.length ? "" : "");
    emitChange(normalized);
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();

      if (config.disabled) {
        return;
      }

      zone.dataset.dragActive = "true";
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.dataset.dragActive = "false";
    });
  });

  zone.addEventListener("drop", (event) => {
    if (config.disabled) {
      return;
    }

    const files = Array.from(event.dataTransfer?.files || []);

    if (!files.length) {
      return;
    }

    const transfer = new DataTransfer();
    (config.multiple ? files : files.slice(0, 1)).forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
    applyFiles(input.files);
  });

  input.addEventListener("change", () => {
    applyFiles(input.files);
  });

  element.resetComponent = () => {
    input.value = "";
    writeFileMeta([]);
    updatePreview([]);
    setState("idle", "");
    emitChange([]);
  };

  writeFileMeta([]);
  setState("idle", "");
  element.dataset.fileUploadInitialized = "true";
}

export function initFileUploads(root = document) {
  root.querySelectorAll("[data-component='file-upload']").forEach(initFileUpload);
}

if (typeof document !== "undefined") {
  initFileUploads();
}
