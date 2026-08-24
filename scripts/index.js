import {
  createEmptyPlan,
  parsePlanFromHash,
} from "./plan-utils.js";

const DRAFT_KEY = "plan-together-draft";
const PLAN_KEY = "plan-together-plan";
const form = document.querySelector("#availability-form");
const slots = document.querySelector("#slots");
const slotTemplate = document.querySelector("#slot-template");
const addSlotButton = document.querySelector("#add-slot");
const error = document.querySelector("#form-error");
const inviteBanner = document.querySelector("#invite-banner");

const sharedPlan = parsePlanFromHash(window.location.hash);
const plan = sharedPlan ?? createEmptyPlan();

sessionStorage.setItem(PLAN_KEY, JSON.stringify(plan));

if (sharedPlan) {
  const count = plan.responses.length;
  inviteBanner.textContent = count === 1
    ? "Your invitation has arrived, Judy. Add the moments that work for you."
    : "You and Judy have both shared choices. Add another response only if you want to update the plan.";
  inviteBanner.hidden = false;
} else if (window.location.hash) {
  showError("This invite link is incomplete or invalid. You can start a new plan below.");
}

function addSlot(defaults = {}) {
  if (slots.children.length >= 10) {
    showError("You can add up to 10 time options.");
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
      showError("Keep at least one time option.");
      return;
    }
    slot.remove();
    hideError();
  });
  slots.append(fragment);
}

function showError(message) {
  error.textContent = message;
  error.hidden = false;
}

function hideError() {
  error.hidden = true;
}

addSlotButton.addEventListener("click", () => {
  addSlot();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  hideError();

  if (!form.reportValidity()) {
    return;
  }

  const availability = [...slots.querySelectorAll(".slot")].map((slot) => ({
    date: slot.querySelector('[name="date"]').value,
    startTime: slot.querySelector('[name="startTime"]').value,
    endTime: slot.querySelector('[name="endTime"]').value,
  }));

  const invalidSlot = availability.find((slot) => slot.startTime >= slot.endTime);
  if (invalidSlot) {
    showError("Each end time must be later than its start time.");
    return;
  }

  const draft = {
    id: crypto.randomUUID(),
    name: plan.responses.length === 0 ? "You" : "Judy",
    availability,
    activities: [],
    note: "",
  };

  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  window.location.assign(`activities.html${window.location.hash}`);
});

function getLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

addSlot();
