const PHONE_PATTERN = /^[6-9]\d{9}$/;

export function normalisePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const withoutCountryCode = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return isValidPhone(withoutCountryCode) ? withoutCountryCode : null;
}

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value);
}
