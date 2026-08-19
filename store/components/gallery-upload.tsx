"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { IMAGE_ACCEPT, uploadImage } from "@/lib/upload";

const MAX_IMAGES = 12;

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
};

export function GalleryUpload({ value, onChange }: Props): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadMany(files: File[]): Promise<void> {
    const room = MAX_IMAGES - value.length;
    if (room <= 0) return;

    setBusy(true);
    setError(null);

    const added: string[] = [];
    const failures: string[] = [];
    for (const file of files.slice(0, room)) {
      const result = await uploadImage(file);
      if ("error" in result) failures.push(result.error);
      else added.push(result.url);
    }

    setBusy(false);
    if (added.length > 0) onChange([...value, ...added]);
    if (failures.length > 0) setError(failures.join(" · "));
    else if (files.length > room) setError(`Only ${room} more image${room !== 1 ? "s" : ""} could be added.`);
  }

  function move(from: number, to: number): void {
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={`${url}-${i}`} className="group relative size-24 overflow-hidden rounded-xl border bg-muted">
            <Image src={url} alt="" fill unoptimized className="object-cover" />

            <button
              type="button"
              onClick={() => onChange(value.filter((_, index) => index !== i))}
              aria-label={`Remove image ${i + 1}`}
              className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
            >
              <X className="size-3" />
            </button>

            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/85 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                aria-label={`Move image ${i + 1} earlier`}
                className="flex-1 py-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowLeft className="mx-auto size-3" />
              </button>
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === value.length - 1}
                aria-label={`Move image ${i + 1} later`}
                className="flex-1 py-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowRight className="mx-auto size-3" />
              </button>
            </div>
          </div>
        ))}

        {value.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            aria-label="Add gallery images"
            className="flex size-24 shrink-0 items-center justify-center rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-ring hover:bg-accent/40"
          >
            {busy ? <Spinner /> : <ImagePlus className="size-5" />}
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {value.length}/{MAX_IMAGES} · shown after the cover, in this order
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length > 0) void uploadMany(files);
        }}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {value.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([])}
          className="self-start text-muted-foreground hover:text-destructive"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
