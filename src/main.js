import { initButtons } from "../components/button/button.js";
import { initTextInputs } from "../components/text-input/text-input.js";
import { initDropdowns } from "../components/dropdown/dropdown.js";
import { initCalendars } from "../components/calendar/calendar.js";

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
  setupDemoForm();
});
