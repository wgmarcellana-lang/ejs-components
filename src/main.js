import { initButtons } from "../components/button/button.js";
import { initTextInputs } from "../components/text-input/text-input.js";
import { initDropdowns } from "../components/dropdown/dropdown.js";
import { initCalendars } from "../components/calendar/calendar.js";
import { initModals } from "../components/modal/modal.js";
import { initDataTables } from "../components/data-table/data-table.js";
import { initImagePreviews } from "../components/image-preview/image-preview.js";
import { initFileUploads } from "../components/file-upload/file-upload.js";
import { initDownloadButtons } from "../components/download-button/download-button.js";

function buildInitialFormState(form) {
  const payload = {};
  const fields = form.querySelectorAll("input[name]:not([type='hidden']), textarea[name], select[name]");

  fields.forEach((field) => {
    if (field.type === "radio" || field.type === "checkbox") {
      return;
    }

    payload[field.name] = field.value || "";
  });

  form.querySelectorAll("[data-component='dropdown']").forEach((element) => {
    const name = element.dataset.name;
    const isMultiple = element.dataset.mode === "multiple";
    const selectedScript = element.querySelector("[data-dropdown-selected]");
    let selectedValues = [];

    if (selectedScript) {
      try {
        const parsed = JSON.parse(selectedScript.textContent || "[]");
        selectedValues = Array.isArray(parsed) ? parsed : [];
      } catch (_error) {
        selectedValues = [];
      }
    }

    if (name) {
      payload[name] = isMultiple ? selectedValues : selectedValues[0] || "";
    }
  });

  form.querySelectorAll("[data-component='calendar']").forEach((element) => {
    const mode = element.dataset.mode === "range" ? "range" : "single";

    if (mode === "range") {
      const startName = element.dataset.startName;
      const endName = element.dataset.endName;

      if (startName) {
        payload[startName] = element.querySelector("[data-calendar-start-input]")?.value || "";
      }

      if (endName) {
        payload[endName] = element.querySelector("[data-calendar-end-input]")?.value || "";
      }

      return;
    }

    const name = element.dataset.name;

    if (name) {
      payload[name] = element.querySelector("[data-calendar-single-input]")?.value || "";
    }
  });

  return payload;
}

function openConfiguredModal() {
  window.uiModal?.openConfigured("#generic-modal");
}

function setupDemoForm() {
  const form = document.querySelector("[data-demo-form]");
  const output = document.querySelector("[data-demo-output]");
  const feedback = document.querySelector("[data-form-feedback]");

  if (!form) {
    return;
  }

  let formState = buildInitialFormState(form);

  function resetState() {
    formState = buildInitialFormState(form);
  }

  function writeOutput(value) {
    if (output) {
      output.textContent = value;
    }
  }

  function setFeedback(message = "") {
    if (!feedback) {
      return;
    }

    feedback.hidden = !message;
    feedback.textContent = message;
  }

  form.addEventListener("component:change", (event) => {
    const detail = event.detail || {};

    if (detail.component === "calendar" && detail.values && typeof detail.values === "object") {
      formState = {
        ...formState,
        ...detail.values
      };
      return;
    }

    if (typeof detail.name === "string") {
      formState = {
        ...formState,
        [detail.name]: detail.value
      };
    }
  });

  form.addEventListener("input", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return;
    }

    if (!target.name || target.closest("[data-component='text-input']") == null) {
      return;
    }

    formState = {
      ...formState,
      [target.name]: target.value
    };
  });

  form.addEventListener("submit", async (event) => {
    if (!form.reportValidity()) {
      event.preventDefault();
      setFeedback("Please correct the highlighted form fields before submitting.");
      return;
    }

    event.preventDefault();
    setFeedback("");

    try {
      const response = await fetch("/api/demo-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formState)
      });

      const contentType = response.headers.get("content-type") || "";
      const rawBody = await response.text();
      let result;

      if (contentType.includes("application/json")) {
        result = rawBody ? JSON.parse(rawBody) : {};
      } else {
        result = {
          ok: false,
          status: response.status,
          error: "Expected JSON response but received a different content type.",
          contentType,
          bodyPreview: rawBody.slice(0, 240)
        };
      }

      if (!response.ok && result.ok !== false) {
        result = {
          ok: false,
          status: response.status,
          error: "Request failed.",
          response: result
        };
      }

      writeOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      writeOutput(
        JSON.stringify(
          {
            ok: false,
            error: error instanceof Error ? error.message : "Submission failed"
          },
          null,
          2
        )
      );
    }
  });

  form.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-action='reset-form']");
    const modalTrigger = event.target.closest("[data-action='open-modal-testing']");

    if (modalTrigger) {
      event.preventDefault();
      openConfiguredModal();
      return;
    }

    if (!trigger) {
      return;
    }

    form.reset();
    form
      .querySelectorAll("[data-component]")
      .forEach((componentRoot) => {
        if (typeof componentRoot.resetComponent === "function") {
          componentRoot.resetComponent();
        }
      });

    resetState();
    writeOutput("No submission yet.");
    setFeedback("");
  });

  resetState();
}

// data table demo
function setupDataTableDemo() {
  document.addEventListener("datatable:action", (event) => {
    console.log("[data-table] View clicked:", event.detail);
  });

  document.addEventListener("datatable:selectionchange", (event) => {
    console.log("[data-table] Selection changed:", event.detail);
  });

  document.addEventListener("datatable:export", (event) => {
    console.log("[data-table] Export triggered:", event.detail);
  });

  document.addEventListener("datatable:filter", (event) => {
    console.log("[data-table] Filter triggered:", event.detail);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initButtons();
  initTextInputs();
  initDropdowns();
  initCalendars();
  initModals();
  initDataTables();
  initImagePreviews();
  initFileUploads();
  initDownloadButtons();
  setupDemoForm();
  setupDataTableDemo();
});
