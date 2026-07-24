const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeEmail,
  normalizePhone,
  isStrongPassword,
} = require("./auth-route-utils");

test("normalizes email addresses", () => {
  assert.equal(normalizeEmail("  User@Example.com  "), "user@example.com");
});

test("normalizes phone numbers", () => {
  assert.equal(normalizePhone("+254 712 345 678"), "+254712345678");
});

test("accepts strong passwords", () => {
  assert.equal(isStrongPassword("StrongPass1!"), true);
});
