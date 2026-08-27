const DEFAULT_INVITEE = "Yuxiao";

export function normalizeInviteeName(value, fallback = DEFAULT_INVITEE) {
  const normalized = typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().replace(/\s+/g, " ")
    : "";
  return normalized ? normalized.slice(0, 40) : fallback;
}

export function getInviteeName(search, fallback = DEFAULT_INVITEE) {
  const parameters = new URLSearchParams(search);
  return normalizeInviteeName(parameters.get("name"), fallback);
}

export function createStorageKeys(inviteeName) {
  const scope = encodeURIComponent(normalizeInviteeName(inviteeName).toLocaleLowerCase());
  return {
    draft: `plan-together-invite:${scope}:draft`,
    plan: `plan-together-invite:${scope}:plan`,
  };
}
