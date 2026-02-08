<template>
<!-- Search Filters -->
<div style="gap: 0">
  <div class="search-filters">
    <div class="filter-row">
      <div class="filter-item">
          <label>{{ t('imageScanner.workloads.table.headers.workloadName') }}</label>
          <div class="filter-input-wrapper">
            <input
                v-model="filters.workloadSearch"
                type="text"
                placeholder="Search by ID"
                class="filter-input"
            />
            <i
                class="icon icon-search"
                style="color: #6C6C76; margin-left: 8px;"
            ></i>
          </div>
      </div>
      <div class="filter-item">
          <label>{{ t('imageScanner.workloads.table.headers.type') }}</label>
          <LabeledSelect
          v-model:value="filters.type"
          :options="filterTypeOptions"
          :close-on-select="true"
          :multiple="false"
          />
      </div>
      <div class="filter-item">
          <label>{{ t('imageScanner.workloads.table.headers.namespace') }}</label>
          <LabeledSelect
          v-model:value="filters.namespace"
          :options="filterNamespaceOptions"
          :close-on-select="true"
          :multiple="false"
          />
      </div>
      <div class="filter-item">
          <label>{{ t('imageScanner.imageDetails.severity') }}</label>
          <LabeledSelect
          v-model:value="filters.severity"
          :options="filterSeverityOptions"
          :close-on-select="true"
          :multiple="false"
          />
      </div>
    </div>
  </div>

  <!-- Vulnerability Table -->
  <WorkloadTable
    :workloads="cachedFilteredWorkloads"
    :is-in-image-context="isInImageContext"
  />
</div>
</template>

<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import WorkloadTable from './WorkloadTable.vue';

export default {
  name:       'WorkloadTableSet',
  components: {
    LabeledSelect,
    WorkloadTable,
  },
  props: {
    workloads: {
      type:    Array,
      default: () => []
    },
    isInImageContext: {
      type:     Boolean,
      required: false,
      default:  false
    }
  },
  data() {
    return {
      cachedFilteredWorkloads: [],
      filters: {
        workloadSearch: '',
        type:           'any',
        namespace:      'any',
        severity:       'any',
      },
      filterTypeOptions:      [],
      filterNamespaceOptions: [],
      filterSeverityOptions:  [
        { label: this.t('imageScanner.imageDetails.severityFilterOptions.any'), value: 'any' },
        { label: this.t('imageScanner.imageDetails.severityFilterOptions.critical'), value: 'Critical' },
        { label: this.t('imageScanner.imageDetails.severityFilterOptions.high'), value: 'High' },
        { label: this.t('imageScanner.imageDetails.severityFilterOptions.medium'), value: 'Medium' },
        { label: this.t('imageScanner.imageDetails.severityFilterOptions.low'), value: 'Low' },
        { label: this.t('imageScanner.imageDetails.severityFilterOptions.unknown'), value: 'Unknown' },
      ],
    };
  },

  fetch() {
    this.workloads.forEach((wl) => {
      const typeOption = { label: wl.type, value: wl.type };

      if (!this.filterTypeOptions.some((opt) => opt.value === typeOption.value)) {
        this.filterTypeOptions.push(typeOption);
      }

      const namespaceOption = { label: wl.namespace, value: wl.namespace };

      if (!this.filterNamespaceOptions.some((opt) => opt.value === namespaceOption.value)) {
        this.filterNamespaceOptions.push(namespaceOption);
      }
    });

    this.filterTypeOptions.unshift({ label: this.t('imageScanner.imageDetails.severityFilterOptions.any'), value: 'any' });
    this.filterNamespaceOptions.unshift({ label: this.t('imageScanner.imageDetails.severityFilterOptions.any'), value: 'any' });
    this.updateFilteredImages();
  },

  watch: {
    // Watch for changes in vulnerability details and reset selection if needed
    workloads: {
      handler(newVal, oldVal) {
        // Update cached filtered results
        this.updateFilteredImages();
      },
      deep: true
    },
    // Watch for filter changes and update cache
    filters: {
      handler() {
        this.updateFilteredImages();
      },
      deep: true
    },
    // Watch for severity update when selecting it on Severity distribution bar chart
    severity: {
      handler() {
        this.filterBySeverity();
      },
      deep: true
    }
  },

  methods: {

    filterBySeverity() {
      this.filters.severity = this.severity;
    },

    updateFilteredImages() {

      let filtered = [...this.workloads];

      // CVE search filter
      if (this.filters.workloadSearch && this.filters.workloadSearch.trim()) {
        filtered = filtered.filter((v) => v.workloadName && v.workloadName.toLowerCase().includes(this.filters.workloadSearch.toLowerCase())
        );
      }

      // Type filter
      if (this.filters.type !== 'any') {
        filtered = filtered.filter((v) => v.type === this.filters.type);
      }

      // namespace filter
      if (this.filters.namespace !== 'any') {
        filtered = filtered.filter((v) => v.namespace === this.filters.namespace);
      }

      // severity filter
      if (this.filters.severity !== 'any') {
        filtered = filtered.filter((v) => {
          if (this.filters.severity === 'any') {
            return true;
          }
          let result = false;
          const severityLevels = ['critical', 'high', 'medium', 'low', 'unknown'];

          for (const level of severityLevels) {
            if (level === this.filters.severity.toLowerCase() && v.severity[level] > 0) {
              result = true;
              break;
            } else if (level !== this.filters.severity.toLowerCase() && v.severity[level] > 0) {
              break;
            }
          }

          return result;
        });
      }
console.log('Filtered workloads:', filtered); // Debug log to check filtered results
      this.cachedFilteredWorkloads = filtered;
    },
  },
};
</script>
<style lang="scss" scoped>
@import '../../styles/variables.scss';

.search-filters {
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  gap: 24px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 100px;
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
  background: transparent;
  line-height: 19px;
  color: var(--body-text);
}

.score-range-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-input {
  flex: 1;
  min-width: 60px;
  text-align: center;
}

.score-input::placeholder {
  color: #BEC1D2;
}

.score-separator {
  color: var(--disabled-text);
  font-weight: 500;
  font-size: 14px;
}

.score-filter-icon {
  color: #6C6C76;
  margin-left: 8px;
  font-size: 16px;
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
</style>