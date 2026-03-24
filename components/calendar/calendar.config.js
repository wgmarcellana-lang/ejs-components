function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

module.exports = ({ props }) => {
  const calendarProps = props && typeof props === "object" ? props : {};
  const calendarLabel = textOr(calendarProps.label, "");
  const calendarMode = calendarProps.mode === "range" ? "range" : "single";
  const calendarSingleLabel = textOr(calendarProps.singleLabel, "");
  const calendarStartLabel = textOr(calendarProps.startLabel, "");
  const calendarEndLabel = textOr(calendarProps.endLabel, "");

  return {
    calendarLabel,
    calendarName: textOr(calendarProps.name, "date", true),
    calendarSingleLabel,
    calendarStartLabel,
    calendarEndLabel,
    calendarStartName: textOr(calendarProps.startName, "startDate", true),
    calendarEndName: textOr(calendarProps.endName, "endDate", true),
    calendarStartValue: textOr(calendarProps.startValue, ""),
    calendarEndValue: textOr(calendarProps.endValue, ""),
    calendarHelper: textOr(calendarProps.helper, ""),
    calendarMode,
    calendarShowLabel: calendarProps.showLabel !== false && Boolean(calendarLabel),
    calendarShowInputLabels: calendarProps.showInputLabels !== false,
    calendarAllowModeSwitch: calendarProps.allowModeSwitch === true,
    calendarRequired: calendarProps.required === true,
    calendarStandalone: calendarProps.standalone === true,
    isRange: calendarMode === "range"
  };
};
