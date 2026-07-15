export const maskPublicEmail = (value?: string | null) => {
  if (!value) return '';

  const [localPart, domain] = value.split('@');
  if (!domain) {
    return value.length <= 2 ? value : `${value[0]}***${value.slice(-1)}`;
  }

  const firstChar = localPart?.[0] ?? '';
  const tail = localPart.length > 3 ? localPart.slice(-2) : '';
  const maskedLocal = `${firstChar}${'*'.repeat(Math.max(3, localPart.length - 3))}${tail}`;

  return `${maskedLocal}@${domain}`;
};
