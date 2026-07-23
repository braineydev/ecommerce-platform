export function isE164(phone) {
  if (typeof phone !== "string") return false;
  return /^\+[1-9]\d{7,14}$/.test(phone.trim());
}

export function normalizePhone(phone) {
  if (typeof phone !== "string") return "";
  return phone.trim().replace(/[\s()-]/g, "");
}
