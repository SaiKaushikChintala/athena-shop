"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type OptionDraft } from "@/types";

type Props = {
  option: OptionDraft;
  onChange: (next: OptionDraft) => void;
  onRemove: () => void;
};

export function OptionEditor({ option, onChange, onRemove }: Props): React.ReactElement {
  const [draft, setDraft] = useState<string>("");

  function addValue(): void {
    const value = draft.trim();
    setDraft("");
    if (!value || option.values.some((v) => v.value === value)) return;
    onChange({ ...option, values: [...option.values, { id: crypto.randomUUID(), value, hex: "" }] });
  }

  function setHex(id: string, hex: string): void {
    onChange({ ...option, values: option.values.map((v) => (v.id === id ? { ...v, hex } : v)) });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Option name (e.g. Color, Size)"
          value={option.name}
          onChange={(e) => onChange({ ...option, name: e.target.value })}
          className="h-8 flex-1 text-sm"
        />
        <button
          type="button"
          onClick={() => onChange({ ...option, hasColor: !option.hasColor })}
          aria-pressed={option.hasColor}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
            option.hasColor
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:border-foreground/40",
          )}
        >
          Color swatches
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Remove option"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {option.values.map((v) => (
          <div key={v.id} className="flex items-center gap-1 rounded-md border bg-muted/40 py-1 pl-2.5 pr-1">
            {option.hasColor && (
              <input
                type="color"
                value={v.hex || "#000000"}
                onChange={(e) => setHex(v.id, e.target.value)}
                className="size-4 cursor-pointer rounded-sm border-0 bg-transparent p-0"
                title="Pick swatch color"
              />
            )}
            <span className="text-xs font-medium">{v.value}</span>
            <button
              type="button"
              onClick={() => onChange({ ...option, values: option.values.filter((x) => x.id !== v.id) })}
              aria-label={`Remove ${v.value}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        <div className="flex items-center gap-1">
          <Input
            placeholder="Add value…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addValue();
              }
            }}
            className="h-8 w-32 text-xs"
          />
          <Button type="button" size="sm" variant="outline" onClick={addValue} aria-label="Add value" className="h-8 px-2">
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
