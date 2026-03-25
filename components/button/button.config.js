function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

module.exports = ({ props }) => {
  const buttonProps = props && typeof props === "object" ? props : {};

  return {
    label: textOr(buttonProps.label, "Button", true),
    variant: textOr(buttonProps.variant, "secondary", true),
    size: textOr(buttonProps.size, "md", true),
    type: textOr(buttonProps.type, "button", true),
    action: textOr(buttonProps.action, ""),
    disabled: buttonProps.disabled === true,
    standalone: buttonProps.standalone === true,
  };
};
