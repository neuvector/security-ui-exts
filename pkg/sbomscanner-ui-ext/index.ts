import { importTypes } from '@rancher/auto-import';
import imageScanRoutes from '@sbomscanner-ui-ext/routes/sbomscanner-routes';
import { POD, WORKLOAD_TYPES } from '@shell/config/types';
import { IPlugin, TableColumnLocation, TabLocation } from '@shell/core/types';
import { workloadsVulnerabilityreports } from './tmp/workloads';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./config/sbomscanner'));

  // Add Vue Routes
  plugin.addRoutes(imageScanRoutes);

  plugin.addTableColumn(
    TableColumnLocation.RESOURCE,
    {
      resource: [
        WORKLOAD_TYPES.CRON_JOB,
        WORKLOAD_TYPES.DAEMON_SET,
        WORKLOAD_TYPES.DEPLOYMENT,
        WORKLOAD_TYPES.JOB,
        WORKLOAD_TYPES.STATEFUL_SET,
      ],
      mode: ['detail'],
      hash: ['pod']
    },
    {
      name:      'vulnerabilities',
      labelKey:  'imageScanner.images.listTable.headers.vulnerabilities',
      label:     'Vulnerabilities',
      weight:    7,
      width:     150,
      formatter: 'IdentifiedCVEsPercentagePopupCell',
      getValue:  (pod: any) => {
        if (pod?.type === 'pod') {
          // TODO: Replace workloadScanReport mockdata with API data
          // const owner = pod.metadata?.ownerReferences?.[0];
          // const targetId = owner ? owner.name : pod.metadata?.name;
          // const allReports = store.getters['cluster/all']('storage.sbomscanner.kubewarden.io.v1alpha1.workloadscanreport');
          // const matchingReport = allReports.find((report: any) => {
          //   return report.metadata?.name.includes(targetId);
          // });
          const matchingReport = workloadsVulnerabilityreports;
          const link = pod?.$rootState?.targetRoute.path + '#vulnerabilities';

          return {
            cveAmount: matchingReport?.summary || null,
            link:      link || null,
          } as any;
        }

        return undefined;
      }
    }
  );

  // Add a tab to workload detail page to show vulnerabilities for v2.12.6, v2.13.2, v2.14.0 and above
  plugin.addTab(
    TabLocation.RESOURCE_DETAIL_PAGE,
    {
      resource: [
        POD,
        WORKLOAD_TYPES.CRON_JOB,
        WORKLOAD_TYPES.DAEMON_SET,
        WORKLOAD_TYPES.DEPLOYMENT,
        WORKLOAD_TYPES.JOB,
        WORKLOAD_TYPES.STATEFUL_SET,
      ],
    },
    {
      name:       'vulnerabilities',
      labelKey:   'imageScanner.images.listTable.headers.vulnerabilities',
      label:      'Vulnerabilities',
      weight:     -5,
      showHeader: false,
      component:  () => import('./components/WorkloadVulnerabilities.vue')
    }
  );
  // Add a tab to workload detail drawer to show vulnerabilities for pre-2.12.6, pre-2.13.2
  plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    {
      resource: [
        POD,
        WORKLOAD_TYPES.CRON_JOB,
        WORKLOAD_TYPES.DAEMON_SET,
        WORKLOAD_TYPES.DEPLOYMENT,
        WORKLOAD_TYPES.JOB,
        WORKLOAD_TYPES.STATEFUL_SET,
      ],
    },
    {
      name:       'vulnerabilities',
      labelKey:   'imageScanner.images.listTable.headers.vulnerabilities',
      label:      'Vulnerabilities',
      weight:     -5,
      showHeader: false,
      component:  () => import('./components/WorkloadVulnerabilities.vue')
    }
  );

}
