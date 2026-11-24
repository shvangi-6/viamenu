// German price format helpers.
// Valid user input: digits with an optional comma decimal separator ("1,50", "12,50").
// parseGermanPrice is strict (comma only) so a stray dot surfaces as an error
// instead of silently turning "1.50" into 150. formatGermanPrice is lenient so it
// can render numbers or dotted DB strings back into "x,yy".

export function parseGermanPrice(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!/^\d+(,\d*)?$/.test(s)) return null; // invalid format
  const [intPart, frac = ''] = s.split(',');
  const three = (frac + '000').slice(0, 3); // pad/truncate fraction to 3 digits
  // round half-up on the 3rd digit without floating-point drift (1,255 -> 1,26)
  const cents = parseInt(intPart, 10) * 100 + Math.floor((parseInt(three, 10) + 5) / 10);
  return cents / 100;
}

export function formatGermanPrice(value) {
  const num = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (num === null || num === undefined || Number.isNaN(num)) return '';
  return Number(num).toFixed(2).replace('.', ',');
}
