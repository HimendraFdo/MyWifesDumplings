import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

/**
 * Sanity webhook target. When a document is published/edited, Sanity POSTs
 * here; we revalidate the Next.js cache tag matching the document's _type so
 * the change appears on the live site within seconds.
 *
 * Configure in Sanity (sanity.io/manage -> API -> Webhooks):
 *   URL:    https://my-wifes-dumplings.vercel.app/api/revalidate
 *   Secret: same value as SANITY_REVALIDATE_SECRET (set in Vercel env)
 */
export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<{ _type?: string }>(
      req,
      process.env.SANITY_REVALIDATE_SECRET
    );

    if (!isValidSignature) {
      return new NextResponse("Invalid signature", { status: 401 });
    }

    if (!body?._type) {
      return new NextResponse("Bad request: missing _type", { status: 400 });
    }

    revalidateTag(body._type);

    return NextResponse.json({
      revalidated: true,
      tag: body._type,
      now: Date.now(),
    });
  } catch (err) {
    console.error("Revalidate webhook error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
