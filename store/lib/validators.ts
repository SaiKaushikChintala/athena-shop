import { type ZodType } from "zod";

export function fromSchema(schema: ZodType): ({ value }: { value: unknown }) => string | undefined {
  return ({ value }) => {
    const result = schema.safeParse(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  };
}

export function required(value: string): string | undefined {
  return value.trim().length === 0 ? "Required" : undefined;
}

export function inRange(min: number, max: number): (value: string) => string | undefined {
  return (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return "Must be a number";
    if (n < min) return `Must be at least ${min}`;
    if (n > max) return `Cannot exceed ${max}`;
    return undefined;
  };
}

export function optionalInRange(min: number, max: number): (value: string) => string | undefined {
  const check = inRange(min, max);
  return (value) => (value ? check(value) : undefined);
}
