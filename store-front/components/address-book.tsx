"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AddressForm } from "@/components/address-form";
import { type SavedAddress } from "@/types";

type Props = {
  addresses: SavedAddress[];
  defaultFirstName: string;
  defaultLastName: string;
};

export function AddressBook({ addresses, defaultFirstName, defaultLastName }: Props): React.ReactElement {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  async function send(address: SavedAddress, init: RequestInit, success: string, failure: string): Promise<void> {
    setBusy(address.id);
    try {
      const res = await fetch(`/api/addresses/${address.id}`, init);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(data.message ?? failure);
        return;
      }
      toast.success(success);
      router.refresh();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  function remove(address: SavedAddress): Promise<void> {
    return send(address, { method: "DELETE" }, `Removed ${address.label}`, "Could not remove that address.");
  }

  function makeDefault(address: SavedAddress): Promise<void> {
    return send(
      address,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      },
      `${address.label} is now your default`,
      "Could not change your default address.",
    );
  }

  function saved(message: string): void {
    setEditing(null);
    toast.success(message);
    router.refresh();
  }

  const formProps = {
    defaultFirstName,
    defaultLastName,
    showDefaultToggle: addresses.length > 0,
    onCancel: () => setEditing(null),
  };

  if (addresses.length === 0 && editing !== "new") {
    return (
      <Empty className="border py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPin />
          </EmptyMedia>
          <EmptyTitle>No saved addresses</EmptyTitle>
          <EmptyDescription>Save an address here, or tick “Save this address” at checkout.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus data-icon="inline-start" />
            Add address
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {addresses.map((address) =>
        editing === address.id ? (
          <AddressForm
            key={address.id}
            existing={address}
            {...formProps}
            onDone={() => saved("Address updated")}
          />
        ) : (
          <div key={address.id} className="flex items-start justify-between gap-4 rounded-xl border p-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                {address.label}
                {address.isPrimary && <Badge variant="secondary">Default</Badge>}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {address.firstName} {address.lastName} · {address.street}, {address.city}, {address.state}{" "}
                {address.zipCode}, {address.country}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">{address.phone}</span>
              {!address.isPrimary && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto self-start p-0 text-xs"
                  disabled={busy === address.id}
                  onClick={() => makeDefault(address)}
                >
                  Set as default
                </Button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={busy === address.id}
                onClick={() => setEditing(address.id)}
                aria-label={`Edit ${address.label}`}
                className="text-muted-foreground"
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={busy === address.id}
                onClick={() => remove(address)}
                aria-label={`Remove ${address.label}`}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                {busy === address.id ? <Spinner /> : <Trash2 />}
              </Button>
            </div>
          </div>
        ),
      )}

      {editing === "new" ? (
        <AddressForm {...formProps} onDone={() => saved("Address saved")} />
      ) : (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setEditing("new")}>
          <Plus data-icon="inline-start" />
          Add address
        </Button>
      )}
    </div>
  );
}
