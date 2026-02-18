import { importTypes } from '@rancher/auto-import';
import { IPlugin, TabLocation } from '@shell/core/types';
import imageScanRoutes from '@sbomscanner-ui-ext/routes/sbomscanner-routes';
import { POD, WORKLOAD_TYPES, INGRESS, SERVICE } from '@shell/config/types';

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
