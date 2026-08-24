import test from "node:test";
import assert from "node:assert/strict";
import {
  createEmptyPlan,
  decodePlan,
  encodePlan,
  findCommonActivities,
  findCommonTimes,
} from "../scripts/plan-utils.js";

globalThis.btoa = (value) => Buffer.from(value, "binary").toString("base64");
globalThis.atob = (value) => Buffer.from(value, "base64").toString("binary");

function response(name, availability, activities) {
  return {
    id: name,
    name,
    availability,
    activities,
    note: "",
  };
}

test("encodes and decodes plans containing Unicode", () => {
  const plan = createEmptyPlan();
  plan.responses.push(response("小明", [
    { date: "2026-09-01", startTime: "10:00", endTime: "12:00" },
  ], ["晚饭"]));

  assert.deepEqual(decodePlan(encodePlan(plan)), plan);
});

test("returns activities selected by everyone", () => {
  const responses = [
    response("Alex", [], ["Dinner", "Pickleball"]),
    response("Sam", [], ["Coffee", "Pickleball"]),
  ];

  assert.deepEqual(findCommonActivities(responses), ["Pickleball"]);
});

test("finds overlapping windows on a common date", () => {
  const responses = [
    response("Alex", [
      { date: "2026-09-01", startTime: "10:00", endTime: "14:00" },
    ], []),
    response("Sam", [
      { date: "2026-09-01", startTime: "12:30", endTime: "16:00" },
    ], []),
  ];

  assert.deepEqual(findCommonTimes(responses), [
    { date: "2026-09-01", startTime: "12:30", endTime: "14:00" },
  ]);
});

test("does not match dates missing from one response", () => {
  const responses = [
    response("Alex", [
      { date: "2026-09-01", startTime: "10:00", endTime: "14:00" },
    ], []),
    response("Sam", [
      { date: "2026-09-02", startTime: "10:00", endTime: "14:00" },
    ], []),
  ];

  assert.deepEqual(findCommonTimes(responses), []);
});
