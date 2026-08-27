import test from "node:test";
import assert from "node:assert/strict";
import {
  createStorageKeys,
  getInviteeName,
  normalizeInviteeName,
} from "../invite/invite-utils.js";

test("reads the invitee name from the URL", () => {
  assert.equal(getInviteeName("?name=Yu%20Xiao"), "Yu Xiao");
});

test("uses Yuxiao when the URL has no name", () => {
  assert.equal(getInviteeName(""), "Yuxiao");
});

test("normalizes unsafe control characters and limits the name", () => {
  assert.equal(normalizeInviteeName("  Yu\u0000   Xiao  "), "Yu Xiao");
  assert.equal(normalizeInviteeName("A".repeat(50)).length, 40);
});

test("separates browser storage for each invitation", () => {
  assert.notDeepEqual(createStorageKeys("Yuxiao"), createStorageKeys("Judy"));
});
