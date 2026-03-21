// Centralized pricing configuration for BREAL
// All prices, revenue splits, and referral bonuses in one place.

export const PRICING = {
  // Section access pricing (what readers pay to unlock a company section)
  sectionAccess: {
    NGN: {
      amount: 1500, // NGN 1,500
      amountInKobo: 1500_00, // for Paystack (smallest unit)
      display: "\u20A61,500",
      label: "NGN",
    },
    USD: {
      amount: 3, // $3 USD
      amountInCents: 3_00, // for Paystack (smallest unit)
      display: "$3",
      label: "USD",
    },
  },

  // Revenue share — percentage of payment that goes to content creators
  creatorSharePercent: 50, // 50%
  creatorShareDecimal: 0.5,

  // Referral bonus — percentage of the payment amount
  referralBonusPercent: 10, // 10% of the payment
  referralBonusDecimal: 0.1,

  // Expected amounts for server-side verification (in smallest currency unit)
  expectedAmounts: {
    NGN: 1500_00, // 1500 NGN in kobo
    USD: 3_00, // $3 in cents
  } as Record<string, number>,
} as const;

// Helper: get display price for a currency
export function getDisplayPrice(currency: "NGN" | "USD"): string {
  return PRICING.sectionAccess[currency].display;
}

// Helper: get Paystack amount (in smallest unit) for a currency
export function getPaystackAmount(currency: "NGN" | "USD"): number {
  if (currency === "NGN") return PRICING.sectionAccess.NGN.amountInKobo;
  return PRICING.sectionAccess.USD.amountInCents;
}

// Helper: calculate referral bonus from a payment amount (in original currency units)
export function calculateReferralBonus(paidAmountInCurrency: number): number {
  return Math.round(paidAmountInCurrency * PRICING.referralBonusDecimal * 100) / 100;
}
