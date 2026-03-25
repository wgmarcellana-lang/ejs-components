function initTextInput(element) {
  if (element.dataset.textInputInitialized === "true") {
    return;
  }

  const control = element.querySelector(".ui-text-input__control");
  const toggle = element.querySelector("[data-password-toggle]");

  if (!control) {
    return;
  }

  if (element.dataset.disabled === "true") {
    control.disabled = true;
  }

  // show password
  function emitChange() {
    element.dispatchEvent(
      new CustomEvent("component:change", {
        bubbles: true,
        detail: {
          component: "text-input",
          name: control.name,
          value: control.value
        }
      })
    );
  }

  control.addEventListener("input", emitChange);
  control.addEventListener("change", emitChange);

  if (toggle) {
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      const nextType = control.type === "password" ? "text" : "password";
      const isVisible = nextType === "text";

      control.type = nextType;
      toggle.textContent = isVisible ? "Hide" : "Show";
      toggle.setAttribute("aria-pressed", String(isVisible));
      toggle.setAttribute("aria-label", isVisible ? "Hide password" : "Show password");
      control.focus();
    });
  }

  element.dataset.textInputInitialized = "true";
}

export function initTextInputs(root = document) {
  root.querySelectorAll("[data-component='text-input']").forEach(initTextInput);
}

if (typeof document !== "undefined") {
  initTextInputs();
}
