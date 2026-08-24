import {
  createShareUrl,
  findCommonActivities,
  findCommonTimes,
  isValidPlan,
} from "./plan-utils.js";

const DRAFT_KEY = "plan-together-draft";
const PLAN_KEY = "plan-together-plan";
const form = document.querySelector("#activity-form");
const activityCard = document.querySelector("#activity-card");
const resultCard = document.querySelector("#result-card");
const error = document.querySelector("#form-error");
const matches = document.querySelector("#matches");
const shareUrlInput = document.querySelector("#share-url");
const copyButton = document.querySelector("#copy-link");
const addResponseLink = document.querySelector("#add-response");
const backLink = document.querySelector('.button[href="index.html"]');

const draft = readJson(DRAFT_KEY);
const storedPlan = readJson(PLAN_KEY);

if (!draft || !isValidPlan(storedPlan)) {
  window.location.replace("index.html");
}

backLink.href = `index.html${window.location.hash}`;

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

  const shareUrl = createShareUrl(window.location.href, storedPlan);
  shareUrlInput.value = shareUrl;
  addResponseLink.href = shareUrl;
  renderResults(storedPlan);

  sessionStorage.removeItem(DRAFT_KEY);
  sessionStorage.setItem(PLAN_KEY, JSON.stringify(storedPlan));
  activityCard.hidden = true;
  resultCard.hidden = false;
  resultCard.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareUrlInput.value);
  } catch {
    shareUrlInput.select();
    document.execCommand("copy");
  }

  copyButton.textContent = "Copied!";
  window.setTimeout(() => {
    copyButton.textContent = "Copy";
  }, 1800);
});

function renderResults(plan) {
  const responseCount = plan.responses.length;
  const resultHeading = document.querySelector("#result-heading");
  document.querySelector("#result-count").textContent = responseCount === 1
    ? "Your choices are saved. Send the invitation to Judy."
    : "You and Judy found your date possibilities.";
  resultHeading.textContent = responseCount === 1
    ? "Now invite Judy"
    : "A lovely plan is taking shape";
  addResponseLink.textContent = responseCount === 1
    ? "Open the invitation for Judy"
    : "Plan another date";
  if (responseCount > 1) {
    addResponseLink.href = "index.html";
  }

  matches.replaceChildren();
  if (responseCount === 1) {
    matches.append(createPanel(
      "Waiting for Judy's match",
      "After Judy adds her response, the page will reveal the times and activities you both chose.",
    ));
    return;
  }

  const commonTimes = findCommonTimes(plan.responses);
  const timeContent = commonTimes.length
    ? createList(commonTimes.map(formatSlot))
    : "No exact time overlap yet. Try adding more options.";
  matches.append(createPanel("Your time together", timeContent));

  const commonActivities = findCommonActivities(plan.responses);
  const activityContent = commonActivities.length
    ? createList(commonActivities)
    : "No shared activity yet, but you can still choose together.";
  matches.append(createPanel("You would both love", activityContent));
}

function createPanel(title, content) {
  const panel = document.createElement("section");
  panel.className = "match-panel";
  const heading = document.createElement("h2");
  heading.textContent = title;
  panel.append(heading);

  if (content instanceof Node) {
    panel.append(content);
  } else {
    const paragraph = document.createElement("p");
    paragraph.textContent = content;
    panel.append(paragraph);
  }

  return panel;
}

function createList(items) {
  const list = document.createElement("ul");
  for (const item of items) {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    list.append(listItem);
  }
  return list;
}

function formatSlot(slot) {
  const date = new Date(`${slot.date}T00:00:00`);
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
  return `${formattedDate}, ${slot.startTime}–${slot.endTime}`;
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
