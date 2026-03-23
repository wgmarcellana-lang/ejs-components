function toBoolean(value) {
  return value === "true";
}

export function initTextInputs(root = document) {
  root.querySelectorAll("[data-component='text-input']").forEach((element) => {
    const control = element.querySelector(".ui-text-input__control");

    if (!control) {
      return;
    }

    if (toBoolean(element.dataset.disabled)) {
      control.disabled = true;
    }
  });
}
