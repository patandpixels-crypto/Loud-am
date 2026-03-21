import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { checkServerRateLimit } from "@/lib/serverRateLimit";
import { PRICING } from "@/lib/pricing";

// Expected amounts per currency (in smallest unit: kobo for NGN, cents for USD)
const EXPECTED_AMOUNTS = PRICING.expectedAmounts;

export async function POST(request: NextRequest) {
  try {
    // 0. Server-side rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateCheck = checkServerRateLimit(ip, "grant-access");
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateCheck.retryAfterMs / 1000)),
          },
        }
      );
    }

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

    if (!reference || typeof reference !== "string" || reference.length > 200) {
      return NextResponse.json(
        { error: "Missing or invalid payment reference" },
        { status: 400 }
      );
    }
    if (!sectionId || typeof sectionId !== "string") {
      return NextResponse.json(
        { error: "Missing sectionId" },
        { status: 400 }
      );
    }

    // 3. Verify payment with Paystack server-side
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

    // 4. Validate amount and currency match expected values
    const paidAmount = paystackData.data.amount; // in kobo/cents
    const paidCurrency = paystackData.data.currency as string;
    const expectedAmount = EXPECTED_AMOUNTS[paidCurrency];

    if (!expectedAmount || paidAmount < expectedAmount) {
      return NextResponse.json(
        { error: "Payment amount does not match expected amount" },
        { status: 400 }
      );
    }

    // 5. Validate that the payment metadata matches — REQUIRE userId in metadata
    const metadata = paystackData.data.metadata || {};
    if (!metadata.userId || metadata.userId !== uid) {
      return NextResponse.json(
        { error: "Payment does not belong to this user" },
        { status: 403 }
      );
    }

    // 6. Grant access atomically — use payment reference as document ID for idempotency
    const accessDocRef = adminDb.collection("sectionAccess").doc(reference);
    const lookupDocRef = adminDb
      .collection("sectionAccessLookup")
      .doc(`${uid}_${sectionId}`);

    const amountInUsd =
      paidCurrency === "USD"
        ? paidAmount / 100
        : paidAmount / 100 / 100; // rough NGN->USD estimate

    try {
      await adminDb.runTransaction(async (transaction) => {
        const existingDoc = await transaction.get(accessDocRef);
        if (existingDoc.exists) {
          throw new Error("ALREADY_EXISTS");
        }
        transaction.set(accessDocRef, {
          sectionId,
          userId: uid,
          paidAt: Date.now(),
          amount: paidAmount / 100, // human-readable amount in original currency
          currency: paidCurrency,
          amountUsd: paidCurrency === "USD" ? paidAmount / 100 : null,
          paystackRef: reference,
        });
        transaction.set(lookupDocRef, {
          userId: uid,
          sectionId,
          grantedAt: Date.now(),
        });
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "ALREADY_EXISTS") {
        return NextResponse.json(
          { success: true, message: "Access already granted for this payment" },
          { status: 200 }
        );
      }
      throw err;
    }

    // 7. Distribute earnings to section post authors (50% of paid amount)
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

    // 8. Referral bonus — award referrer 10% of payment on the referred user's first payment
    try {
      const payerDoc = await adminDb.collection("users").doc(uid).get();
      const payerData = payerDoc.data();
      if (payerData?.referredBy) {
        // Check if this is the user's first payment (only one sectionAccess record = this one)
        const payerAccessSnap = await adminDb
          .collection("sectionAccess")
          .where("userId", "==", uid)
          .limit(2)
          .get();

        if (payerAccessSnap.size === 1) {
          // First payment — find the referrer by their referral code
          const referrerSnap = await adminDb
            .collection("users")
            .where("referralCode", "==", payerData.referredBy)
            .limit(1)
            .get();

          if (!referrerSnap.empty) {
            const referrerId = referrerSnap.docs[0].id;
            const referralBonus = Math.round(paidAmount / 100 * PRICING.referralBonusDecimal * 100) / 100;
            await adminDb.collection("earnings").add({
              userId: referrerId,
              sectionId,
              sectionPostId: "",
              fromPaymentBy: uid,
              amount: referralBonus,
              currency: paidCurrency,
              type: "referral_bonus",
              createdAt: Date.now(),
            });
          }
        }
      }
    } catch (err) {
      console.error("Error processing referral bonus:", err);
      // Non-fatal
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
