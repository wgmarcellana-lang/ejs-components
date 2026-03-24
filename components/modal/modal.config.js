function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

module.exports = ({ props }) => {
  const modalProps = props && typeof props === "object" ? props : {};
  const modalTitle = textOr(modalProps.title, "Modal");
  const modalMode = ["message", "confirmation", "custom"].includes(modalProps.mode)
    ? modalProps.mode
    : "message";

  return {
    modalId: textOr(modalProps.id, "ui-modal", true),
    modalTitle,
    modalStandalone: modalProps.standalone === true,
    modalConfig: {
      mode: modalMode,
      title: modalTitle,
      message: textOr(modalProps.message, ""),
      bodyHtml: typeof modalProps.bodyHtml === "string" ? modalProps.bodyHtml : "",
      closeText: textOr(modalProps.closeText, "Close", true),
      cancelText: textOr(modalProps.cancelText, "Cancel", true),
      confirmText: textOr(modalProps.confirmText, "OK", true),
      confirmVariant: textOr(modalProps.confirmVariant, "primary", true),
      buttons: Array.isArray(modalProps.buttons) ? modalProps.buttons : []
    }
  };
};
