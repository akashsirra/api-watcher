import test from "node:test";
import assert from "node:assert/strict";

import { isSoftwareRole } from "../src/filters/software.js";
import { isIndiaLocation } from "../src/filters/location.js";
import { classifyExperience } from "../src/filters/experience.js";
import { classifyJobType } from "../src/filters/jobType.js";

test("software role detection", () => {
  assert.equal(
    isSoftwareRole({ title: "Software Engineer" }),
    true
  );

  assert.equal(
    isSoftwareRole({ title: "Backend Engineer" }),
    true
  );

  assert.equal(
    isSoftwareRole({ title: "Product Manager" }),
    false
  );
});

test("India location detection", () => {
  assert.equal(
    isIndiaLocation({ location: "Bengaluru, India" }),
    true
  );

  assert.equal(
    isIndiaLocation({ location: "Hyderabad" }),
    true
  );

  assert.equal(
    isIndiaLocation({ location: "Remote - USA" }),
    false
  );
});

test("experience classification", () => {
  assert.equal(
    classifyExperience("Software Engineer, Intern"),
    "ENTRY"
  );

  assert.equal(
    classifyExperience("Junior Software Engineer"),
    "ENTRY"
  );

  assert.equal(
    classifyExperience("Senior Software Engineer"),
    "SENIOR"
  );

  assert.equal(
    classifyExperience("Staff Software Engineer"),
    "SENIOR"
  );

  assert.equal(
    classifyExperience("Software Engineer"),
    "UNKNOWN"
  );
});

test("internship classification", () => {
  assert.equal(
    classifyJobType({
      title: "Software Engineer, Intern",
      description: ""
    }),
    "INTERNSHIP"
  );
});

test("job type uses title instead of unrelated description text", () => {
  assert.equal(
    classifyJobType({
      title: "Software Engineer, Internal Systems",
      description: "Work with internal teams and internship programs."
    }),
    "UNKNOWN"
  );

  assert.equal(
    classifyJobType({
      title: "Software Engineer, Intern",
      description: ""
    }),
    "INTERNSHIP"
  );
});
