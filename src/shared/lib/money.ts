// US-20 / RN-21: the backend serializes every monetary value as a string
// with 2 decimals (BE-13). The frontend only formats these strings for
// display and never sends monetary amounts in the deliver payload (RN-21).
const bobFormatter = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBoB(
  value: string | number | null | undefined,
  currency = 'BOB',
): string {
  if (value === null || value === undefined || value === '') {
    return 'No disponible';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return typeof value === 'string' ? value : String(value);
  }
  return `${bobFormatter.format(numeric)} ${currency}`;
}