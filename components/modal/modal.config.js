function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

module.exports = ({ props }) => {
  const modalProps = props && typeof props === "object" ? props : {};
  const title = textOr(modalProps.title, "Modal");
  const mode = ["message", "confirmation", "custom"].includes(modalProps.mode)
    ? modalProps.mode
    : "message";

  return {
    id: textOr(modalProps.id, "ui-modal", true),
    title,
    standalone: modalProps.standalone === true,
    config: {
      mode,
      title,
      message: textOr(modalProps.message, ""),
      bodyHtml: typeof modalProps.bodyHtml === "string" ? modalProps.bodyHtml : "",
      closeText: textOr(modalProps.closeText, "Close", true),
      cancelText: textOr(modalProps.cancelText, "Cancel", true),
      confirmText: textOr(modalProps.confirmText, "OK", true),
      confirmVariant: textOr(modalProps.confirmVariant, "primary", true),
      buttons: Array.isArray(modalProps.buttons) ? modalProps.buttons : [],
    },
  };
};
