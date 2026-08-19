"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

type Option = {
  name: string;
  values: Array<{
    value: string;
    meta: Record<string, string> | null;
  }>;
};

export function OptionSelector({
  options,
  selectedParams,
}: {
  options: Option[];
  selectedParams: Record<string, string>;
}): React.ReactElement {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [current, pick] = useOptimistic(
    selectedParams,
    (state, change: { name: string; value: string }) => ({ ...state, [change.name]: change.value }),
  );

  function select(optionName: string, value: string): void {
    startTransition(() => {
      pick({ name: optionName, value });
      const params = new URLSearchParams({ ...current, [optionName]: value });
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {options.map((option) => {
        const selected = current[option.name];
        return (
          <div key={option.name} className="flex flex-col gap-2">
            <p className="eyebrow">
              {option.name}
              {selected && (
                <span className="ml-2 font-normal normal-case tracking-normal text-foreground">
                  {selected}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {option.values.map((ov) => {
                const hex = ov.meta?.hex;
                const isSelected = selected === ov.value;

                if (hex) {
                  return (
                    <button
                      key={ov.value}
                      type="button"
                      title={ov.value}
                      onClick={() => select(option.name, ov.value)}
                      className={cn(
                        "size-7 rounded-full border-2 transition-all",
                        isSelected
                          ? "border-foreground scale-110 shadow-sm"
                          : "border-transparent hover:border-muted-foreground/40",
                      )}
                      style={{ backgroundColor: hex }}
                      aria-pressed={isSelected}
                    />
                  );
                }

                return (
                  <button
                    key={ov.value}
                    type="button"
                    onClick={() => select(option.name, ov.value)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 font-mono text-xs font-medium transition-colors",
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:border-foreground/40",
                    )}
                    aria-pressed={isSelected}
                  >
                    {ov.value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
