<template>
  <!-- Download Full Report Dropdown -->
  <div class="dropdown-container">
    <button
      class="btn role-primary dropdown-main"
      aria-label="Download full report"
      type="button"
      @click="downloadFullCsvReport(reportMeta?.mainResourceIndex === 1 ? csvReportData1 : csvReportData2, reportMeta?.mainResourceIndex === 1 ? reportMeta?.resourceName1 : reportMeta?.resourceName2)"
      @focusout="handleClickOutside"
    >
      <i class="icon icon-download me-3"></i>
      {{ t('imageScanner.images.downloadReport') }}
    </button>
    <button
      class="btn role-primary dropdown-toggle"
      aria-label="Download options"
      type="button"
      @click="toggleDownloadDropdown"
    >
      <i :class="`icon ${ showDownloadDropdown ? 'icon-chevron-up' : 'icon-chevron-down' }`"></i>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="showDownloadDropdown"
      class="dropdown-menu"
    >
      <button
        class="dropdown-item"
        @click="downloadFullCsvReport(csvReportData1, reportMeta?.resourceName1)"
      >
        <i class="icon icon-download"></i>
        {{ reportMeta?.csvReportBtnName1 }}
      </button>
      <button
        v-if="reportMeta?.csvReportBtnName2"
        class="dropdown-item"
        @click="downloadFullCsvReport(csvReportData2, reportMeta?.resourceName2)"
      >
        <i class="icon icon-download"></i>
        {{ reportMeta?.csvReportBtnName2 }}
      </button>
      <button
        class="dropdown-item"
        @click="downloadVulnerabilityJsonReport(jsonReportData, reportMeta?.resourceName1)"
      >
        <i class="icon icon-download"></i>
        {{ reportMeta?.jsonReportBtnName }}
      </button>
    </div>
  </div>
</template>

<script>
import { downloadCSV, downloadJSON } from '@sbomscanner-ui-ext/utils/report';
import day from 'dayjs';
export default {
  name:  'DownloadFullReportBtn',
  props: {
    csvReportData1: {
      type:    Array,
      default: () => {
        return [];
      },
    },
    csvReportData2: {
      type:    Array,
      default: () => {
        return [];
      },
    },
    jsonReportData: {
      type:    Object,
      default: null,
    },
    /**
     * The data object for reportMeta
     * @property {string} csvReportBtnName1
     * @property {string?} csvReportBtnName2
     * @property {string} jsonReportBtnName
     * @property {string} resourceName1
     * @property {string?} resourceName2
     * @property {number} mainResourceIndex
     */
    reportMeta: {
      type:    Object,
      default: null,
    }
  },
  data() {
    return { showDownloadDropdown: false };
  },
  mounted() {
    document.addEventListener('mousedown', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  },
  methods: {
    downloadFullCsvReport(csvRepostData, resourceName) {
      try {
        if (!csvRepostData || csvRepostData.length === 0) {
          this.$store.dispatch('growl/error', {
            title:   'Error',
            message: 'No vulnerability report available for download'
          }, { root: true });

          return;
        }

        // Generate CSV from vulnerability report data
        // const csvData = this.generateCSVFromVulnerabilityReport(this.vulnerabilityDetails);

        downloadCSV(csvRepostData, `${ resourceName }-image-detail-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.csv`);

        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Full report downloaded successfully'
        }, { root: true });
        this.closeDownloadDropdown();
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: `Failed to download full report: ${ error.message }`
        }, { root: true });
      }
    },
    downloadVulnerabilityJsonReport(jsonReportData, resourceName) {
      try {
        if (!jsonReportData || (Array.isArray(jsonReportData) && jsonReportData.length === 0)) {
          this.$store.dispatch('growl/error', {
            title:   'Error',
            message: 'No vulnerability report data available for download'
          }, { root: true });

          return;
        }

        // Generate JSON vulnerability report
        const reportData = JSON.stringify(jsonReportData, null, 2);

        downloadJSON(reportData, `${ resourceName }-vulnerability-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.json`);

        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Vulnerability report downloaded successfully'
        }, { root: true });

        this.closeDownloadDropdown();
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: `Failed to download vulnerability report: ${ error.message }`
        }, { root: true });
      }
    },
    // Download dropdown methods
    toggleDownloadDropdown() {
      this.showDownloadDropdown = !this.showDownloadDropdown;
    },

    closeDownloadDropdown() {
      this.showDownloadDropdown = false;
    },

    handleClickOutside(event) {
      // Close dropdown if clicking outside
      if (this.showDownloadDropdown && !event.target.closest('.dropdown-container')) {
        this.closeDownloadDropdown();
      }
    },
  }
};
</script>

<style lang="scss" scoped>
.dropdown-container {
  position: relative;
  display: flex;
}

.dropdown-main {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
  // font-size: 16px;
  padding: 0 16px;
}

.dropdown-toggle {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  padding: 8px 8px;
  min-width: auto;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 215px;//236px;
  margin-top: 4px;
  padding: 16px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  color: #141419;
  cursor: pointer;
  transition: background-color 0.2s;
  padding: 0;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-item:first-child {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.dropdown-item:last-child {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

.me-3 {
  margin-right: 12px;
}
</style>
