import { importTypes } from '@rancher/auto-import';
import { IPlugin, TableColumnLocation } from '@shell/core/types';
import { WORKLOAD_TYPES } from '@shell/config/types';
import runtimeEnforcer from './routes/runtime-enforcer';
import { getRuntimeSecurityValue } from './utils/workload-policy';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./config/runtime-enforcer'));

  // Add Vue Routes
  plugin.addRoutes(runtimeEnforcer);

  // Add Runtime Security column to Workload Deployments table
  plugin.addTableColumn(
    TableColumnLocation.RESOURCE,
    {
      resource: [WORKLOAD_TYPES.DEPLOYMENT],
      mode:     ['list'],
    },
    {
      name:      'runtimeSecurity',
      labelKey:  'runtimeEnforcer.tableColumns.runtimeSecurity.header',
      label:     'Runtime Security',
      formatter: 'RuntimeSecurityCell',
      getValue:  getRuntimeSecurityValue,
      search:    true,
    }
  );
}