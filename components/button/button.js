function applyButtonConfig(button) {
  const { variant = "primary", size = "md", type: dataType, label: dataLabel } = button.dataset;
  const type = dataType || button.getAttribute("type") || "button";
  const label = dataLabel || button.textContent.trim() || "Button";

  button.type = type;
  button.textContent = label;
  button.classList.add("ui-button", `ui-button--${variant}`, `ui-button--${size}`);
}

export function initButtons(root = document) {
  root.querySelectorAll("[data-component='button']").forEach(applyButtonConfig);
}
