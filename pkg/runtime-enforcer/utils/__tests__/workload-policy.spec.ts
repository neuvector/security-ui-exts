import {
  getBoundPolicyName,
  findBoundPolicy,
  getRuntimeSecurityValue,
} from '../workload-policy';
import { POLICY_LABEL_KEY } from '../../types/runtime-enforcer';

describe('workload-policy utils', () => {
  describe('getBoundPolicyName', () => {
    it('returns policy name from spec.template pod labels for standard workloads', () => {
      const row = {
        spec: {
          template: {
            metadata: {
              labels: { [POLICY_LABEL_KEY]: 'strict-policy' },
            },
          },
        },
      };

      expect(getBoundPolicyName(row)).toBe('strict-policy');
    });

    it('returns policy name from spec.jobTemplate.spec.template for job-based workloads', () => {
      const row = {
        spec: {
          jobTemplate: {
            spec: {
              template: {
                metadata: {
                  labels: { [POLICY_LABEL_KEY]: 'cron-policy' },
                },
              },
            },
          },
        },
      };

      expect(getBoundPolicyName(row)).toBe('cron-policy');
    });

    it('falls back to top-level metadata labels when pod template label is absent', () => {
      const row = {
        metadata: {
          labels: { [POLICY_LABEL_KEY]: 'top-level-policy' },
        },
        spec: {
          template: {
            metadata: {
              labels: {},
            },
          },
        },
      };

      expect(getBoundPolicyName(row)).toBe('top-level-policy');
    });

    it('prefers pod template label over top-level metadata label if both exist', () => {
      const row = {
        metadata: {
          labels: { [POLICY_LABEL_KEY]: 'top-level' },
        },
        spec: {
          template: {
            metadata: {
              labels: { [POLICY_LABEL_KEY]: 'template-level' },
            },
          },
        },
      };

      expect(getBoundPolicyName(row)).toBe('template-level');
    });

    it('returns an empty string when no policy label is present', () => {
      const row = {
        metadata: { labels: { app: 'nginx' } },
        spec:     { template: { metadata: { labels: {} } } },
      };

      expect(getBoundPolicyName(row)).toBe('');
    });

    it('handles undefined or null row safely', () => {
      expect(getBoundPolicyName(undefined)).toBe('');
      expect(getBoundPolicyName(null)).toBe('');
      expect(getBoundPolicyName({})).toBe('');
    });
  });

  describe('findBoundPolicy', () => {
    const policies = [
      {
        metadata: { name: 'policy-prod', namespace: 'production' },
        spec:     { mode: 'protect' },
      },
      {
        metadata: { name: 'policy-stage', namespace: 'staging' },
        spec:     { mode: 'monitor' },
      },
    ];

    it('finds matching policy by name and namespace', () => {
      const row = {
        metadata: { namespace: 'production' },
        spec:     {
          template: {
            metadata: { labels: { [POLICY_LABEL_KEY]: 'policy-prod' } },
          },
        },
      };

      const match = findBoundPolicy(row, policies);

      expect(match).toEqual(policies[0]);
    });

    it('returns null if policy name matches but namespace differs', () => {
      const row = {
        metadata: { namespace: 'other-ns' },
        spec:     {
          template: {
            metadata: { labels: { [POLICY_LABEL_KEY]: 'policy-prod' } },
          },
        },
      };

      expect(findBoundPolicy(row, policies)).toBeNull();
    });

    it('returns null if policy name does not match any existing policy', () => {
      const row = {
        metadata: { namespace: 'production' },
        spec:     {
          template: {
            metadata: { labels: { [POLICY_LABEL_KEY]: 'non-existent' } },
          },
        },
      };

      expect(findBoundPolicy(row, policies)).toBeNull();
    });

    it('returns null if workload has no policy label', () => {
      const row = {
        metadata: { namespace: 'production' },
      };

      expect(findBoundPolicy(row, policies)).toBeNull();
    });

    it('returns null if workload has no namespace', () => {
      const row = {
        spec: {
          template: {
            metadata: { labels: { [POLICY_LABEL_KEY]: 'policy-prod' } },
          },
        },
      };

      expect(findBoundPolicy(row, policies)).toBeNull();
    });

    it('returns null if policies list is empty or not an array', () => {
      const row = {
        metadata: { namespace: 'production' },
        spec:     {
          template: {
            metadata: { labels: { [POLICY_LABEL_KEY]: 'policy-prod' } },
          },
        },
      };

      expect(findBoundPolicy(row, [])).toBeNull();
      expect(findBoundPolicy(row, null as any)).toBeNull();
      expect(findBoundPolicy(row, undefined as any)).toBeNull();
    });
  });

  describe('getRuntimeSecurityValue', () => {
    it('returns runtimeSecuritySortValue if present on the row', () => {
      const row = {
        runtimeSecuritySortValue: '1_protect',
        metadata:                 { labels: { [POLICY_LABEL_KEY]: 'test-policy' } },
      };

      expect(getRuntimeSecurityValue(row)).toBe('1_protect');
    });

    it('falls back to bound policy name when runtimeSecuritySortValue is undefined', () => {
      const row = {
        spec: {
          template: {
            metadata: { labels: { [POLICY_LABEL_KEY]: 'fallback-policy' } },
          },
        },
      };

      expect(getRuntimeSecurityValue(row)).toBe('fallback-policy');
    });

    it('returns empty string when row has neither sort value nor bound policy', () => {
      const row = { metadata: { name: 'deploy-a' } };

      expect(getRuntimeSecurityValue(row)).toBe('');
    });
  });
});