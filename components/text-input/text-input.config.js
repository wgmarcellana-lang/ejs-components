function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

module.exports = ({ props }) => {
  const inputProps = props && typeof props === "object" ? props : {};
  const label = textOr(inputProps.label, "");

  return {
    label,
    name: textOr(inputProps.name, "textInput", true),
    placeholder: textOr(inputProps.placeholder, ""),
    helper: textOr(inputProps.helper, ""),
    type: textOr(inputProps.type, "text", true),
    value: textOr(inputProps.value, ""),
    id: textOr(inputProps.id, ""),
    autocomplete: textOr(inputProps.autocomplete, ""),
    toggleLabel: textOr(inputProps.toggleLabel, "Show password"),
    required: inputProps.required === true,
    showLabel: inputProps.showLabel !== false && Boolean(label),
    standalone: inputProps.standalone === true,
  };
};
