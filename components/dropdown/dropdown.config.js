function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

module.exports = ({ props }) => {
  const dropdownProps = props && typeof props === "object" ? props : {};
  const dropdownMode = dropdownProps.mode === "multiple" ? "multiple" : "single";
  const dropdownPlaceholder = textOr(dropdownProps.placeholder, "Select an option");
  const dropdownOptions = Array.isArray(dropdownProps.options) ? dropdownProps.options : [];
  const dropdownSelected = Array.isArray(dropdownProps.selected) ? dropdownProps.selected : [];
  const dropdownSelectedOption = dropdownOptions.find(
    (option) => option.value === dropdownSelected[0]
  );

  return {
    dropdownLabel: textOr(dropdownProps.label, "Dropdown"),
    dropdownName: textOr(dropdownProps.name, "dropdown", true),
    dropdownPlaceholder,
    dropdownSearchPlaceholder: textOr(dropdownProps.searchPlaceholder, "Search options"),
    dropdownEmptyText: textOr(dropdownProps.emptyText, "No matching options"),
    dropdownHelper: textOr(dropdownProps.helper, ""),
    dropdownMode,
    dropdownSearchable: dropdownProps.searchable === true,
    dropdownShowLabel: dropdownProps.showLabel !== false,
    dropdownStandalone: dropdownProps.standalone === true,
    dropdownOptions,
    dropdownSelected,
    dropdownSummary: !dropdownSelected.length
      ? dropdownPlaceholder
      : dropdownMode === "multiple"
        ? `${dropdownSelected.length} selected`
        : dropdownSelectedOption?.label || dropdownPlaceholder
  };
};
