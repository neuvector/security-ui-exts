import { RESOURCE } from '../../types/sbomscanner';
import { getPodListWorkloadScanReportValue, getWorkloadScanReportValue } from '../workload-scan-report';

jest.mock('@shell/config/types', () => ({ POD: 'pod' }));

describe('getWorkloadScanReportValue', () => {
  const emptySummary = {
    critical: 0,
    high:     0,
    medium:   0,
    low:      0,
    unknown:  0,
  };

  const createPodRow = ({
    type = 'pod',
    namespace = 'cattle-monitoring-system',
    workloadId = 'rancher-monitoring-kube-state-metrics',
    resourceType = 'apps.deployment',
    path = '/c/local/explorer/apps.deployment/cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
    reports = [],
  }: {
    type?: string;
    namespace?: string;
    workloadId?: string;
    resourceType?: string;
    path?: string;
    reports?: any[];
  } = {}) => {
    const dispatch = jest.fn().mockResolvedValue(reports);
    const allGetter = jest.fn().mockReturnValue(reports);

    return {
      dispatch,
      allGetter,
      row: {
        type,
        $dispatch:  dispatch,
        $getters:   { all: allGetter },
        $rootState: {
          targetRoute: {
            params: {
              namespace,
              id:       workloadId,
              resource: resourceType,
            },
            path,
          }
        }
      }
    };
  };

  it('returns undefined for non-pod rows', () => {
    const { row, dispatch, allGetter } = createPodRow({ type: 'apps.deployment' });

    const result = getWorkloadScanReportValue(row);

    expect(result).toBeUndefined();
    expect(dispatch).not.toHaveBeenCalled();
    expect(allGetter).not.toHaveBeenCalled();
  });

  it('dispatches findAll for workload scan reports', () => {
    const { row, dispatch } = createPodRow();

    getWorkloadScanReportValue(row);

    expect(dispatch).toHaveBeenCalledWith('findAll', { type: RESOURCE.WORKLOAD });
  });

  it('matches pod routes by workload id containing owner reference name', () => {
    const summary = {
      critical: 1,
      high:     2,
      medium:   3,
      low:      4,
      unknown:  5,
    };

    const reports = [
      {
        metadata: {
          namespace:       'cattle-monitoring-system',
          ownerReferences: [{ name: 'rancher-monitoring-kube-state-metrics' }],
          name:            'deployment-report',
        },
        summary,
      }
    ];

    const { row } = createPodRow({
      workloadId:   'rancher-monitoring-kube-state-metrics-75f84c97bb-4hzt4',
      resourceType: 'pod',
      reports,
    });

    const result = getWorkloadScanReportValue(row);

    expect(result?.cveAmount).toEqual(summary);
  });

  it('matches non-pod routes by exact owner reference name', () => {
    const summary = {
      critical: 9,
      high:     8,
      medium:   7,
      low:      6,
      unknown:  5,
    };

    const reports = [
      {
        metadata: {
          namespace:       'cattle-monitoring-system',
          ownerReferences: [{ name: 'rancher-monitoring-kube-state-metrics' }],
          name:            'deployment-report',
        },
        summary,
      },
      {
        metadata: {
          namespace:       'cattle-monitoring-system',
          ownerReferences: [{ name: 'rancher-monitoring' }],
          name:            'partial-report',
        },
        summary: emptySummary,
      }
    ];

    const { row } = createPodRow({
      workloadId:   'rancher-monitoring-kube-state-metrics',
      resourceType: 'apps.deployment',
      reports,
    });

    const result = getWorkloadScanReportValue(row);

    expect(result?.cveAmount).toEqual(summary);
  });

  it('returns empty cve summary when no matching report exists', () => {
    const reports = [
      {
        metadata: {
          namespace:       'other-namespace',
          ownerReferences: [{ name: 'some-workload' }],
        },
        summary: {
          critical: 4,
          high:     4,
          medium:   4,
          low:      4,
          unknown:  4,
        },
      }
    ];

    const { row } = createPodRow({ reports });

    const result = getWorkloadScanReportValue(row);

    expect(result?.cveAmount).toEqual(emptySummary);
  });

  it('builds the vulnerabilities link from target route path', () => {
    const { row } = createPodRow({ path: '/c/local/explorer/apps.deployment/cattle-monitoring-system/rancher-monitoring-kube-state-metrics' });

    const result = getWorkloadScanReportValue(row);

    expect(result?.link).toBe('/c/local/explorer/apps.deployment/cattle-monitoring-system/rancher-monitoring-kube-state-metrics#vulnerabilities');
  });
});

describe('getPodListWorkloadScanReportValue', () => {
  const emptySummary = {
    critical: 0,
    high:     0,
    medium:   0,
    low:      0,
    unknown:  0,
  };

  const createPodListRow = ({
    type = 'pod',
    name = 'rancher-monitoring-kube-state-metrics-75f84c97bb-4hzt4',
    namespace = 'cattle-monitoring-system',
    detailParams,
    reports = [],
  }: {
    type?: string;
    name?: string;
    namespace?: string;
    detailParams?: any;
    reports?: any[];
  } = {}) => {
    const dispatch = jest.fn().mockResolvedValue(reports);
    const allGetter = jest.fn().mockReturnValue(reports);

    return {
      dispatch,
      allGetter,
      row: {
        type,
        metadata: {
          name,
          namespace,
        },
        detailLocation: {
          params: detailParams || {
            cluster:  'local',
            product:  'explorer',
            resource: 'pod',
            namespace,
            id:       name,
          }
        },
        $dispatch: dispatch,
        $getters:  { all: allGetter },
      }
    };
  };

  it('returns undefined for non-pod rows', () => {
    const { row, dispatch, allGetter } = createPodListRow({ type: 'apps.deployment' });

    const result = getPodListWorkloadScanReportValue(row);

    expect(result).toBeUndefined();
    expect(dispatch).not.toHaveBeenCalled();
    expect(allGetter).not.toHaveBeenCalled();
  });

  it('dispatches findAll for workload scan reports', () => {
    const { row, dispatch } = createPodListRow();

    getPodListWorkloadScanReportValue(row);

    expect(dispatch).toHaveBeenCalledWith('findAll', { type: RESOURCE.WORKLOAD });
  });

  it('matches pod list rows by pod id containing owner reference name', () => {
    const summary = {
      critical: 2,
      high:     3,
      medium:   4,
      low:      5,
      unknown:  6,
    };

    const reports = [
      {
        metadata: {
          namespace:       'cattle-monitoring-system',
          ownerReferences: [{ name: 'rancher-monitoring-kube-state-metrics' }],
          name:            'deployment-report',
        },
        summary,
      }
    ];

    const { row } = createPodListRow({ reports });

    const result = getPodListWorkloadScanReportValue(row);

    expect(result?.cveAmount).toEqual(summary);
  });

  it('builds the vulnerabilities link from detail location params', () => {
    const { row } = createPodListRow();

    const result = getPodListWorkloadScanReportValue(row);

    expect(result?.link).toBe('/c/local/explorer/pod/cattle-monitoring-system/rancher-monitoring-kube-state-metrics-75f84c97bb-4hzt4#vulnerabilities');
  });

  it('returns empty cve summary when no matching report exists', () => {
    const reports = [
      {
        metadata: {
          namespace:       'other-namespace',
          ownerReferences: [{ name: 'some-workload' }],
        },
        summary: {
          critical: 4,
          high:     4,
          medium:   4,
          low:      4,
          unknown:  4,
        },
      }
    ];

    const { row } = createPodListRow({ reports });

    const result = getPodListWorkloadScanReportValue(row);

    expect(result?.cveAmount).toEqual(emptySummary);
  });
});
