import { z } from "zod";

import { fromSchema } from "@/lib/validators";

const requiredText = z.string().trim().min(1, { error: "Required" });

export const productValidators = {
  name: fromSchema(requiredText),
  brand: fromSchema(requiredText),
  slug: fromSchema(
    z
      .string()
      .min(1, { error: "Required" })
      .regex(/^[a-z0-9-]+$/, { error: "Lowercase letters, numbers, hyphens only" }),
  ),
  description: fromSchema(requiredText),
  coverImage: fromSchema(requiredText),
};
