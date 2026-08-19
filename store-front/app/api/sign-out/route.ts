import { deleteSession } from "@/lib/server-utils";

export async function POST(): Promise<Response> {
  await deleteSession();
  return Response.json({ ok: true });
}
