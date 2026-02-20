<template>
    <div class="search-filters">
      <div class="filter-row">
        <div class="filter-item">
          <label>{{ t('imageScanner.images.listTable.headers.imageName') }}</label>
          <div class="filter-input-wrapper">
            <input
              v-model="filters.imageSearch"
              type="text"
              :placeholder="t('imageScanner.images.listTable.filters.placeholder.image')"
              class="filter-input"
            />
            <i
              class="icon icon-search"
              style="color: #6C6C76; margin-left: 8px;"
            ></i>
          </div>
        </div>
        <div class="filter-item">
          <label>{{ t('imageScanner.images.listTable.filters.label.severity') }}</label>
          <LabeledSelect
            v-model:value="filters.severitySearch"
            :options="severityOptions"
            :close-on-select="true"
            :multiple="false"
          />
        </div>
        <div class="filter-item">
          <label>{{ t('imageScanner.images.listTable.filters.label.inUse') }}</label>
          <LabeledSelect
              v-model:value="filters.inUseSearch"
              :options="inUseOptions"
              :close-on-select="true"
              :multiple="false"
          />
        </div>
        <div class="filter-item" v-if="isInWorkloadContext">
          <label>{{ t('imageScanner.images.listTable.filters.label.container') }}</label>
          <div class="filter-input-wrapper">
            <input
              v-model="filters.containerSearch"
              type="text"
              :placeholder="t('imageScanner.images.listTable.filters.placeholder.image')"
              class="filter-input"
            />
            <i
              class="icon icon-search"
              style="color: #6C6C76; margin-left: 8px;"
            ></i>
          </div>
        </div>
        <div class="filter-item">
          <label>{{ t('imageScanner.images.listTable.filters.label.repository') }}</label>
          <LabeledSelect
            v-model:value="filters.repositorySearch"
            :options="repositoryOptions"
            :close-on-select="true"
            :multiple="false"
          />
        </div>
        <div class="filter-item">
          <label>{{ t('imageScanner.images.listTable.filters.label.registry') }}</label>
          <LabeledSelect
            v-model:value="filters.registrySearch"
            :options="registryOptions"
            :close-on-select="true"
            :multiple="false"
          />
        </div>
        <div class="filter-item">
          <label>{{ t('imageScanner.images.listTable.filters.label.platform') }}</label>
          <div class="filter-input-wrapper">
            <input
              v-model="filters.platformSearch"
              type="text"
              :placeholder="t('imageScanner.images.listTable.filters.placeholder.image')"
              class="filter-input"
            />
            <i
              class="icon icon-search"
              style="color: #6C6C76; margin-left: 8px;"
            ></i>
          </div>
        </div>
      </div>
    </div>
    <SortableTable
      :headers="isGrouped ? REPO_BASED_TABLE : ( isInWorkloadContext ? WORKLOAD_IMAGE_LIST_TABLE : IMAGE_LIST_TABLE)"
      :namespaced="false"
      :search="false"
      :paging="true"
      :row-actions="!isGrouped"
      :table-actions="true"
      :sub-expandable="isGrouped"
      :sub-rows="isGrouped"
      :sub-expand-column="isGrouped"
      :rows="isGrouped ? rowsByRepo : filteredRows.rows"
      :loading="isLoading"
      :key-field="'id'"
      @selection="onSelectionChange"
    >
      <template #header-left>
        <div class="table-top-left">
          <button
            mat-button
            class="btn role-primary btn-text-report"
            aria-label="Download custom report"
            :disabled="!(selectedRows && selectedRows.length)"
            type="button"
            @click="downloadCSVReport(selectedRows, isGrouped)"
          >
            <i class="icon icon-download me-3"></i>
            {{ isInWorkloadContext ? t('imageScanner.workloads.buttons.downloadReport') : t('imageScanner.images.buttons.downloadCustomReport')}}
          </button>
        </div>
      </template>
      <template #header-right v-if="!isInWorkloadContext">
        <Checkbox
          v-model:value="isGrouped"
          style="margin: auto 0;"
          label-key="imageScanner.images.listTable.checkbox.groupByRepo"
        />
      </template>
      <template
        v-if="isGrouped"
        #sub-row="{ row, fullColspan }"
      >
        <tr
          class="sub-row"
        >
          <td :colspan="fullColspan">
            <SortableTable
              class="sub-table"
              :rows="row.images"
              :headers="REPO_BASED_IMAGE_LIST_TABLE"
              :search="false"
              :row-actions="true"
              :table-actions="false"
              :key-field="'id'"
            >
              <template #row-actions="{ row: subRow }">
                <ActionMenu
                  :resource="subRow"
                  :custom-actions="customActions"
                />
              </template>
            </SortableTable>
          </td>
        </tr>
      </template>
      <template #row-actions="{ row }">
        <ActionMenu
          :resource="row"
          :custom-actions="customActions"
        />
      </template>
    </SortableTable>
</template>

<script>
import SortableTable from '@shell/components/SortableTable';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import { IMAGE_LIST_TABLE, REPO_BASED_TABLE, REPO_BASED_IMAGE_LIST_TABLE, WORKLOAD_IMAGE_LIST_TABLE } from '@sbomscanner-ui-ext/config/table-headers';
import { Checkbox } from '@components/Form/Checkbox';
import { RESOURCE } from '@sbomscanner-ui-ext/types';
import { imageDetailsToCSV } from '@sbomscanner-ui-ext/utils/report';
import { saveAs } from 'file-saver';
import { constructImageName } from '@sbomscanner-ui-ext/utils/image';
import Papa from 'papaparse';
import _ from 'lodash';
import day from 'dayjs';
import { WORKLOAD_ANNOTATION_PREFIX } from "@sbomscanner-ui-ext/constants";

export default {
  name:  'ImageOverview',
  props: {
    rows: {
      type:     Array,
      required: false,
      default:  () => []
    },
    isInWorkloadContext: {
      type:     Boolean,
      required: false,
      default:  false
    },
    isLoading: {
      type:     Boolean,
      required: false,
      default:  false
    }
  },
  components: {
    LabeledSelect,
    SortableTable,
    Checkbox,
    ActionMenu
  },
  data() {
    const filterCveOptions = [
      {
        value: 'allCves',
        label: this.t('imageScanner.images.filters.cve.allCves')
      },
      {
        value: 'affectingCvesOnly',
        label: this.t('imageScanner.images.filters.cve.affectingCvesOnly')
      },
    ];
    const filterImageOptions = [
      {
        value: 'allImages',
        label: this.t('imageScanner.images.filters.image.allImages')
      },
      {
        value: 'excludeBaseImages',
        label: this.t('imageScanner.images.filters.image.excludeBaseImages')
      },
      {
        value: 'includeBaseImages',
        label: this.t('imageScanner.images.filters.image.includeBaseImages')
      }
    ];
    const severityOptions = [
      {
        value: 'any',
        label: this.t('imageScanner.imageDetails.any')
      },
      {
        value: 'critical',
        label: this.t('imageScanner.enum.cve.critical')
      },
      {
        value: 'high',
        label: this.t('imageScanner.enum.cve.high')
      },
      {
        value: 'medium',
        label: this.t('imageScanner.enum.cve.medium')
      },
      {
        value: 'low',
        label: this.t('imageScanner.enum.cve.low')
      },
      {
        value: 'unknown',
        label: this.t('imageScanner.enum.cve.unknown')
      },
    ];
    const inUseOptions = [
      { value: 'Any', label: this.t('imageScanner.general.any') },
      { value: 'true', label: this.t('imageScanner.general.yes') },
      { value: 'false', label: this.t('imageScanner.general.no') }
    ];

    return {
      REPO_BASED_TABLE,
      IMAGE_LIST_TABLE,
      WORKLOAD_IMAGE_LIST_TABLE,
      REPO_BASED_IMAGE_LIST_TABLE,
      isGrouped:           false,
      selectedRows:        [],
      rowsByRepo:          [],
      filterCveOptions,
      filterImageOptions,
      severityOptions,
      inUseOptions,
      selectedCveFilter:   filterCveOptions[0],
      selectedImageFilter: filterImageOptions[0],
      filters:             {
        imageSearch:      '',
        severitySearch:   severityOptions[0].value,
        containerSearch:  '',
        repositorySearch: 'Any',
        registrySearch:   'Any',
        platformSearch:   '',
        inUseSearch:      'Any',
      },
      debouncedFilters: {
        imageSearch:      '',
        severitySearch:   severityOptions[0].value,
        containerSearch:  '',
        repositorySearch: 'Any',
        registrySearch:   'Any',
        platformSearch:   '',
        inUseSearch:      'Any',
      },
      registryCrds: [],
    };
  },
  watch: {
    filters: {
      handler: _.debounce(function(newFilters) {
        this.debouncedFilters = { ...newFilters };
      }, 500),
      deep: true,
    },
  },
  computed: {
    filteredRows() {
      const filters = this.debouncedFilters;
      const rowsWithMockedAnnotations = this.rows.map((row, index) => {
        const mockAnnotations = {
          "cattle.io/timestamp": "2026-02-19T09:00:00Z",
          "sbomscanner.kubewarden.io/workloadscan-a1b2c3d4-56ef": '{"name":"cert-manager","namespace":"cert-manager","containers":1}',
          "sbomscanner.kubewarden.io/workloadscan-9876xyz-1234": '{"name":"coredns","namespace":"kube-system","containers":1}'
        };
        const annotationsToUse = index % 8 !== 1 ? mockAnnotations : {};
        const count = Object.keys(annotationsToUse).filter(key =>
            key.startsWith(WORKLOAD_ANNOTATION_PREFIX)
        ).length;

        return {
          ...row,
          metadata: {
            ...row.metadata,
            annotations: annotationsToUse
          },
          workloadCount: count
        };
      })
      const filteredRows = rowsWithMockedAnnotations.filter((row) => {
        const imageName = constructImageName(row.imageMetadata);
        const imageMatch = !filters.imageSearch || imageName.toLowerCase().includes(filters.imageSearch.toLowerCase());
        const severityMatch = (() => {
          if (filters.severitySearch === 'any') {
            return true;
          }
          let result = false;
          const severityLevels = ['critical', 'high', 'medium', 'low', 'unknown'];

          for (const level of severityLevels) {
            if (level === filters.severitySearch.toLowerCase() && row.report.summary[level] > 0) {
              result = true;
              break;
            } else if (level !== filters.severitySearch.toLowerCase() && row.report.summary[level] > 0) {
              break;
            }
          }

          return result;
        })();
        const inUseMatch = (()=>{
          if (filters.inUseSearch === 'Any') return true;
          if (filters.inUseSearch === 'true') return row.workloadCount > 0;
          if (filters.inUseSearch === 'false') return row.workloadCount === 0;
          return true;
        })();
        const repositoryMatch = filters.repositorySearch === 'Any' || row.imageMetadata.repository === filters.repositorySearch;
        const registryMatch = filters.registrySearch === 'Any' || `${ row.metadata.namespace }/${ row.imageMetadata.registry }` === filters.registrySearch;
        const platformMatch = !filters.platformSearch || (row.imageMetadata.platform && row.imageMetadata.platform.toLowerCase().includes(filters.platformSearch.toLowerCase()));
        const containerMatch = !filters.containerSearch || (row.metadata.container && row.metadata.container.toLowerCase().includes(filters.containerSearch.toLowerCase()));

        return imageMatch && severityMatch && inUseMatch && repositoryMatch && registryMatch && platformMatch && containerMatch;
      });

      this.rowsByRepo = this.preprocessData(filteredRows);

      return {
        rows: filteredRows,
      };
    },
    customActions() {
      const downloadSbom = {
        action:   'downloadSbom',
        label:    this.t('imageScanner.images.buttons.downloadSbom'),
        icon:     'icon-download',
        enabled:  true,
        bulkable: false,
        invoke:   (_, res) => {
          this.downloadSbom(res);
        }
      };
      const downloadCsv = {
        action:   'downloadCsv',
        label:    this.t('imageScanner.images.buttons.downloadCsv'),
        icon:     'icon-download',
        enabled:  true,
        bulkable: false,
        invoke:   (_, res) => {
          this.downloadCsv(res);
        }
      };
      const downloadJson = {
        action:   'downloadJson',
        label:    this.t('imageScanner.images.buttons.downloadJson'),
        icon:     'icon-download',
        enabled:  true,
        bulkable: false,
        invoke:   (_, res) => {
          this.downloadJson(res);
        }
      };

      return [
        downloadSbom,
        { divider: true },
        downloadCsv,
        downloadJson
      ];
    },
    repositoryOptions() {
      const repoSet = new Set();

      (this.registryCrds || []).forEach((reg) => {
        if (reg.spec && reg.spec.repositories && reg.spec.repositories.length) {
          reg.spec.repositories.forEach((repo) => repoSet.add(repo.name));
        }
      });

      this.rows.forEach((row) => {
        if (row.imageMetadata && row.imageMetadata.repository) {
          repoSet.add(row.imageMetadata.repository);
        }
      });

      return ['Any', ...repoSet];
    },
    registryOptions() {
      const registrySet = new Set();

      (this.registryCrds || []).forEach((reg) => {
        if (reg.metadata && reg.metadata.namespace && reg.metadata.name) {
          registrySet.add(`${ reg.metadata.namespace }/${ reg.metadata.name }`);
        }
      });

      this.rows.forEach((row) => {
        if (row.imageMetadata && row.imageMetadata.registry && row.metadata && row.metadata.namespace) {
          registrySet.add(`${ row.metadata.namespace }/${ row.imageMetadata.registry }`);
        }
      });

      return ['Any', ...registrySet];
    }
  },

  async fetch() {
    this.registryCrds = await this.$store.dispatch('cluster/findAll', { type: RESOURCE.REGISTRY });
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
    async downloadCsv(res) {
      try {
        const target = (res && res.length ? res[0] : null);
        const vulReport = await this.$store.dispatch('cluster/find', { type: RESOURCE.VULNERABILITY_REPORT, id: target.id });
        let vulnerabilityList = [];

        vulReport.report.results.forEach((result) => {
          vulnerabilityList = vulnerabilityList.concat(result.vulnerabilities);
        });
        const csv = imageDetailsToCSV(
          vulnerabilityList
        );
        const csvBlob = new Blob([Papa.unparse(csv)], { type: 'text/csv;charset=utf-8' });

        await saveAs(csvBlob, `${ target.id }-image-detail-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.csv`);
        this.$store.dispatch('growl/success', {
          title:   'Success',
          message: 'Image detail report downloaded successfully'
        }, { root: true });
      } catch (e) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: 'Failed to download image detail report'
        }, { root: true });
      }
    },
    async onSelectionChange(selected) {
      this.selectedRows = selected || [];
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
  .table-filter-section {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    align-self: stretch;
    .table-filter {
      justify-content: center;
      align-items: flex-start;
      gap: 4px;
      flex: 1 0 0;
      .title {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
        align-self: stretch;
        overflow: hidden;
        color: var(--disabled-text);
        text-overflow: ellipsis;
        font-family: Lato;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 21px; /* 150% */
      }
    }
  }

  .filter-row {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
  }

  .filter-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .filter-item label {
    font-weight: 400;
    color: var(--disabled-text);
    font-size: 14px;
  }

  .filter-input-wrapper {
    display: flex;
    align-items: center;
    border: solid var(--border-width) var(--input-border);
    border-radius: 6px;
    padding: 0 12px;
    background: var(--input-bg);
  }

  .filter-input {
    flex: 1;
    padding: 10px 0;
    border: none;
    outline: none;
    font-size: 14px;
    line-height: 19px;
    background: transparent;
  }

  .score-input {
    color: #BEC1D2;
  }

  .score-input::placeholder {
    color: #BEC1D2;
  }

  .filter-input:focus {
    outline: none;
  }

  .filter-input-wrapper:focus-within {
    border-color: var(--outline);
    box-shadow: 0 0 0 2px rgba(0, 124, 186, 0.1);
  }

  .filter-select {
    padding: 10px 14px;
    border: 1px solid #DCDEE7;
    border-radius: 6px;
    font-size: 14px;
    background: #FFF;
    outline: none;
  }

  .filter-select:focus {
    border-color: #007cba;
    box-shadow: 0 0 0 2px rgba(0, 124, 186, 0.1);
  }

  .filter-actions {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid #DCDEE7;
  }

  .btn-text-report {
    padding: 0 16px;
  }

  .me-3 {
    margin-right: 12px;
  }

</style>
