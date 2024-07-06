export function formatLargeNumber(number: number | string) {
  if (typeof number == 'string') {
    number = parseInt(number);
  }
  if (number < 1000) {
    return number;
  } else if (number < 1_000_000) {
    return (number / 1000).toFixed(2) + 'K';
  } else if (number < 1_000_000_000) {
    return (number / 1_000_000).toFixed(2) + 'M';
  } else if (number < 1_000_000_000_000) {
    return (number / 1_000_000_000).toFixed(2) + 'B';
  } else {
    return (number / 1_000_000_000_000).toFixed(2) + 'T';
  }
}
