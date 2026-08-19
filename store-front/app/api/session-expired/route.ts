import { NextResponse } from "next/server";

import { deleteSession } from "@/lib/server-utils";

export async function GET(request: Request): Promise<NextResponse> {
  await deleteSession();
  return NextResponse.redirect(new URL("/sign-in", request.url));
}
