import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

// Expected amounts per currency (in smallest unit: kobo for NGN, cents for USD)
const EXPECTED_AMOUNTS: Record<string, number> = {
  NGN: 300_00, // 300 NGN in kobo
  USD: 3_00, // $3 in cents
};

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user via Firebase ID token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const { reference, sectionId } = await request.json();

    if (!reference || typeof reference !== "string") {
      return NextResponse.json(
        { error: "Missing payment reference" },
        { status: 400 }
      );
    }
    if (!sectionId || typeof sectionId !== "string") {
      return NextResponse.json(
        { error: "Missing sectionId" },
        { status: 400 }
      );
    }

    // 3. Idempotency check — prevent duplicate grants for same reference
    const existingAccess = await adminDb
      .collection("sectionAccess")
      .where("paystackRef", "==", reference)
      .limit(1)
      .get();

    if (!existingAccess.empty) {
      return NextResponse.json(
        { success: true, message: "Access already granted for this payment" },
        { status: 200 }
      );
    }

    // 4. Verify payment with Paystack server-side
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Payment provider not configured" },
        { status: 500 }
      );
    }

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data?.status !== "success") {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // 5. Validate amount and currency match expected values
    const paidAmount = paystackData.data.amount; // in kobo/cents
    const paidCurrency = paystackData.data.currency as string;
    const expectedAmount = EXPECTED_AMOUNTS[paidCurrency];

    if (!expectedAmount || paidAmount < expectedAmount) {
      return NextResponse.json(
        { error: "Payment amount does not match expected amount" },
        { status: 400 }
      );
    }

    // 6. Validate that the payment metadata matches
    const metadata = paystackData.data.metadata || {};
    if (metadata.userId && metadata.userId !== uid) {
      return NextResponse.json(
        { error: "Payment does not belong to this user" },
        { status: 403 }
      );
    }

    // 7. Grant access — write sectionAccess record
    const amountInUsd =
      paidCurrency === "USD"
        ? paidAmount / 100
        : paidAmount / 100 / 100; // rough NGN->USD estimate; adjust with real rate

    await adminDb.collection("sectionAccess").add({
      sectionId,
      userId: uid,
      paidAt: Date.now(),
      amount: paidAmount / 100, // human-readable amount in original currency
      currency: paidCurrency,
      amountUsd: paidCurrency === "USD" ? paidAmount / 100 : null,
      paystackRef: reference,
    });

    // 8. Distribute earnings to section post authors (50% of paid amount)
    try {
      const sectionPostsSnap = await adminDb
        .collection("sectionPosts")
        .where("sectionId", "==", sectionId)
        .get();

      if (!sectionPostsSnap.empty) {
        // Revenue share: 50% of the paid amount in original currency
        const revenueShare = (paidAmount / 100) * 0.5;
        const perPost = revenueShare / sectionPostsSnap.size;

        const batch = adminDb.batch();

        for (const postDoc of sectionPostsSnap.docs) {
          const postData = postDoc.data();
          if (postData.authorId !== uid) {
            const earningRef = adminDb.collection("earnings").doc();
            batch.set(earningRef, {
              userId: postData.authorId,
              sectionId,
              sectionPostId: postDoc.id,
              fromPaymentBy: uid,
              amount: Math.round(perPost * 100) / 100,
              currency: paidCurrency,
              createdAt: Date.now(),
            });
          }
        }

        await batch.commit();
      }
    } catch (err) {
      console.error("Error distributing earnings:", err);
      // Access was already granted — earnings distribution failure is non-fatal
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Grant access error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
