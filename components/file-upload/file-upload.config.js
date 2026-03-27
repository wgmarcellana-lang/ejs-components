function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

function requiredText(value, propName) {
  if (typeof value === "string" && value) {
    return value;
  }

  throw new Error(`file-upload requires a non-empty "${propName}" prop`);
}

module.exports = ({ props }) => {
  const uploadProps = props && typeof props === "object" ? props : {};
  const label = textOr(uploadProps.label, "");

  return {
    id: requiredText(uploadProps.id, "id"),
    label,
    showLabel: uploadProps.showLabel !== false && Boolean(label),
    name: requiredText(uploadProps.name, "name"),
    accept: textOr(uploadProps.accept, "*"),
    helper: textOr(uploadProps.helper, "Drag and drop a file here, or browse from your device."),
    buttonLabel: textOr(uploadProps.buttonLabel, "Browse files"),
    dropLabel: textOr(uploadProps.dropLabel, "Drop files here"),
    emptyLabel: textOr(uploadProps.emptyLabel, "No file selected."),
    invalidTypeText: textOr(uploadProps.invalidTypeText, "This file type is not allowed."),
    selectedPrefix: textOr(uploadProps.selectedPrefix, "Selected file"),
    multiple: uploadProps.multiple === true,
    disabled: uploadProps.disabled === true,
    previewTarget: textOr(uploadProps.previewTarget, ""),
    standalone: uploadProps.standalone === true,
  };
};
