function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

module.exports = ({ props }) => {
  const buttonProps = props && typeof props === "object" ? props : {};
  const download = buttonProps.download && typeof buttonProps.download === "object" ? buttonProps.download : {};
  const href = textOr(buttonProps.href, "");
  const target = textOr(buttonProps.target, "");
  const rel = textOr(buttonProps.rel, "");
  const icon = textOr(buttonProps.icon, "");
  const iconPosition = oneOf(buttonProps.iconPosition, ["start", "end"], "start");
  const action = textOr(buttonProps.action, "");
  const actionType = oneOf(action, ["", "reset-form", "open-modal-testing", "download"], "");
  const isLink = Boolean(href) || actionType === "download";
  const fileName = textOr(download.fileName, textOr(buttonProps.fileName, ""));
  const targetPreview = textOr(download.targetPreview, textOr(buttonProps.targetPreview, ""));
  const fallbackHref = textOr(download.fallbackHref, href);
  const fallbackFileName = textOr(download.fallbackFileName, fileName);

  return {
    label: textOr(buttonProps.label, "Button", true),
    variant: oneOf(buttonProps.variant, ["primary", "secondary"], "secondary"),
    size: oneOf(buttonProps.size, ["sm", "md", "lg"], "md"),
    type: textOr(buttonProps.type, "button", true),
    action: actionType,
    href,
    target,
    rel,
    isLink,
    icon,
    iconPosition,
    download: {
      fileName,
      targetPreview,
      fallbackHref,
      fallbackFileName
    },
    disabled:
      buttonProps.disabled === true || (actionType === "download" && !href && !targetPreview && !fallbackHref),
    standalone: buttonProps.standalone === true,
  };
};
