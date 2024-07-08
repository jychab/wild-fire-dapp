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

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function convertUTCTimeToDayMonth(seconds: number) {
  // Create a Date object from UTC seconds
  const date = new Date(seconds * 1000); // Multiply by 1000 to convert seconds to milliseconds

  // Get day and month
  const day = date.getUTCDate(); // UTC day of the month (1-31)
  const monthIndex = date.getUTCMonth(); // UTC month (0-11); Add 1 to get 1-12 range
  const month = monthNames[monthIndex];

  return `${day} ${month}`;
}
