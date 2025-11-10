import { z } from "zod";

export const categories = [
  "communication",
  "relationship",
  "household",
  "finance",
  "wellbeing",
  "other",
] as const;

export const priorities = ["low", "medium", "high"] as const;

export const statuses = [
  "open",
  "in_progress",
  "needs_reflection",
  "resolved",
] as const;

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const asArray = <T extends readonly string[]>(choices: T) =>
  z.preprocess(
    (v) => {
      if (v == null || v === "") return undefined;
      const arr = Array.isArray(v) ? v : [v];
      return arr.map((s) => String(s).trim().toLowerCase());
    },
    z.array(z.enum(choices)).nonempty().optional(),
  );

export const ticketQuerySchema = z
  .object({
    category: asArray(categories),
    priority: asArray(priorities),
    status: asArray(statuses),
    archived: z.coerce.boolean().optional(),
  })
  .strict();

export const ticketSchema = z
  .object({
    boardId: objectId,
    title: z.string().min(3).trim(),
    description: z.string().trim().nullable(),
    category: z.enum(categories),
    priority: z.enum(priorities),
  })
  .strict();

export const ticketPatchSchema = z
  .object({
    title: z.string().min(3).trim().optional(),
    description: z.string().trim().nullable(),
    category: z.enum(categories).optional(),
    priority: z.enum(priorities).optional(),
    archived: z.boolean(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No fields changed" });

export const boardNameSchema = z.object({
  boardId: objectId,
  boardName: z.string().min(1),
});

export const acceptBodySchema = z.object({
  inviteId: objectId,
  response: z.boolean(),
});
