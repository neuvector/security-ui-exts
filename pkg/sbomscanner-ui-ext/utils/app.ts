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

export function getWorkloadLink(row: any, cluster: string, hash?: string): string {
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

  return `${baseUrl}/${routeMap[row.type] || ''}/${namespace}/${row.name}${hash ? `#${hash}` : ''}`;
}