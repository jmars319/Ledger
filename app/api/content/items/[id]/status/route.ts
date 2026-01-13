import { NextResponse } from "next/server";
import { updateContentStatus } from "@/lib/content/service";
import { contentStatuses } from "@/lib/content/types";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const resolved = await params;
    const body = await request.json();
    const status = body?.status as string | undefined;
    const note = typeof body?.note === "string" ? body.note : undefined;

    if (!status || !contentStatuses.includes(status as never)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const result = await updateContentStatus(resolved.id, status as never, note);
    if (!result.ok) {
      return NextResponse.json({ ok: false, validation: result.validation }, { status: 400 });
    }
    return NextResponse.json({ ok: true, item: result.item, validation: result.validation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Content status update failed.";
    return NextResponse.json(
      { ok: false, validation: { ok: false, errors: [{ code: "content_status_failed", message }], warnings: [] } },
      { status: 400 },
    );
  }
}
