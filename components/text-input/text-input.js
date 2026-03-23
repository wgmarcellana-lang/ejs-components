export function initTextInputs(root = document) {
  root.querySelectorAll("[data-component='text-input']").forEach((element) => {
    const control = element.querySelector(".ui-text-input__control");

    if (!control) {
      return;
    }

    if (element.dataset.disabled === "true") {
      control.disabled = true;
    }
  });
}
