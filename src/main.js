import { initButtons } from "../components/button/button.js";
import { initTextInputs } from "../components/text-input/text-input.js";
import { initDropdowns } from "../components/dropdown/dropdown.js";
import { initCalendars } from "../components/calendar/calendar.js";
import { initModals } from "../components/modal/modal.js";

function serializeForm(form) {
  const formData = new FormData(form);
  const payload = {};

  formData.forEach((value, key) => {
    if (payload[key]) {
      payload[key] = [].concat(payload[key], value);
    } else {
      payload[key] = value;
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
