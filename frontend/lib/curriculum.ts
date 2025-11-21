import { z } from "zod";

// Zod schemas for runtime validation
export const lessonSchema = z.object({
  id: z.number(),
  lesson_number: z.number(),
  lesson_title: z.string(),
  is_completed: z.boolean(),
  completed_at: z.string().nullable(),
  substrand_id: z.number(),
  // Optional legacy / descriptive fields
  substrand_name: z.string().optional(),
  substrand_code: z.string().optional(),
  strand_name: z.string().optional(),
  strand_code: z.string().optional(),
});

export type Lesson = z.infer<typeof lessonSchema>;

export const lessonsResponseSchema = z.object({
  lessons: z.array(lessonSchema).default([]),
});

// Parse lessons with logging + basic assertions
export function parseLessons(raw: unknown): Lesson[] {
  const result = lessonsResponseSchema.safeParse(raw);
  if (!result.success) {
    console.warn(
      "[curriculum] Invalid lessons response",
      result.error.format()
    );
    return [];
  }
  const lessons = result.data.lessons;
  // Assert required keys
  const missingSubstrand = lessons.filter(
    (l) => typeof l.substrand_id !== "number"
  );
  if (missingSubstrand.length > 0) {
    console.warn(
      `[curriculum] Found ${missingSubstrand.length} lessons missing substrand_id. Filtering may fail.`
    );
  }
  return lessons;
}

// Helper used by page & tests
export function getLessonsForSubstrand(
  lessons: Lesson[],
  substrandId: number
): Lesson[] {
  return lessons.filter((l) => l.substrand_id === substrandId);
}
