import { initButtons } from "../components/button/button.js";
import { initTextInputs } from "../components/text-input/text-input.js";
import { initDropdowns } from "../components/dropdown/dropdown.js";
import { initCalendars } from "../components/calendar/calendar.js";
import { initModals } from "../components/modal/modal.js";

function serializeForm(form) {
  const formData = new FormData(form);
  const payload = {};

  for (const [key, value] of formData.entries()) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      payload[key] = Array.isArray(payload[key])
        ? [...payload[key], value]
        : [payload[key], value];
      continue;
    }

    payload[key] = value;
  }

  return payload;
}

function parseJsonScript(element, selector, fallback) {
  const script = element.querySelector(selector);

  if (!script) {
    return fallback;
  }

  try {
    return JSON.parse(script.textContent || "");
  } catch (_error) {
    return fallback;
  }
}

function openConfiguredModal() {
  if (!window.uiModal) {
    return;
  }

  const modal = document.querySelector("#shared-modal");

  if (!modal) {
    return;
  }

  const config = parseJsonScript(modal, "[data-modal-config]", {});
  const mode = config.mode || "message";
  const target = "#shared-modal";
  const title = config.title || "Modal";
  const message = config.message || "";
  const bodyHtml = config.bodyHtml || "";
  const buttons = Array.isArray(config.buttons) ? config.buttons : [];

  if (mode === "confirmation") {
    window.uiModal.confirmation({
      target,
      title,
      message,
      cancelText: config.cancelText || "Cancel",
      confirmText: config.confirmText || "OK",
      confirmVariant: config.confirmVariant || "primary"
    });
    return;
  }

  if (mode === "custom") {
    window.uiModal.custom({
      target,
      title,
      bodyHtml,
      buttons
    });
    return;
  }

  window.uiModal.message({
    target,
    title,
    message,
    closeText: config.closeText || "Close"
  });
}

function setupDemoForm() {
  const form = document.querySelector("[data-demo-form]");
  const output = document.querySelector("[data-demo-output]");

  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (output) {
      output.textContent = JSON.stringify(serializeForm(form), null, 2);
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

    if (output) {
      output.textContent = "No submission yet.";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initButtons();
  initTextInputs();
  initDropdowns();
  initCalendars();
  initModals();
  setupDemoForm();
});
