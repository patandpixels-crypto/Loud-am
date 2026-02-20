import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();

    if (!reference || typeof reference !== "string") {
      return NextResponse.json({ verified: false, error: "Missing reference" }, { status: 400 });
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
