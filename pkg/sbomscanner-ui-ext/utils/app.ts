// Utility method to decode base64 strings
export function decodeBase64(str: string) {
  try {
    return atob(str);
  } catch (error) {
    return str; // Return original string if decoding fails
  }
}

export function trimIntervalSuffix(interval: string): string {
  const regex = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
  const matches = interval.match(regex);

  if (!matches) {
    return interval;
  }

  const [, hours, minutes, seconds] = matches;
  let result = '';

  if (hours && hours !== '0') {
    result += `${hours}h`;
  }

  if (minutes && minutes !== '0') {
    result += `${minutes}m`;
  }

  if (seconds && seconds !== '0') {
    result += `${seconds}s`;
  }

  return result || interval;
} 