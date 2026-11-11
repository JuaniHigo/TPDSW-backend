export function cents(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error('Importe inválido');
  const [whole, decimal = ''] = value.split('.');
  const result = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(result)) throw new Error('Importe fuera de rango');
  return result;
}
export function decimal(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0 || value > 9999999999)
    throw new Error('Importe fuera de rango');
  return Math.floor(value / 100) + '.' + String(value % 100).padStart(2, '0');
}
