function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

module.exports = ({ props }) => {
  const buttonProps = props && typeof props === "object" ? props : {};

  return {
    buttonLabel: textOr(buttonProps.label, "Button", true),
    buttonVariant: textOr(buttonProps.variant, "primary", true),
    buttonSize: textOr(buttonProps.size, "md", true),
    buttonType: textOr(buttonProps.type, "button", true),
    buttonAction: textOr(buttonProps.action, ""),
    buttonDisabled: buttonProps.disabled === true,
    buttonStandalone: buttonProps.standalone === true
  };
};
