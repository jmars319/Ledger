import { NextResponse } from "next/server";
import { createContentItem, listContentItems } from "@/lib/content/service";
import { contentStatuses, contentTypes } from "@/lib/content/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const safeType = type && contentTypes.includes(type as never) ? (type as never) : undefined;
    const safeStatus =
      status && contentStatuses.includes(status as never) ? (status as never) : undefined;

    const items = await listContentItems({ type: safeType, status: safeStatus });
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Content list failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createContentItem(body);
    if (!result.ok) {
      return NextResponse.json({ ok: false, validation: result.validation }, { status: 400 });
    }

    return NextResponse.json({ ok: true, item: result.item, validation: result.validation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Content create failed.";
    return NextResponse.json({ ok: false, validation: { ok: false, errors: [{ code: "content_create_failed", message }], warnings: [] } }, { status: 400 });
  }
}
