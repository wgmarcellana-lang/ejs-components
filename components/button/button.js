function applyButtonConfig(button) {
  const {
    variant = "primary",
    size = "md",
    type: dataType,
    label: dataLabel,
    disabled: dataDisabled
  } = button.dataset;

  const type = dataType || button.getAttribute("type") || "button";
  const label = dataLabel || button.textContent.trim() || "Button";
  const disabled = dataDisabled === "true";

  button.type = type;
  button.textContent = label;
  button.classList.add("ui-button", `ui-button--${variant}`, `ui-button--${size}`);
  button.disabled = disabled;
}

export function initButtons(root = document) {
  root.querySelectorAll("[data-component='button']").forEach(applyButtonConfig);
}