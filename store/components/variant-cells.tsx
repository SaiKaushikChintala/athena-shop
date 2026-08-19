"use client";

import { Input } from "@/components/ui/input";
import { VariantImagesDialog } from "@/components/variant-images-dialog";
import { type VariantDraft } from "@/types";

type Props = {
  label: string;
  draft: VariantDraft;
  disabled?: boolean;
  onChange: (patch: Partial<VariantDraft>) => void;
};

export const VARIANT_COLUMNS = ["Price", "Sale price", "Qty", "SKU", "Images"];

export function VariantCells({ label, draft, disabled, onChange }: Props): React.ReactElement {
  return (
    <>
      <td className="py-2 pr-4">
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          aria-label={`Price for ${label}`}
          value={draft.price}
          onChange={(e) => onChange({ price: e.target.value })}
          className="h-8 w-24 text-sm"
          disabled={disabled}
        />
      </td>
      <td className="py-2 pr-4">
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="—"
          aria-label={`Sale price for ${label}`}
          value={draft.discount}
          onChange={(e) => onChange({ discount: e.target.value })}
          className="h-8 w-24 text-sm"
          disabled={disabled}
        />
      </td>
      <td className="py-2 pr-4">
        <Input
          type="number"
          min="0"
          step="1"
          placeholder="0"
          aria-label={`Quantity for ${label}`}
          value={draft.quantity}
          onChange={(e) => onChange({ quantity: e.target.value })}
          className="h-8 w-20 text-sm"
          disabled={disabled}
        />
      </td>
      <td className="py-2 pr-4">
        <Input
          placeholder="SKU-001"
          aria-label={`SKU for ${label}`}
          value={draft.sku}
          onChange={(e) => onChange({ sku: e.target.value })}
          className="h-8 w-28 text-sm"
          disabled={disabled}
        />
      </td>
      <td className="py-2 pr-4">
        <VariantImagesDialog
          label={label}
          coverImage={draft.coverImage}
          images={draft.images}
          disabled={disabled}
          onChange={onChange}
        />
      </td>
    </>
  );
}
