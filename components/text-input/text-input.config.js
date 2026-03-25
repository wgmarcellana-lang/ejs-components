function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

module.exports = ({ props }) => {
  const inputProps = props && typeof props === "object" ? props : {};
  const inputLabel = textOr(inputProps.label, "");

  return {
    inputLabel,
    inputName: textOr(inputProps.name, "textInput", true),
    inputPlaceholder: textOr(inputProps.placeholder, ""),
    inputHelper: textOr(inputProps.helper, ""),
    inputType: textOr(inputProps.type, "text", true),
    inputValue: textOr(inputProps.value, ""),
    inputId: textOr(inputProps.id, ""),
    inputAutocomplete: textOr(inputProps.autocomplete, ""),
    inputToggleLabel: textOr(inputProps.toggleLabel, "Show password"),
    inputRequired: inputProps.required === true,
    inputShowLabel: inputProps.showLabel !== false && Boolean(inputLabel),
    inputStandalone: inputProps.standalone === true
  };
};
