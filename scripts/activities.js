import { isValidPlan } from "./plan-utils.js";

const DRAFT_KEY = "plan-together-draft";
const PLAN_KEY = "plan-together-plan";
const EMAIL_ENDPOINT = "https://formsubmit.co/ajax/523777764@qq.com";
const form = document.querySelector("#activity-form");
const activityCard = document.querySelector("#activity-card");
const resultCard = document.querySelector("#result-card");
const error = document.querySelector("#form-error");
const submitButton = document.querySelector("#submit-answer");
const confirmationDetails = document.querySelector("#confirmation-details");
const confirmationNote = document.querySelector("#confirmation-note");
const deliveryStatus = document.querySelector("#delivery-status");
const startOverLink = document.querySelector("#start-over");

const draft = readJson(DRAFT_KEY);
const storedPlan = readJson(PLAN_KEY);

if (isCompletedPlan(storedPlan)) {
  showConfirmation(storedPlan);
} else if (!draft || !isValidPlan(storedPlan)) {
  window.location.replace("index.html");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError();

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
    showError("Choose at least one activity or add your own idea.");
    return;
  }

  draft.activities = [...new Set(activities)];
  draft.note = document.querySelector("#participant-note").value.trim();
  const completedPlan = {
    ...storedPlan,
    responses: [...storedPlan.responses, draft],
  };

  setSubmitting(true);
  try {
    await emailResponse(draft);
    sessionStorage.removeItem(DRAFT_KEY);
    sessionStorage.setItem(PLAN_KEY, JSON.stringify(completedPlan));
    showConfirmation(completedPlan, true);
  } catch (submissionError) {
    showError(submissionError.message);
  } finally {
    setSubmitting(false);
  }
});

startOverLink.addEventListener("click", () => {
  sessionStorage.removeItem(DRAFT_KEY);
  sessionStorage.removeItem(PLAN_KEY);
});

function showConfirmation(plan, emailSent = false) {
  const response = getCompletedResponse(plan);
  if (!response) {
    return;
  }

  confirmationDetails.replaceChildren(
    createDetail("When", response.availability.map(formatSlot)),
    createDetail("Our date adventure", response.activities),
  );

  if (response.note) {
    confirmationNote.textContent = `“${response.note}”`;
    confirmationNote.hidden = false;
  }

  deliveryStatus.hidden = !emailSent;
  activityCard.hidden = true;
  resultCard.hidden = false;
  resultCard.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function emailResponse(response) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  const payload = {
    _subject: "Judy accepted your date invitation ♥",
    _template: "table",
    _captcha: "false",
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

function getCompletedResponse(plan) {
  return isCompletedPlan(plan) ? plan.responses[0] : null;
}

function isCompletedPlan(plan) {
  return isValidPlan(plan)
    && plan.responses.length === 1
    && plan.responses[0].availability.length > 0
    && plan.responses[0].activities.length > 0;
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

function readJson(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key));
  } catch {
    return null;
  }
}

function showError(message) {
  error.textContent = message;
  error.hidden = false;
}

function hideError() {
  error.hidden = true;
}
