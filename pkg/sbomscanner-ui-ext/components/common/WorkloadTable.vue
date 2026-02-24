<template>
  <div>
    <!-- Vulnerability Table -->
    <SortableTable
      key="workloads-table"
      :rows="workloads"
      :headers="WORKLOADS_TABLE"
      :has-advanced-filtering="false"
      :namespaced="false"
      :row-actions="false"
      :search="false"
      :paging="true"
      :key-field="isInWorkloadContext ? 'workloadName' : 'name'"
      @selection="onSelectionChange"
    >
      <template #header-left>
        <div class="table-header-actions">
          <button
            class="btn role-primary btn-text-report"
            :disabled="selectedWorkloadCount === 0"
            @click="downloadCustomReport"
          >
            <i class="icon icon-download me-3"></i>
            {{ t('imageScanner.images.buttons.downloadCustomReport') }}
          </button>
          <span
            v-if="selectedWorkloadCount > 0"
            class="selected-count"
          >
            {{ selectedWorkloadCount }} {{ selectedWorkloadCount > 1 ? t('imageScanner.imageDetails.selection.workloads') : t('imageScanner.imageDetails.selection.workload') }}
          </span>
        </div>
      </template>
    </SortableTable>
  </div>
</template>

<script>
import SortableTable from '@shell/components/SortableTable';
import { WORKLOADS_TABLE } from '@sbomscanner-ui-ext/config/table-headers';
import { downloadCSV } from '@sbomscanner-ui-ext/utils/report';
export default {
  name:       'WorkloadTable',
  components: {
    SortableTable,
  },
  props: {
    workloads: {
      type:    Array,
      default: () => {
        return [];
      },
    },
    isInWorkloadContext: {
      type:     Boolean,
      required: false,
      default:  false
    }
  },
  data() {
    return {
      selectedRows:          [],
      selectedWorkloadCount: 0,
      WORKLOADS_TABLE,
    };
  },
  methods: {
    async onSelectionChange(selected) {
      this.selectedRows = selected || [];
      this.selectedWorkloadCount = this.selectedRows.length;
    },

    downloadCustomReport() {
      try {
        if (this.selectedWorkloadCount === 0) {
          this.$store.dispatch('growl/error', {
            title:   'Error',
            message: 'No workload report data available for download'
          }, { root: true });

          return;
        }

        // Generate CSV from filtered workload data
        const csvData = this.generateCSVFromFilteredWorkloads();

        downloadCSV(csvData, `${ this.imageName }-workload-detail-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.csv`);

        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Custom report downloaded successfully'
        }, { root: true });
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: `Failed to download custom report: ${ error.message }`
        }, { root: true });
      }
    },

    generateCSVFromFilteredWorkloads() {
      // Use selected workloads if any are selected, otherwise use all filtered workloads
      const workloads = this.selectedRows && this.selectedRows.length > 0 ? this.selectedRows : this.workloads;

      const headers = [
        'WORKLOAD_NAME',
        'TYPE',
        'NAMESPACE',
        'IMAGE USED',
        'AFFECTING CVES',
        'SEVERITY-CRITICAL',
        'SEVERITY-HIGH',
        'SEVERITY-MEDIUM',
        'SEVERITY-LOW',
        'SEVERITY-UNKNOWN',
      ];

      const csvRows = [headers.join(',')];

      workloads.forEach((workload) => {
        const row = [
          `"${ workload.workloadName || '' }"`,
          `"${ workload.type || '' }"`,
          `"${ workload.namespace || '' }"`,
          `"${ workload.imageUsed || '' }"`,
          `"${ workload.affectingCves || 0 }"`,
          `"${ workload.severity.critical || 0 }"`,
          `"${ workload.severity.high || 0 }"`,
          `"${ workload.severity.medium || 0 }"`,
          `"${ workload.severity.low || 0 }"`,
          `"${ workload.severity.unknown || 0 }"`,
        ];

        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    },
  },
};
</script>

<style lang="scss" scoped>
.selected-count {
  font-weight: 400;
}

.table-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-top-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-text-report {
  padding: 0 16px;
}

.me-3 {
  margin-right: 12px;
}
</style>
