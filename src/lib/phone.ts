/** Normalize Tanzanian mobile numbers to international 255XXXXXXXXX format. */
export function normalizeTanzaniaPhone(input: string): string {
  let value = String(input ?? '').trim().replace(/[\s().-]/g, '');

  if (value.startsWith('+')) value = value.slice(1);
  if (value.startsWith('00')) value = value.slice(2);

  if (value.startsWith('255')) {
    value = value;
  } else if (value.startsWith('0')) {
    value = `255${value.slice(1)}`;
  } else if (/^[67]\d{8}$/.test(value)) {
    value = `255${value}`;
  }

  if (!/^255[67]\d{8}$/.test(value)) {
    throw new Error('Namba ya simu si sahihi. Tumia mfano 0787483953 au 255787483953.');
  }

  return value;
}
