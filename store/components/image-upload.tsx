"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { IMAGE_ACCEPT, uploadImage } from "@/lib/upload";

type Props = {
  value: string;
  onChange: (url: string) => void;
  invalid?: boolean;
  id?: string;
};

export function ImageUpload({ value, onChange, invalid, id }: Props): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showLink, setShowLink] = useState<boolean>(false);

  async function upload(file: File): Promise<void> {
    setBusy(true);
    setError(null);
    const result = await uploadImage(file);
    setBusy(false);
    if ("error" in result) setError(result.error);
    else onChange(result.url);
  }

  function pick(): void {
    inputRef.current?.click();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          aria-label={value ? "Replace image" : "Upload image"}
          className={cn(
            "relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed text-muted-foreground transition-colors",
            invalid ? "border-destructive" : "hover:border-ring hover:bg-accent/40",
          )}
        >
          {busy && <Spinner />}
          {!busy && value && <Image src={value} alt="" fill unoptimized className="object-cover" />}
          {!busy && !value && <ImagePlus className="size-5" />}
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={pick}>
              {busy && <Spinner data-icon="inline-start" />}
              {value ? "Replace" : "Upload image"}
            </Button>

            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange("");
                  setError(null);
                }}
                className="text-muted-foreground hover:text-destructive"
              >
                <X data-icon="inline-start" />
                Remove
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLink((v) => !v)}
              className="text-muted-foreground"
            >
              {showLink ? "Hide link" : "Use a link"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or AVIF · up to 1 MB</p>

          {showLink && (
            <Input
              id={id}
              type="url"
              placeholder="https://..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              aria-invalid={invalid}
              className="font-mono text-xs"
            />
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
