"use client";

import { MapPin, Plus } from "lucide-react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { type SavedAddress } from "@/types";

export const NEW_ADDRESS = "__new__";

type Props = {
  addresses: SavedAddress[];
  value: string;
  onChange: (id: string) => void;
};

export function AddressPicker({ addresses, value, onChange }: Props): React.ReactNode {
  if (addresses.length === 0) return null;

  return (
    <RadioGroup value={value} onValueChange={onChange} className="gap-2">
      {addresses.map((a) => {
        const selected = value === a.id;
        return (
          <FieldLabel
            key={a.id}
            htmlFor={`addr-${a.id}`}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
              selected ? "border-ring bg-accent/50" : "hover:bg-accent/30",
            )}
          >
            <RadioGroupItem id={`addr-${a.id}`} value={a.id} className="mt-0.5" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                {a.label}
                {a.isPrimary && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
                    Default
                  </span>
                )}
              </span>
              <span className="text-xs font-normal leading-relaxed text-muted-foreground">
                {a.firstName} {a.lastName} · {a.street}, {a.city}, {a.state} {a.zipCode},{" "}
                {a.country}
              </span>
            </span>
          </FieldLabel>
        );
      })}

      <FieldLabel
        htmlFor="addr-new"
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 transition-colors",
          value === NEW_ADDRESS ? "border-ring bg-accent/50" : "hover:bg-accent/30",
        )}
      >
        <RadioGroupItem id="addr-new" value={NEW_ADDRESS} />
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Plus className="size-3.5 shrink-0 text-muted-foreground" />
          Use a different address
        </span>
      </FieldLabel>
    </RadioGroup>
  );
}
