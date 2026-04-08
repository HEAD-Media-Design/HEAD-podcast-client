import { z } from "zod";

export const transcriptSegmentSchema = z.object({
  text: z.string(),
  start: z.number().optional(),
  end: z.number().optional(),
});

export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>;

export const transcriptSchema = z.union([
  z.string(),
  z.array(transcriptSegmentSchema),
]);

export type Transcript = z.infer<typeof transcriptSchema>;

const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), "audioUrl must be an https:// URL");

export const episodeJsonSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    publishedAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
      message: "publishedAt must be a parseable date string (e.g. ISO 8601)",
    }),
    audioUrl: httpsUrl,
    summary: z.string(),
    showNotes: z.string().optional(),
    transcript: transcriptSchema.optional(),
    transcriptFile: z
      .string()
      .min(1)
      .optional()
      .describe("Filename under content/episodes/, e.g. my-slug.transcript.json"),
    authorName: z.string().optional(),
    seriesYear: z.string().optional(),
    coverImageUrl: z.string().url().optional(),
    published: z.boolean().optional(),
  })
  .refine(
    (e) => e.transcript !== undefined || e.transcriptFile !== undefined,
    {
      message: "Provide either transcript or transcriptFile",
      path: ["transcript"],
    },
  );

export type EpisodeJson = z.infer<typeof episodeJsonSchema>;

export type Episode = Omit<EpisodeJson, "transcript" | "transcriptFile"> & {
  transcript: Transcript;
};
