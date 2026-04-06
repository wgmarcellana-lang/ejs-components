function initTextarea(element) {
  if (element.dataset.textareaInitialized === "true") {
    return;
  }

  const control = element.querySelector(".ui-textarea__control");

  if (!control) {
    return;
  }

  function emitChange() {
    element.dispatchEvent(
      new CustomEvent("component:change", {
        bubbles: true,
        detail: {
          component: "textarea",
          name: control.name,
          value: control.value
        }
      })
    );
  }

  control.addEventListener("input", emitChange);
  control.addEventListener("change", emitChange);

  element.resetComponent = () => {
    control.value = control.defaultValue || "";
    emitChange();
  };

  element.dataset.textareaInitialized = "true";
}

export function initTextareas(root = document) {
  root.querySelectorAll("[data-component='textarea']").forEach(initTextarea);
}

if (typeof document !== "undefined") {
  initTextareas();
}
