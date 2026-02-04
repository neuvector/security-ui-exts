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
          @click="downloadCSVReport(rows, false)"
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
  },

  methods: {
    async downloadCSVReport(rows, isDataGrouped) {
      try {
        const imagesData = isDataGrouped ? rows.map((row) => row.images).flat() : rows;

        const imageList = imagesData.map((row) => {
          return {
            'IMAGE REFERENCE': isDataGrouped ? constructImageName(row.imageMetadata) : row.imageReference,
            'CVEs(Critical)':  isDataGrouped ? row.scanResult.critical : row.report.summary.critical,
            'CVEs(High)':      isDataGrouped ? row.scanResult.high : row.report.summary.high,
            'CVEs(Medium)':    isDataGrouped ? row.scanResult.medium : row.report.summary.medium,
            'CVEs(Low)':       isDataGrouped ? row.scanResult.low : row.report.summary.low,
            'CVEs(None)':      isDataGrouped ? row.scanResult.unknown : row.report.summary.unknown,
            'IMAGE ID':        row.imageMetadata.digest,
            REGISTRY:          row.imageMetadata.registry,
            REPOSITORY:        row.imageMetadata.repository,
            PLATFORM:          row.imageMetadata.platform,
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
    async downloadSbom(res) {
      try {
        const target = (res && res.length ? res[0] : null);
        const sbom = await this.$store.dispatch('cluster/find', { type: RESOURCE.SBOM, id: target.id });
        const spdxString = JSON.stringify(sbom.spdx, null, 2);
        const sbomBlob = new Blob([spdxString], { type: 'application/json;charset=utf-8' });

        await saveAs(sbomBlob, `${ sbom.metadata.name }-sbom_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.spdx.json`);
        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'SBOM downloaded successfully'
        }, { root: true });
      } catch (e) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: 'Failed to download SBOM'
        }, { root: true });
      }
    },
    async downloadJson(res) {
      try {
        const target = (res && res.length ? res[0] : null);
        const vulReport = await this.$store.dispatch('cluster/find', { type: RESOURCE.VULNERABILITY_REPORT, id: target.id });
        const jsonBlob = new Blob([JSON.stringify(vulReport.report, null, 2)], { type: 'application/json;charset=utf-8' });

        await saveAs(jsonBlob, `${ target.id }-vulnerabilities-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.json`);
        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Vulnerability report downloaded successfully'
        }, { root: true });
      } catch (e) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: 'Failed to download vulnerability report'
        }, { root: true });
      }
    },
    preprocessData(vulReports) {
      const severityKeys = ['critical', 'high', 'medium', 'low', 'unknown'];
      const repoMap = new Map();

      vulReports.forEach((report) => {
        let repoRec = {};
        const mapKey = `${ report.imageMetadata.repository },${ report.imageMetadata.registry }`;
        const currImageScanResult = {};

        for (const key of severityKeys) {
          currImageScanResult[key] = report.report.summary[key];
        }
        if (repoMap.has(mapKey)) {
          const currRepo = repoMap.get(mapKey);

          for (const key of severityKeys) {
            currRepo.cveCntByRepo[key] += report.report.summary[key];
          }
          currRepo.images.push(
            {
              id:             report.id,
              imageMetadata:  report.imageMetadata,
              metadata:       { name: report.metadata.name },
              imageReference: constructImageName(report.imageMetadata),
              scanResult:     currImageScanResult,
            }
          );
          repoMap.set(mapKey, currRepo);
        } else {
          repoRec = {
            id:           mapKey,
            repository:   report.imageMetadata.repository,
            registry:     report.imageMetadata.registry,
            metadata:     { namespace: report.metadata.namespace },
            cveCntByRepo: { ...currImageScanResult },
            images:       [
              {
                id:             report.id,
                imageMetadata:  report.imageMetadata,
                metadata:       { name: report.metadata.name },
                imageReference: constructImageName(report.imageMetadata),
                scanResult:     currImageScanResult,
              }
            ]
          };
          repoMap.set(mapKey, repoRec);
        }
      });

      return Array.from(repoMap.values());
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
