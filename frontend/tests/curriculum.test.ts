import { describe, it, expect } from "vitest";
import { getLessonsForSubstrand, Lesson } from "../lib/curriculum";

const sample: Lesson[] = [
  {
    id: 1,
    lesson_number: 1,
    lesson_title: "Intro",
    is_completed: false,
    completed_at: null,
    substrand_id: 10,
  },
  {
    id: 2,
    lesson_number: 2,
    lesson_title: "Deep Dive",
    is_completed: true,
    completed_at: "2025-11-14T00:00:00Z",
    substrand_id: 10,
  },
  {
    id: 3,
    lesson_number: 1,
    lesson_title: "Other Substrand Lesson",
    is_completed: false,
    completed_at: null,
    substrand_id: 11,
  },
];

describe("getLessonsForSubstrand", () => {
  it("filters lessons by substrand_id", () => {
    const result = getLessonsForSubstrand(sample, 10);
    expect(result.length).toBe(2);
    expect(result.every((r) => r.substrand_id === 10)).toBe(true);
  });

  it("returns empty array when no lessons match", () => {
    const result = getLessonsForSubstrand(sample, 999);
    expect(result.length).toBe(0);
  });
});
