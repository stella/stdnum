/** Validate a calendar date via Date round-trip. */
export const isValidDate = (
  year: number,
  month: number,
  day: number,
): boolean => {
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
};

/**
 * Resolve a 2-digit year to a 4-digit year using a
 * rolling pivot: years after the current year are
 * assumed to be in the previous century.
 */
export const resolveTwoDigitYear = (
  yy: number,
): number => {
  const y = 2000 + yy;
  return y > new Date().getFullYear() ? y - 100 : y;
};
