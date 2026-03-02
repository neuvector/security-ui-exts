import { POD, WORKLOAD_TYPES, INGRESS, SERVICE, WORKLOAD_TYPE_TO_KIND_MAPPING } from '@shell/config/types';
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

export function getWorkloadLink(row: any, cluster: string, hash?: string, query?: string): string {
  const namespace = row.namespace || 'default';
  const baseUrl = `/c/${cluster}/explorer`;

  const routeMap = {
    Pod:                                                          POD,
    [WORKLOAD_TYPE_TO_KIND_MAPPING[WORKLOAD_TYPES.CRON_JOB]]:     WORKLOAD_TYPES.CRON_JOB,
    [WORKLOAD_TYPE_TO_KIND_MAPPING[WORKLOAD_TYPES.DAEMON_SET]]:   WORKLOAD_TYPES.DAEMON_SET,
    Deployment:                                                   WORKLOAD_TYPES.DEPLOYMENT,
    [WORKLOAD_TYPE_TO_KIND_MAPPING[WORKLOAD_TYPES.JOB]]:          WORKLOAD_TYPES.JOB,
    [WORKLOAD_TYPE_TO_KIND_MAPPING[WORKLOAD_TYPES.STATEFUL_SET]]: WORKLOAD_TYPES.STATEFUL_SET,
    Ingress:                                                      INGRESS,
    Service:                                                      SERVICE
  };

  const queryString = query ? `?${query}` : '';

  return `${baseUrl}/${routeMap[row.type] || ''}/${namespace}/${row.name}${queryString}${hash ? `#${hash}` : ''}`;
}

/**
 * Generic array deduplicator.
 * @param arr - The array to filter
 * @param isValid - Function returning true if the item is not empty/invalid
 * @param getKey - Function returning a unique string representation of the item
 */
export function filterUnique<T>(
  arr: T[],
  isValid: (item: T) => boolean,
  getKey: (item: T) => string
): T[] {
  if (!arr || !Array.isArray(arr)) return [];

  const seen = new Set<string>();

  return arr.filter((item) => {
    if (!isValid(item)) return false;

    const key = getKey(item);
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}