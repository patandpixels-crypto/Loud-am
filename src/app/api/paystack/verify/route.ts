import { NextRequest, NextResponse } from "next/server";
import { checkServerRateLimit } from "@/lib/serverRateLimit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateCheck = checkServerRateLimit(ip, "paystack-verify");
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { verified: false, error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateCheck.retryAfterMs / 1000)),
          },
        }
      );
    }

    const { reference } = await request.json();

    if (!reference || typeof reference !== "string" || reference.length > 200) {
      return NextResponse.json({ verified: false, error: "Missing or invalid reference" }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ verified: false, error: "Paystack not configured" }, { status: 500 });
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data = await res.json();

    if (data.status && data.data?.status === "success") {
      return NextResponse.json({
        verified: true,
        amount: data.data.amount, // in kobo
        currency: data.data.currency,
        reference: data.data.reference,
      });
    }

    return NextResponse.json({ verified: false, error: "Payment not successful" });
  } catch {
    return NextResponse.json({ verified: false, error: "Verification failed" }, { status: 500 });
  }
}
