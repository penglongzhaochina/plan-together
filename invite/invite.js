import { createEmptyPlan, isValidPlan } from "../scripts/plan-utils.js";
import { createStorageKeys, getInviteeName } from "./invite-utils.js";

const EMAIL_ENDPOINT = "https://formsubmit.co/ajax/523777764@qq.com";
const inviteeName = getInviteeName(window.location.search);
const storageKeys = createStorageKeys(inviteeName);
const invitationCard = document.querySelector("#invitation-card");
const availabilityCard = document.querySelector("#availability-card");
const activityCard = document.querySelector("#activity-card");
const resultCard = document.querySelector("#result-card");
const availabilityForm = document.querySelector("#availability-form");
const activityForm = document.querySelector("#activity-form");
const availabilityError = document.querySelector("#availability-error");
const activityError = document.querySelector("#activity-error");
const slots = document.querySelector("#slots");
const slotTemplate = document.querySelector("#slot-template");
const submitButton = document.querySelector("#submit-answer");
const confirmationDetails = document.querySelector("#confirmation-details");
const confirmationNote = document.querySelector("#confirmation-note");
let draft = readJson(storageKeys.draft);
let plan = readJson(storageKeys.plan);

document.title = `${inviteeName}, Will You Go on a Date with Me?`;
for (const element of document.querySelectorAll("[data-invitee]")) {
  element.textContent = inviteeName;
}
document.querySelector(".brand").setAttribute("aria-label", `You and ${inviteeName} date invitation home`);

if (isCompletedPlan(plan)) {
  showResult(plan);
} else {
  plan = createEmptyPlan();
  sessionStorage.removeItem(storageKeys.draft);
  sessionStorage.setItem(storageKeys.plan, JSON.stringify(plan));
  addSlot();
}

document.querySelector("#accept-invitation").addEventListener("click", () => {
  document.querySelector("#gentle-reply").hidden = true;
  invitationCard.hidden = true;
  availabilityCard.hidden = false;
  availabilityCard.querySelector("input").focus();
});

document.querySelector("#maybe-later").addEventListener("click", (event) => {
  document.querySelector("#gentle-reply").hidden = false;
  event.currentTarget.textContent = "Thank you for being honest ♥";
});

document.querySelector("#add-slot").addEventListener("click", () => addSlot());

availabilityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  hideError(availabilityError);

  if (!availabilityForm.reportValidity()) {
    return;
  }

  const availability = [...slots.querySelectorAll(".slot")].map((slot) => ({
    date: slot.querySelector('[name="date"]').value,
    startTime: slot.querySelector('[name="startTime"]').value,
    endTime: slot.querySelector('[name="endTime"]').value,
  }));

  if (availability.some((slot) => slot.startTime >= slot.endTime)) {
    showError(availabilityError, "Each end time must be later than its start time.");
    return;
  }

  draft = {
    id: crypto.randomUUID(),
    name: inviteeName,
    availability,
    activities: [],
    note: "",
  };
  sessionStorage.setItem(storageKeys.draft, JSON.stringify(draft));
  availabilityCard.hidden = true;
  activityCard.hidden = false;
  activityCard.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.querySelector("#back-to-time").addEventListener("click", () => {
  activityCard.hidden = true;
  availabilityCard.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

activityForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError(activityError);

  if (document.querySelector("#website-field").value) {
    return;
  }

  const activities = [...document.querySelectorAll('[name="activity"]:checked')]
    .map((input) => input.value);
  const customActivity = document.querySelector("#custom-activity").value.trim();
  if (customActivity) {
    activities.push(customActivity);
  }
  if (activities.length === 0) {
    showError(activityError, "Choose at least one activity or add your own idea.");
    return;
  }

  draft.activities = [...new Set(activities)];
  draft.note = document.querySelector("#participant-note").value.trim();
  const completedPlan = {
    ...plan,
    responses: [draft],
  };

  setSubmitting(true);
  try {
    await emailResponse(draft);
    plan = completedPlan;
    sessionStorage.removeItem(storageKeys.draft);
    sessionStorage.setItem(storageKeys.plan, JSON.stringify(plan));
    showResult(plan);
  } catch (submissionError) {
    showError(activityError, submissionError.message);
  } finally {
    setSubmitting(false);
  }
});

document.querySelector("#start-over").addEventListener("click", () => {
  sessionStorage.removeItem(storageKeys.draft);
  sessionStorage.removeItem(storageKeys.plan);
  window.location.reload();
});

function addSlot(defaults = {}) {
  hideError(availabilityError);
  if (slots.children.length >= 10) {
    showError(availabilityError, "You can add up to 10 time options.");
    return;
  }

  const fragment = slotTemplate.content.cloneNode(true);
  const slot = fragment.querySelector(".slot");
  const dateInput = slot.querySelector('[name="date"]');
  dateInput.min = getLocalDate();
  dateInput.value = defaults.date ?? "";
  slot.querySelector('[name="startTime"]').value = defaults.startTime ?? "10:00";
  slot.querySelector('[name="endTime"]').value = defaults.endTime ?? "12:00";
  slot.querySelector(".remove-slot").addEventListener("click", () => {
    if (slots.children.length === 1) {
      showError(availabilityError, "Keep at least one time option.");
      return;
    }
    slot.remove();
    hideError(availabilityError);
  });
  slots.append(fragment);
}

function showResult(completedPlan) {
  const response = completedPlan.responses[0];
  confirmationDetails.replaceChildren(
    createDetail("When", response.availability.map(formatSlot)),
    createDetail("Our date adventure", response.activities),
  );
  if (response.note) {
    confirmationNote.textContent = `“${response.note}”`;
    confirmationNote.hidden = false;
  }
  invitationCard.hidden = true;
  availabilityCard.hidden = true;
  activityCard.hidden = true;
  document.querySelector("#page-privacy").hidden = true;
  resultCard.hidden = false;
  resultCard.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function emailResponse(response) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  const payload = {
    _subject: `${inviteeName} accepted your date invitation ♥`,
    _template: "table",
    _captcha: "false",
    invitee: inviteeName,
    response: "Yes, I’d love to!",
    available_times: response.availability.map(formatSlot).join("\n"),
    activities: response.activities.join(", "),
    note: response.note || "No additional note",
  };

  try {
    const request = await fetch(EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const result = await request.json().catch(() => null);
    if (!request.ok || result?.success === "false" || result?.success === false) {
      throw new Error("I couldn’t email your answer. Please try again in a moment.");
    }
  } catch (requestError) {
    if (requestError.name === "AbortError") {
      throw new Error("Email delivery took too long. Please check your connection and try again.");
    }
    if (requestError instanceof TypeError) {
      throw new Error("I couldn’t reach the email service. Please check your connection and try again.");
    }
    throw requestError;
  } finally {
    window.clearTimeout(timeout);
  }
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Sending your answer…" : "Make it a date ♥";
}

function createDetail(label, values) {
  const detail = document.createElement("section");
  detail.className = "keepsake-detail";
  const heading = document.createElement("h2");
  heading.textContent = label;
  detail.append(heading);
  for (const value of values) {
    const paragraph = document.createElement("p");
    paragraph.textContent = value;
    detail.append(paragraph);
  }
  return detail;
}

function isCompletedPlan(value) {
  return isValidPlan(value)
    && value.responses.length === 1
    && value.responses[0].availability.length > 0
    && value.responses[0].activities.length > 0;
}

function formatSlot(slot) {
  const date = new Date(`${slot.date}T00:00:00`);
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  return `${formattedDate} · ${slot.startTime}–${slot.endTime}`;
}

function getLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function readJson(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key));
  } catch {
    return null;
  }
}

function showError(element, message) {
  element.textContent = message;
  element.hidden = false;
}

function hideError(element) {
  element.hidden = true;
}
