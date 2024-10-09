import { DAS } from '../types/das';

export function formatLargeNumber(number: number | string) {
  if (typeof number == 'string') {
    number = parseFloat(number);
  }
  if (number < 1 && number > 0) {
    return number.toPrecision(3);
  } else if (number < 1000) {
    return number.toFixed(2);
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

export function getDDMMYYYY(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
  const yyyy = date.getFullYear();

  const formattedDate = `${yyyy}-${mm}-${dd}`;
  return formattedDate;
}

export function getTimeAgo(timestamp: number) {
  const now = Date.now();
  const past = timestamp * 1000;
  const diffInSeconds = Math.floor((now - past) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

export function checkIfTruncated(element: HTMLSpanElement | null) {
  if (!element) return null;
  const isTextClamped = element.scrollHeight > element.clientHeight;
  return isTextClamped;
}

export function checkIfMetadataIsTemporary(
  metadata: DAS.GetAssetResponse | null | undefined
) {
  return !metadata || metadata.temporary;
}
