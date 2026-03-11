import { POD } from '@shell/config/types';
import { RESOURCE } from '../types/sbomscanner';

const EMPTY_CVE_SUMMARY = {
  critical: 0,
  high:     0,
  medium:   0,
  low:      0,
  unknown:  0,
};

function findMatchingWorkloadReport(reports: any[], namespace: string, workloadId: string, resourceType: string) {
  if (!namespace || !workloadId) {
    return undefined;
  }

  if (resourceType === POD) {
    return reports.find((report: any) => report.metadata.namespace === namespace && workloadId.includes(report.metadata.ownerReferences?.[0]?.name));
  }

  return reports.find((report: any) => report.metadata.namespace === namespace && report.metadata.ownerReferences?.[0]?.name === workloadId);
}

export function getWorkloadScanReportValue(pod: any) {
  if (pod?.type !== POD) {
    return undefined;
  }

  const targetRoute = pod?.$rootState?.targetRoute;
  const routeParams = targetRoute?.params || {};
  const namespace = routeParams.namespace as string;
  const workloadId = routeParams.id as string;
  const resourceType = routeParams.resource as string;

  if (pod?.$dispatch) {
    void pod.$dispatch('findAll', { type: RESOURCE.WORKLOAD }).catch(() => {});
  }

  const reports = pod?.$getters?.['all']?.(RESOURCE.WORKLOAD) || [];
  const matchingReport = findMatchingWorkloadReport(reports, namespace, workloadId, resourceType);
  const link = targetRoute?.path ? `${ targetRoute.path }#vulnerabilities` : '';

  return {
    cveAmount: matchingReport?.summary || EMPTY_CVE_SUMMARY,
    link,
  } as any;
}
