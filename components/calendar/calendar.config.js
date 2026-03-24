function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

module.exports = ({ props }) => {
  const calendarProps = props && typeof props === "object" ? props : {};
  const calendarLabel = textOr(calendarProps.label, "Calendar");
  const calendarMode = calendarProps.mode === "range" ? "range" : "single";

  return {
    calendarLabel,
    calendarName: textOr(calendarProps.name, "date", true),
    calendarSingleLabel: textOr(calendarProps.singleLabel, calendarLabel),
    calendarStartLabel: textOr(calendarProps.startLabel, "Start Date"),
    calendarEndLabel: textOr(calendarProps.endLabel, "End Date"),
    calendarStartName: textOr(calendarProps.startName, "startDate", true),
    calendarEndName: textOr(calendarProps.endName, "endDate", true),
    calendarStartValue: textOr(calendarProps.startValue, ""),
    calendarEndValue: textOr(calendarProps.endValue, ""),
    calendarHelper: textOr(calendarProps.helper, ""),
    calendarMode,
    calendarShowLabel: calendarProps.showLabel !== false,
    calendarAllowModeSwitch: calendarProps.allowModeSwitch === true,
    calendarRequired: calendarProps.required === true,
    calendarStandalone: calendarProps.standalone === true,
    isRange: calendarMode === "range"
  };
};
