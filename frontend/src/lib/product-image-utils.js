function collectStringValues(value, sink) {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (trimmedValue) sink.push(trimmedValue);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(entry => collectStringValues(entry, sink));
    return;
  }

  if (value && typeof value === "object") {
    if (typeof value.url === "string") {
      const trimmedUrl = value.url.trim();
      if (trimmedUrl) sink.push(trimmedUrl);
    }

    if (typeof value.src === "string") {
      const trimmedSrc = value.src.trim();
      if (trimmedSrc) sink.push(trimmedSrc);
    }

    if (typeof value.path === "string") {
      const trimmedPath = value.path.trim();
      if (trimmedPath) sink.push(trimmedPath);
    }
  }
}

export function getProductImageCandidates(productOrItem) {
  if (!productOrItem || typeof productOrItem !== "object") {
    return [];
  }

  const candidates = [];
  const candidateKeys = [
    "images",
    "image",
    "image_name",
    "imageName",
    "imageUrl",
    "image_url",
    "thumbnail",
    "photo",
    "productImage",
    "coverImage",
  ];

  candidateKeys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(productOrItem, key)) {
      collectStringValues(productOrItem[key], candidates);
    }
  });

  return candidates.filter((value, index, allValues) => {
    const trimmedValue = String(value).trim();
    return trimmedValue && allValues.indexOf(value) === index;
  });
}

export function getProductPrimaryImage(productOrItem, fallback = "") {
  const candidates = getProductImageCandidates(productOrItem);
  if (candidates.length > 0) {
    return candidates[0];
  }

  return fallback;
}
