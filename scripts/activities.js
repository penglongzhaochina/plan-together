import {
  createShareUrl,
  isValidPlan,
  parsePlanFromHash,
} from "./plan-utils.js";

const DRAFT_KEY = "plan-together-draft";
const PLAN_KEY = "plan-together-plan";
const form = document.querySelector("#activity-form");
const activityCard = document.querySelector("#activity-card");
const resultCard = document.querySelector("#result-card");
const error = document.querySelector("#form-error");
const confirmationDetails = document.querySelector("#confirmation-details");
const confirmationNote = document.querySelector("#confirmation-note");
const shareUrlInput = document.querySelector("#share-url");
const copyButton = document.querySelector("#copy-link");
const shareButton = document.querySelector("#share-answer");
const startOverLink = document.querySelector("#start-over");

const draft = readJson(DRAFT_KEY);
const storedPlan = readJson(PLAN_KEY);
const sharedPlan = parsePlanFromHash(window.location.hash);

if (isCompletedPlan(sharedPlan)) {
  showConfirmation(sharedPlan);
} else if (!draft || !isValidPlan(storedPlan)) {
  window.location.replace("index.html");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  hideError();

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
  storedPlan.responses.push(draft);

  sessionStorage.removeItem(DRAFT_KEY);
  sessionStorage.setItem(PLAN_KEY, JSON.stringify(storedPlan));
  showConfirmation(storedPlan);
});

copyButton.addEventListener("click", async () => {
  await copyText(shareUrlInput.value);
  copyButton.textContent = "Copied!";
  window.setTimeout(() => {
    copyButton.textContent = "Copy link";
  }, 1800);
});

shareButton.addEventListener("click", async () => {
  const response = getCompletedResponse(sharedPlan ?? storedPlan);
  const text = buildShareText(response);

  if (navigator.share) {
    try {
      await navigator.share({
        title: "佳期已定 · You & Judy",
        text,
        url: shareUrlInput.value,
      });
      return;
    } catch (shareError) {
      if (shareError.name === "AbortError") {
        return;
      }
    }
  }

  await copyText(`${text}\n${shareUrlInput.value}`);
  shareButton.textContent = "Reply copied — send it to me ♥";
});

startOverLink.addEventListener("click", () => {
  sessionStorage.removeItem(DRAFT_KEY);
  sessionStorage.removeItem(PLAN_KEY);
});

function showConfirmation(plan) {
  const response = getCompletedResponse(plan);
  if (!response) {
    return;
  }

  shareUrlInput.value = createShareUrl(window.location.href, plan);
  confirmationDetails.replaceChildren(
    createDetail("When", response.availability.map(formatSlot)),
    createDetail("Our date adventure", response.activities),
  );

  if (response.note) {
    confirmationNote.textContent = `“${response.note}”`;
    confirmationNote.hidden = false;
  }

  activityCard.hidden = true;
  resultCard.hidden = false;
  resultCard.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
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

function buildShareText(response) {
  const dates = response.availability.map(formatSlot).join("; ");
  const activities = response.activities.join(", ");
  return `Yes, I’d love to! Our date: ${dates}. I chose: ${activities}.`;
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

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    shareUrlInput.select();
    document.execCommand("copy");
  }
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
