import { z } from 'zod';

export const CountryCodeSchema = z.enum(['ID', 'PH', 'TH']);
export type CountryCode = z.infer<typeof CountryCodeSchema>;

export const TasteMatchSchema = z.enum(['strong', 'some', 'weak', 'none']);
export type TasteMatch = z.infer<typeof TasteMatchSchema>;

export const CountrySchema = z.object({
  code: CountryCodeSchema,
  name: z.string(),
  language: z.string(),
  reach: z.number().min(0).max(1),
  reachReason: z.string(),
});
export type Country = z.infer<typeof CountrySchema>;

export const SourceTypeSchema = z.enum(['search_interest', 'search_volume', 'content', 'comments', 'competitor']);

export const EvidenceSchema = z.object({
  id: z.string(),
  country: CountryCodeSchema,
  sourceType: SourceTypeSchema,
  finding: z.string(),
  sourceUrl: z.string().regex(/^https?:\/\//),
  collectedOn: z.string(),
  originalLanguage: z.string().optional(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const BookTagsSchema = z.object({
  readable: z.boolean(),
  title: z.string(),
  cuisine: z.string(),
  spiceLevel: z.enum(['mild', 'medium', 'hot', 'unknown']),
  portion: z.enum(['small', 'family', 'unknown']),
  cookingTime: z.string(),
  ingredientCost: z.enum(['low', 'medium', 'high', 'unknown']),
  dietaryFit: z.array(z.string()),
  language: z.string(),
});
export type BookTags = z.infer<typeof BookTagsSchema>;

export const CountryFitSchema = z.object({
  country: CountryCodeSchema,
  score: z.number().nullable(),
  confidence: z.enum(['low', 'medium', 'high']).nullable(),
  tasteMatch: TasteMatchSchema,
  reason: z.string(),
  suggestedAngle: z.string(),
  gaps: z.array(z.string()),
  evidence: z.array(EvidenceSchema),
});
export type CountryFit = z.infer<typeof CountryFitSchema>;

export const TestKitSchema = z.object({
  country: CountryCodeSchema,
  language: z.string(),
  recipeTitle: z.string(),
  ingredients: z.array(z.string()),
  steps: z.array(z.string()),
  swaps: z.array(z.object({ from: z.string(), to: z.string(), why: z.string() })),
  liveScript: z.string(),
  signupPath: z.string(),
});
export type TestKit = z.infer<typeof TestKitSchema>;
