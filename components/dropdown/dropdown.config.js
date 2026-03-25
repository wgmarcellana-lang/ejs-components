function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

module.exports = ({ props }) => {
  const dropdownProps = props && typeof props === "object" ? props : {};
  const label = textOr(dropdownProps.label, "");
  const mode = dropdownProps.mode === "multiple" ? "multiple" : "single";
  const placeholder = textOr(dropdownProps.placeholder, "Select an option");
  const options = Array.isArray(dropdownProps.options) ? dropdownProps.options : [];
  const selected = Array.isArray(dropdownProps.selected) ? dropdownProps.selected : [];
  const selectedOption = options.find((option) => option.value === selected[0]);

  return {
    label,
    name: textOr(dropdownProps.name, "dropdown", true),
    placeholder,
    searchPlaceholder: textOr(dropdownProps.searchPlaceholder, "Search options"),
    emptyText: textOr(dropdownProps.emptyText, "No matching options"),
    helper: textOr(dropdownProps.helper, ""),
    mode,
    searchable: dropdownProps.searchable === true,
    showLabel: dropdownProps.showLabel !== false && Boolean(label),
    standalone: dropdownProps.standalone === true,
    options,
    selected,
    summary: !selected.length
      ? placeholder
      : mode === "multiple"
        ? `${selected.length} selected`
        : selectedOption?.label || placeholder,
  };
};
