import { POLICY_LABEL_KEY } from '../types/runtime-enforcer';

export function getBoundPolicyName(row: any): string {
  const podTemplate = row?.spec?.jobTemplate?.spec?.template ?? row?.spec?.template;
  const templateLabels = podTemplate?.metadata?.labels;
  const topLabels = row?.metadata?.labels;

  return templateLabels?.[POLICY_LABEL_KEY] || topLabels?.[POLICY_LABEL_KEY] || '';
}

export function findBoundPolicy(row: any, policies: any[]): any | null {
  const policyName = getBoundPolicyName(row);
  const namespace = row?.metadata?.namespace;

  if (!policyName || !namespace || !Array.isArray(policies)) {
    return null;
  }

  return policies.find((p) => p?.metadata?.name === policyName && p?.metadata?.namespace === namespace) || null;
}

export function getRuntimeSecurityValue(row: any): string {
  if (row.runtimeSecuritySortValue !== undefined) {
    return row.runtimeSecuritySortValue;
  }
  return getBoundPolicyName(row);
}