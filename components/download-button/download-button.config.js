function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

module.exports = ({ props }) => {
  const buttonProps = props && typeof props === "object" ? props : {};

  return {
    label: textOr(buttonProps.label, "Download", true),
    href: textOr(buttonProps.href, ""),
    fileName: textOr(buttonProps.fileName, ""),
    variant: oneOf(buttonProps.variant, ["primary", "secondary"], "secondary"),
    size: oneOf(buttonProps.size, ["sm", "md", "lg"], "md"),
    disabled: buttonProps.disabled === true || !textOr(buttonProps.href, ""),
    standalone: buttonProps.standalone === true,
  };
};
