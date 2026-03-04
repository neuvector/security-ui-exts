<template>
  <Loading v-if="$fetchState.pending" />
  <div class="page">
    <div class="header-section mb-20">
      <div class="title">
        {{ t("imageScanner.images.title") }}
      </div>
      <div>
        <button
          mat-button
          class="btn role-primary"
          aria-label="Download full report"
          type="button"
          :disabled="!rows || rows.length === 0"
          @click="downloadCSVFullReport(rows)"
        >
          <i class="icon icon-download me-3"></i>
          {{ t('imageScanner.images.downloadReport') }}
        </button>
      </div>
    </div>
    <ImageTableSet
      :rows="rows"
      :isLoading="$fetchState.pending"
    />
  </div>
</template>

<script>
import { IMAGE_LIST_TABLE, REPO_BASED_TABLE, REPO_BASED_IMAGE_LIST_TABLE } from '@sbomscanner-ui-ext/config/table-headers';
import { RESOURCE } from '@sbomscanner-ui-ext/types';
import { saveAs } from 'file-saver';
import { constructImageName } from '@sbomscanner-ui-ext/utils/image';
import ImageTableSet from '@sbomscanner-ui-ext/components/common/ImageTableSet.vue';
import Papa from 'papaparse';
import _ from 'lodash';
import day from 'dayjs';

export default {
  name:       'ImageOverview',
  components: { ImageTableSet },
  data() {
    return {
      rows:         [],
      rowsByRepo:   [],
      REPO_BASED_TABLE,
      IMAGE_LIST_TABLE,
      REPO_BASED_IMAGE_LIST_TABLE,
      selectedRows: [],
      registryCrds: [],
    };
  },

  async fetch() {
    this.rows = await this.$store.dispatch('cluster/findAll', { type: RESOURCE.VULNERABILITY_REPORT });
    let scannedImages = await this.$store.dispatch('cluster/findAll', { type: RESOURCE.IMAGE });

    // Mocking workloadScanReports for demonstration, remove this when the actual data is available - start
    scannedImages = scannedImages.map((image, index) => {
      if (index % 8 !== 1) {
        image.status = {
          workloadScanReports: [
            {
              name:      'deployment-nginx',
              namespace: 'production'
            },
            {
              name:      'deployment-web-frontend',
              namespace: 'staging'
            }
          ]
        };
      }

      return image;
    });
    // Mocking workloadScanReports for demonstration, remove this when the actual data is available - end

    this.rows = this.rows.map((report) => {
      const status = scannedImages.find((image) => image.name === report.metadata.name)?.status || {};

      return {
        ...report,
        workloadCount: status.workloadScanReports ? status.workloadScanReports.length : 0
      };
    });
  },

  methods: {
    async downloadCSVFullReport(rows) {
      try {
        const imagesData = rows;

        const imageList = imagesData.map((row) => {
          return {
            'IMAGE REFERENCE': constructImageName(row.imageMetadata),
            'CVEs(Critical)':  row.report.summary.critical,
            'CVEs(High)':      row.report.summary.high,
            'CVEs(Medium)':    row.report.summary.medium,
            'CVEs(Low)':       row.report.summary.low,
            'CVEs(None)':      row.report.summary.unknown,
            'IN USE':          row.workloadCount && row.workloadCount > 0 ? 'Yes' : 'No',
            'WORKLOAD COUNT':  row.workloadCount || 0,
            'REGISTRY':        row.imageMetadata.registry,
            'REPOSITORY':      row.imageMetadata.repository,
            'PLATFORM':        row.imageMetadata.platform,
            'DIGEST':          row.imageMetadata.digest,
          };
        });
        const csvBlob = new Blob([Papa.unparse(imageList)], { type: 'text/csv;charset=utf-8' });

        await saveAs(csvBlob, `image-scan-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.csv`);
        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Image scan report downloaded successfully'
        }, { root: true });
      } catch (e) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: 'Failed to download image scan report'
        }, { root: true });
      }
    },
  },
};

</script>

<style scoped>
  .page {
    display: flex;
    flex-direction: column;
    padding: 24px;
    min-height: 100%;
  }
  .header-section {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    align-self: stretch;
    border-radius: 6px;
    .title {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 4px;
      flex: 1 0 0;
      font-family: Lato;
      font-size: 24px;
      font-style: normal;
      font-weight: 400;
      line-height: 32px; /* 133.333% */
    }
    .filter-dropdown {
      display: flex;
      width: 225px;
      height: 40px;
    }
  }
  .summary-section {
    display: flex;
    align-items: flex-start;
    align-self: stretch;
    border-radius: 6px;
    border: 1px solid #DCDEE7;
    background: #FFF;
    margin: 24px 0;
  }
  .me-3 {
    margin-right: 12px;
  }
</style>
