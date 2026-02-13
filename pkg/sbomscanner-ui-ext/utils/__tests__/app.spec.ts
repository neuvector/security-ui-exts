import { jest } from '@jest/globals';
import { decodeBase64, getWorkloadLink } from '../app';

const mockAtob = jest.fn();

global.atob = mockAtob;

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

