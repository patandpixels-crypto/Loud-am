declare global {
  interface Window {
    PaystackPop: {
      setup(options: {
        key: string;
        email: string;
        amount: number; // in kobo (NGN) or smallest currency unit
        currency?: string;
        ref?: string;
        metadata?: Record<string, unknown>;
        onClose: () => void;
        onSuccess: (response: { reference: string; trans: string; status: string; message: string }) => void;
      }): { openIframe: () => void };
    };
  }
}

interface PaystackConfig {
  email: string;
  amountInCents: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export function openPaystack({ email, amountInCents, currency = "NGN", metadata, onSuccess, onClose }: PaystackConfig) {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  if (!publicKey) {
    console.error("Paystack public key is not configured");
    return;
  }

  if (typeof window === "undefined" || !window.PaystackPop) {
    console.error("Paystack script not loaded");
    return;
  }

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email,
    amount: amountInCents,
    currency,
    ref: "LOUD_" + Date.now() + "_" + crypto.getRandomValues(new Uint32Array(1))[0].toString(36),
    metadata,
    onClose,
    onSuccess: (response) => {
      onSuccess(response.reference);
    },
  });

  handler.openIframe();
}

export async function verifyPayment(reference: string): Promise<{ verified: boolean; amount?: number }> {
  try {
    const res = await fetch("/api/paystack/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { verified: false };
  }
}

/**
 * Server-side grant access: verifies payment, creates sectionAccess, distributes earnings.
 * Requires a Firebase ID token for authentication.
 */
export async function grantAccessServerSide(
  reference: string,
  sectionId: string,
  idToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/grant-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ reference, sectionId }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Grant access failed" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}
