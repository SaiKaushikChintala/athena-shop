import { z } from "zod";

const required = z.string().trim().min(1, { error: "Required" });

export const AddressFields = {
  label: z.string().trim().min(1, { error: "Give this address a name" }).max(40),
  firstName: required,
  lastName: required,
  phone: required,
  street: required,
  city: required,
  state: required,
  zipCode: required,
  country: required,
};

export const AddressSchema = z.object({
  ...AddressFields,
  isPrimary: z.boolean().optional(),
});
