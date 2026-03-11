import { importTypes } from '@rancher/auto-import';
import imageScanRoutes from '@sbomscanner-ui-ext/routes/sbomscanner-routes';
import { getWorkloadScanReportValue } from '@sbomscanner-ui-ext/utils/workload-scan-report';
import { POD, WORKLOAD_TYPES } from '@shell/config/types';
import { IPlugin, TableColumnLocation, TabLocation } from '@shell/core/types';

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
        POD,
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
      getValue:  getWorkloadScanReportValue,
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
