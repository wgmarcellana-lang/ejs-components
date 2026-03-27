function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

function requiredText(value, propName) {
  if (typeof value === "string" && value) {
    return value;
  }

  throw new Error(`image-preview requires a non-empty "${propName}" prop`);
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

module.exports = ({ props }) => {
  const previewProps = props && typeof props === "object" ? props : {};
  const alt = textOr(previewProps.alt, "");
  const label = textOr(previewProps.label, "");

  return {
    id: requiredText(previewProps.id, "id"),
    label,
    showLabel: previewProps.showLabel !== false && Boolean(label),
    src: textOr(previewProps.src, ""),
    alt,
    size: oneOf(previewProps.size, ["thumbnail", "medium", "full"], "medium"),
    shape: oneOf(previewProps.shape, ["square", "rounded", "circle"], "rounded"),
    objectFit: oneOf(previewProps.objectFit, ["cover", "contain"], "cover"),
    placeholderImage: textOr(previewProps.placeholderImage, "/src/assets/no-user.webp", true),
    fallbackImage: textOr(previewProps.fallbackImage, "/src/assets/no-user.webp", true),
    placeholderText: textOr(previewProps.placeholderText, "No image selected."),
    fallbackText: textOr(previewProps.fallbackText, "Image unavailable."),
    loadingText: textOr(previewProps.loadingText, "Loading preview..."),
    enlargeOnClick: previewProps.enlargeOnClick === true,
    previewInput: textOr(previewProps.previewInput, ""),
    accept: textOr(previewProps.accept, "image/*"),
    standalone: previewProps.standalone === true,
  };
};
