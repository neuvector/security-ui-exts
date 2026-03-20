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

function getPodListId(pod: any): string {
  return pod?.metadata?.name || pod?.id?.replace(/.*\//, '') || pod?.detailLocation?.params?.id || '';
}

function getPodListNamespace(pod: any): string {
  return pod?.metadata?.namespace || pod?.detailLocation?.params?.namespace || '';
}

function getPodListDetailPath(pod: any): string {
  const params = pod?.detailLocation?.params || {};
  const cluster = params.cluster;
  const product = params.product;
  const resource = params.resource;
  const namespace = params.namespace;
  const id = params.id;

  if (!cluster || !product || !resource || !id) {
    return '';
  }

  if (namespace) {
    return `/c/${ cluster }/${ product }/${ resource }/${ namespace }/${ id }`;
  }

  return `/c/${ cluster }/${ product }/${ resource }/${ id }`;
}

function findMatchingPodListWorkloadReport(reports: any[], namespace: string, podId: string) {
  if (!namespace || !podId) {
    return undefined;
  }

  return reports.find((report: any) => report.metadata.namespace === namespace && podId.includes(report.metadata.ownerReferences?.[0]?.name));
}

export function getPodListWorkloadScanReportValue(pod: any) {
  if (pod?.type !== POD) {
    return undefined;
  }

  if (pod?.$dispatch) {
    void pod.$dispatch('findAll', { type: RESOURCE.WORKLOAD }).catch(() => {});
  }

  const namespace = getPodListNamespace(pod);
  const podId = getPodListId(pod);
  const reports = pod?.$getters?.['all']?.(RESOURCE.WORKLOAD) || [];
  const matchingReport = findMatchingPodListWorkloadReport(reports, namespace, podId);
  const detailPath = getPodListDetailPath(pod);
  const link = detailPath ? `${ detailPath }#vulnerabilities` : '';

  return {
    cveAmount: matchingReport?.summary || EMPTY_CVE_SUMMARY,
    link,
  } as any;
}
