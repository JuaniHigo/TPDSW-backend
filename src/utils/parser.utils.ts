// src/utils/parser.utils.ts
export const parseIntOr = (value: any, defaultValue: number): number => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};
