const PLAN_VERSION = 1;

export function createEmptyPlan() {
  return {
    version: PLAN_VERSION,
    responses: [],
  };
}

export function isValidPlan(value) {
  return Boolean(
    value
      && value.version === PLAN_VERSION
      && Array.isArray(value.responses)
      && value.responses.every(isValidResponse),
  );
}

function isValidResponse(response) {
  return Boolean(
    response
      && typeof response.id === "string"
      && response.id.length > 0
      && typeof response.name === "string"
      && response.name.length > 0
      && response.name.length <= 40
      && Array.isArray(response.availability)
      && response.availability.length > 0
      && response.availability.length <= 10
      && response.availability.every(isValidSlot)
      && Array.isArray(response.activities)
      && response.activities.length > 0
      && response.activities.every(
        (activity) => typeof activity === "string" && activity.length > 0 && activity.length <= 50,
      )
      && typeof response.note === "string"
      && response.note.length <= 200,
  );
}

function isValidSlot(slot) {
  return Boolean(
    slot
      && /^\d{4}-\d{2}-\d{2}$/.test(slot.date)
      && /^\d{2}:\d{2}$/.test(slot.startTime)
      && /^\d{2}:\d{2}$/.test(slot.endTime)
      && slot.startTime < slot.endTime,
  );
}

export function encodePlan(plan) {
  if (!isValidPlan(plan)) {
    throw new Error("Cannot encode an invalid plan.");
  }

  const bytes = new TextEncoder().encode(JSON.stringify(plan));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function decodePlan(encoded) {
  try {
    const base64 = encoded.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const plan = JSON.parse(new TextDecoder().decode(bytes));
    return isValidPlan(plan) ? plan : null;
  } catch {
    return null;
  }
}

export function parsePlanFromHash(hash) {
  const parameters = new URLSearchParams(hash.replace(/^#/, ""));
  const encoded = parameters.get("plan");
  return encoded ? decodePlan(encoded) : null;
}

export function createShareUrl(currentUrl, plan) {
  const url = new URL("index.html", currentUrl);
  url.hash = `plan=${encodePlan(plan)}`;
  return url.toString();
}

export function findCommonActivities(responses) {
  if (responses.length < 2) {
    return [];
  }

  const [first, ...rest] = responses;
  return [...new Set(first.activities)]
    .filter((activity) => rest.every((response) => response.activities.includes(activity)))
    .sort((left, right) => left.localeCompare(right));
}

function minutes(time) {
  const [hours, mins] = time.split(":").map(Number);
  return (hours * 60) + mins;
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const mins = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

export function findCommonTimes(responses) {
  if (responses.length < 2) {
    return [];
  }

  const dates = [...new Set(responses.flatMap(
    (response) => response.availability.map((slot) => slot.date),
  ))];
  const matches = [];

  for (const date of dates) {
    const slotsByResponse = responses.map((response) => (
      response.availability.filter((slot) => slot.date === date)
    ));

    if (slotsByResponse.some((slots) => slots.length === 0)) {
      continue;
    }

    let candidates = slotsByResponse[0].map((slot) => ({
      start: minutes(slot.startTime),
      end: minutes(slot.endTime),
    }));

    for (const slots of slotsByResponse.slice(1)) {
      candidates = candidates.flatMap((candidate) => slots
        .map((slot) => ({
          start: Math.max(candidate.start, minutes(slot.startTime)),
          end: Math.min(candidate.end, minutes(slot.endTime)),
        }))
        .filter((overlap) => overlap.start < overlap.end));
    }

    for (const candidate of candidates) {
      matches.push({
        date,
        startTime: formatMinutes(candidate.start),
        endTime: formatMinutes(candidate.end),
      });
    }
  }

  return deduplicateTimes(matches).sort((left, right) => (
    `${left.date}${left.startTime}`.localeCompare(`${right.date}${right.startTime}`)
  ));
}

function deduplicateTimes(matches) {
  const unique = new Map();
  for (const match of matches) {
    unique.set(`${match.date}|${match.startTime}|${match.endTime}`, match);
  }
  return [...unique.values()];
}
