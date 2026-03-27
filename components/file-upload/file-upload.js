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
    accept: element.dataset.accept || "*",
    invalidTypeText: element.dataset.invalidTypeText || "This file type is not allowed.",
    emptyLabel: element.dataset.emptyLabel || "No file selected.",
    selectedPrefix: element.dataset.selectedPrefix || "Selected file",
    multiple: toBoolean(element.dataset.multiple),
    disabled: toBoolean(element.dataset.disabled),
  };

  function setState(state, message = "") {
    element.dataset.state = state;
    zone.dataset.invalid = String(state === "invalid");
    zone.dataset.disabled = String(config.disabled);
    status.textContent = message;
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

  function applyFiles(files) {
    const picked = Array.from(files || []);
    const invalidFile = picked.find((file) => !fileMatchesAccept(file, config.accept));

    if (invalidFile) {
      input.value = "";
      writeFileMeta([]);
      setState("invalid", `${config.invalidTypeText} (${invalidFile.name})`);
      emitChange([]);
      return;
    }

    writeFileMeta(picked);
    setState(picked.length ? "ready" : "idle", picked.length ? "" : "");
    emitChange(picked);
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
    files.forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
    applyFiles(input.files);
  });

  input.addEventListener("change", () => {
    applyFiles(input.files);
  });

  element.resetComponent = () => {
    input.value = "";
    writeFileMeta([]);
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
