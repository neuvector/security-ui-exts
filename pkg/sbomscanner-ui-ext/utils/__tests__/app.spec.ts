import { jest } from '@jest/globals';
import { decodeBase64, getWorkloadLink, trimIntervalSuffix, filterUnique } from '../app';

const mockAtob = jest.fn();

global.atob = mockAtob as any;

describe('decodeBase64', () => {
  beforeEach(() => {
    mockAtob.mockClear();
  });

  it('should return the decoded string when atob succeeds', () => {
    const base64Str = 'SGVsbG8gV29ybGQ=';
    const decodedStr = 'Hello World';

    mockAtob.mockReturnValue(decodedStr);

    const result = decodeBase64(base64Str);

    expect(result).toBe(decodedStr);
    expect(mockAtob).toHaveBeenCalledWith(base64Str);
    expect(mockAtob).toHaveBeenCalledTimes(1);
  });

  it('should return the original string when atob throws an error', () => {
    const invalidStr = 'not-valid-base64';
    const error = new Error('Failed to decode');

    mockAtob.mockImplementation(() => {
      throw error;
    });

    const result = decodeBase64(invalidStr);

    expect(result).toBe(invalidStr);
    expect(mockAtob).toHaveBeenCalledWith(invalidStr);
    expect(mockAtob).toHaveBeenCalledTimes(1);
  });
});

describe('trimIntervalSuffix', () => {
  it('should format standard hours, minutes, and seconds', () => {
    expect(trimIntervalSuffix('3h')).toBe('3h');
    expect(trimIntervalSuffix('1h30m')).toBe('1h30m');
    expect(trimIntervalSuffix('45s')).toBe('45s');
    expect(trimIntervalSuffix('2h15m30s')).toBe('2h15m30s');
  });

  it('should omit zero values', () => {
    expect(trimIntervalSuffix('0h15m')).toBe('15m');
    expect(trimIntervalSuffix('1h0m30s')).toBe('1h30s');
    expect(trimIntervalSuffix('0h0m45s')).toBe('45s');
  });

  it('should return the original string if it is all zeros', () => {
    expect(trimIntervalSuffix('0h0m0s')).toBe('0h0m0s');
  });

  it('should return the original string if the format does not match', () => {
    expect(trimIntervalSuffix('invalid-interval')).toBe('invalid-interval');
    expect(trimIntervalSuffix('10days')).toBe('10days');
  });
});

describe('filterUnique', () => {
  it('should return an empty array if input is not an array', () => {
    expect(filterUnique(null as any, () => true, () => '')).toEqual([]);
    expect(filterUnique(undefined as any, () => true, () => '')).toEqual([]);
    expect(filterUnique('string' as any, () => true, () => '')).toEqual([]);
  });

  it('should filter out invalid items based on isValid function', () => {
    const data = [{ id: 1 }, { id: null }, { id: 2 }];
    const isValid = (item: any) => item.id !== null;
    const getKey = (item: any) => String(item.id);

    const result = filterUnique(data, isValid, getKey);

    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('should remove duplicate items based on getKey function', () => {
    const data = [
      { id: 1, val: 'a' },
      { id: 2, val: 'b' },
      { id: 1, val: 'c' } // Duplicate ID
    ];
    const isValid = (item: any) => true;
    const getKey = (item: any) => String(item.id);

    const result = filterUnique(data, isValid, getKey);

    // Should keep the first occurrence of id: 1
    expect(result).toEqual([
      { id: 1, val: 'a' },
      { id: 2, val: 'b' }
    ]);
  });

  it('should handle complex key generation and validation', () => {
    const data = [
      { os: 'linux', arch: 'amd64' },
      { os: 'linux', arch: 'arm64' },
      { os: 'linux', arch: 'amd64' }, // Duplicate
      { os: '', arch: 'amd64' } // Invalid
    ];
    const isValid = (item: any) => !!item.os && !!item.arch;
    const getKey = (item: any) => `${item.os}-${item.arch}`;

    const result = filterUnique(data, isValid, getKey);

    expect(result).toEqual([
      { os: 'linux', arch: 'amd64' },
      { os: 'linux', arch: 'arm64' }
    ]);
  });
});

// Mock constants
jest.mock('@shell/config/types', () => ({
  POD: 'pod',
  SERVICE: 'service',
  INGRESS: 'ingress',
  WORKLOAD_TYPES: {
    CRON_JOB: 'cronjob',
    DAEMON_SET: 'daemonset',
    DEPLOYMENT: 'deployment',
    JOB: 'job',
    STATEFUL_SET: 'statefulset'
  },
  WORKLOAD_TYPE_TO_KIND_MAPPING: {
    cronjob: 'CronJob',
    daemonset: 'DaemonSet',
    job: 'Job',
    statefulset: 'StatefulSet'
  }
}));

describe('getWorkloadLink', () => {
  const cluster = 'local';

  it('should generate pod link correctly', () => {
    const row = {
      type: 'Pod',
      namespace: 'kube-system',
      name: 'nginx'
    };

    const result = getWorkloadLink(row, cluster);

    expect(result).toBe('/c/local/explorer/pod/kube-system/nginx');
  });

  it('should default namespace to "default" if not provided', () => {
    const row = {
      type: 'Pod',
      name: 'nginx'
    };

    const result = getWorkloadLink(row, cluster);

    expect(result).toBe('/c/local/explorer/pod/default/nginx');
  });

  it('should generate deployment link correctly', () => {
    const row = {
      type: 'Deployment',
      namespace: 'apps',
      name: 'frontend'
    };

    const result = getWorkloadLink(row, cluster);

    expect(result).toBe('/c/local/explorer/deployment/apps/frontend');
  });

  it('should append hash if provided', () => {
    const row = {
      type: 'Pod',
      namespace: 'default',
      name: 'nginx'
    };

    const result = getWorkloadLink(row, cluster, 'details');

    expect(result).toBe('/c/local/explorer/pod/default/nginx#details');
  });

  it('should append query string if provided', () => {
    const row = {
      type: 'Pod',
      namespace: 'default',
      name: 'nginx'
    };

    const result = getWorkloadLink(row, cluster, undefined, 'mode=edit');

    expect(result).toBe('/c/local/explorer/pod/default/nginx?mode=edit');
  });

  it('should append both query string and hash if provided', () => {
    const row = {
      type: 'Pod',
      namespace: 'default',
      name: 'nginx'
    };

    const result = getWorkloadLink(row, cluster, 'details', 'mode=edit');

    expect(result).toBe('/c/local/explorer/pod/default/nginx?mode=edit#details');
  });

  it('should return empty route segment if type not mapped', () => {
    const row = {
      type: 'UnknownType',
      namespace: 'default',
      name: 'test'
    };

    const result = getWorkloadLink(row, cluster);

    expect(result).toBe('/c/local/explorer//default/test');
  });

  it('should handle cronjob mapping correctly', () => {
    const row = {
      type: 'CronJob',
      namespace: 'batch',
      name: 'nightly'
    };

    const result = getWorkloadLink(row, cluster);

    expect(result).toBe('/c/local/explorer/cronjob/batch/nightly');
  });
});