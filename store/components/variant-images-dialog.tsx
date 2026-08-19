"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { ImageUpload } from "@/components/image-upload";
import { GalleryUpload } from "@/components/gallery-upload";
import { cn } from "@/lib/utils";

type Images = { coverImage: string; images: string[] };

type Props = Images & {
  label: string;
  disabled?: boolean;
  onChange: (next: Images) => void;
};

export function VariantImagesDialog({ label, coverImage, images, disabled, onChange }: Props): React.ReactElement {
  const [open, setOpen] = useState<boolean>(false);
  const [draft, setDraft] = useState<Images>({ coverImage, images });

  const count = (coverImage ? 1 : 0) + images.length;

  function openDialog(): void {
    setDraft({ coverImage, images });
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        disabled={disabled}
        aria-label={`Edit images for ${label}`}
        className={cn(
          "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border transition-colors hover:border-ring hover:bg-accent/40 disabled:pointer-events-none",
          coverImage ? "border-solid" : "border-dashed text-muted-foreground",
        )}
      >
        {coverImage ? <Image src={coverImage} alt="" fill unoptimized className="object-cover" /> : <ImagePlus className="size-4" />}

        {count > 1 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary font-mono text-[0.55rem] font-bold text-primary-foreground">
            {count}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Images for {label}</DialogTitle>
            <DialogDescription>
              Shown instead of the product photos when a shopper picks this variant. Leave empty to use the product
              images.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            <Field>
              <FieldLabel>Variant cover</FieldLabel>
              <ImageUpload value={draft.coverImage} onChange={(url) => setDraft((d) => ({ ...d, coverImage: url }))} />
            </Field>

            <Field>
              <FieldLabel>Variant gallery</FieldLabel>
              <GalleryUpload value={draft.images} onChange={(urls) => setDraft((d) => ({ ...d, images: urls }))} />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onChange(draft);
                setOpen(false);
              }}
            >
              Save images
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
