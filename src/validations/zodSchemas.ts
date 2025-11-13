import { z } from "zod";
import { categories, priorities, statuses } from "./constants";

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const bodySchema = z.string().min(1).trim();

const asString = <T extends readonly string[]>(choices: T) =>
  z.preprocess(
    (v) => {
      if (v == null || v === "") return undefined;
      if (Array.isArray(v)) {
        if (v.length > 1) {
          throw new Error("Only one value allowed for this query parameter");
        }
        v = v[0];
      }
      return String(v).trim().toLowerCase();
    },
    z.enum(choices).optional()
  );


export const ticketQuerySchema = z
  .object({
    status: asString(statuses),
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

export const registerSchema = z
  .object({
    name: z.string().min(3).trim(),
    email: z.email().trim(),
    password: z.string().min(8),
    confirmation: z.string().min(8),
  })
  .refine((s) => s.password === s.confirmation, {
    message: "Password must match",
    path: ["confirmation"],
    when(payload) {
      return registerSchema
        .pick({ password: true, confirmation: true })
        .safeParse(payload.value).success;
    },
  });

export const loginSchema = z
  .object({
    email: z.email().trim(),
    password: z.string().min(8),
  })
  .strict();
