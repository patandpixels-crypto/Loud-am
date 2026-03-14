// Generic/personal email domains that cannot be used to create company sections
const BLOCKED_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.co.in",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "tutanota.com",
  "tuta.com",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "gmx.net",
  "yandex.com",
  "yandex.ru",
  "fastmail.com",
  "hey.com",
  "pm.me",
  "inbox.com",
  "mail.ru",
  "rediffmail.com",
  "qq.com",
  "163.com",
  "126.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "web.de",
  "t-online.de",
  "comcast.net",
  "verizon.net",
  "att.net",
  "sbcglobal.net",
  "cox.net",
  "charter.net",
  "earthlink.net",
  "optonline.net",
  "frontier.com",
  "rocketmail.com",
]);

/**
 * Extract the domain part from an email address.
 * Returns lowercase domain or null if invalid.
 */
export function getEmailDomain(email: string): string | null {
  const parts = email.toLowerCase().trim().split("@");
  if (parts.length !== 2 || !parts[1].includes(".")) return null;
  return parts[1];
}

/**
 * Check if an email domain is a generic/personal provider.
 */
export function isGenericDomain(domain: string): boolean {
  return BLOCKED_DOMAINS.has(domain.toLowerCase());
}

/**
 * Validate that an email belongs to a specific company domain.
 */
export function emailMatchesDomain(email: string, companyDomain: string): boolean {
  const domain = getEmailDomain(email);
  return domain === companyDomain.toLowerCase();
}
