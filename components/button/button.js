function applyButtonConfig(button) {
  const variant = button.dataset.variant || "primary";
  const size = button.dataset.size || "md";
  const type = button.dataset.type || button.getAttribute("type") || "button";
  const label = button.dataset.label || button.textContent.trim() || "Button";

  button.type = type;
  button.textContent = label;
  button.classList.add("ui-button", `ui-button--${variant}`, `ui-button--${size}`);
}

export function initButtons(root = document) {
  root.querySelectorAll("[data-component='button']").forEach(applyButtonConfig);
}
