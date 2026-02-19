<template>
  <div
      ref="trigger"
      class="vulnerability-hover-cell"
      @mouseenter="checkPosition"
  >
    <div class="trigger-bar">
      <AmountBarBySeverity
          :cve-amount="cveAmount"
          :is-collapsed="true"
      />
    </div>

    <div
        class="hover-overlay"
        :class="{ 'show-top': showOnTop }"
    >
      <div class="popup-container">
        <div class="header">
          <div class="title">
            {{ headerTitle || `${totalVulnerabilities} ${t('imageScanner.images.listTable.filters.placeholder.affectedCVEs')}` }}
          </div>
          <RouterLink
              v-if="viewAllLink"
              :to="getViewAllLink()"
              class="view-all"
              @click.stop="$emit('view-all')"
          >
            {{ t('imageScanner.vulnerabilities.popup.viewAll') }}
          </RouterLink>
        </div>

        <div class="severity-list">
          <div v-for="severity in severities" :key="severity.key" class="severity-row">
            <div v-if="cveAmount[severity.key] === 0" class="label" style="text-decoration: none; color: var(--disabled-text);">
              {{ severity.label }}
            </div>
            <RouterLink
                v-else
                :to="getSeverityLink(severity.label)"
                class="label"
            >
              {{ severity.label }}
            </RouterLink>

            <div class="bar-container">
              <div
                  class="progress-bar"
                  :class="severity.key"
                  :style="{ width: getPercentage(severity.key) + '%' }"
              ></div>
            </div>

            <span class="count">{{ cveAmount[severity.key] || 0 }}</span>
          </div>
        </div>

        <div class="footer">
          Provided by 
          <a href="/" target="_blank" rel="noopener noreferrer" class="provider-name">
            {{ footerProvider }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AmountBarBySeverity from './AmountBarBySeverity.vue';

export default {
  name:       'AmountBarBySeverityPoppedDetail',
  components: { AmountBarBySeverity },
  props: {
    cveAmount: {
      type:     Object,
      required: true,
      default:  () => ({
        critical: 0, high: 0, medium: 0, low: 0, unknown: 0
      })
    },
    headerTitle: {
      type:    String,
      default: ''
    },
    viewAllLink: {
      type:    String,
      default: ''
    },
    footerProvider: {
      type:    String,
      default: 'SBOMScanner'
    },
  },
  data() {
    return {
      showOnTop:  false,
      severities: [
        { key: 'critical', label: 'Critical' },
        { key: 'high', label: 'High' },
        { key: 'medium', label: 'Medium' },
        { key: 'low', label: 'Low' },
        { key: 'unknown', label: 'None' }
      ]
    };
  },
  computed: {
    totalVulnerabilities() {
      return Object.values(this.cveAmount).reduce((a, b) => a + (Number(b) || 0), 0);
    },
  },
  methods: {
    checkPosition() {
      if (!this.$refs.trigger) return;
      const trigger = this.$refs.trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      this.showOnTop = (viewportHeight - trigger.bottom < 300);
    },
    getPercentage(key) {
      const count = this.cveAmount[key] || 0;

      if (this.totalVulnerabilities === 0) return 0;

      return (count / this.totalVulnerabilities) * 100;
    },
    getViewAllLink() {
      if (!this.viewAllLink) return '';
      const [path, hash] = this.viewAllLink.split('#');

      return {
        path,
        hash:  hash ? `#${hash}` : undefined,
        query: { defaultTab: 'affectingCVEs' }
      };
    },
    getSeverityLink(severityLabel) {
      if (!this.viewAllLink) return '';

      // Split path and hash from viewAllLink
      const [path, hash] = this.viewAllLink.split('#');

      return {
        path,
        hash:  hash ? `#${hash}` : undefined,
        query: { defaultTab: 'affectingCVEs', severity: severityLabel }
      };
    }
  }
};
</script>

<style lang="scss" scoped>
@import '../../styles/_variables.scss';

$gap-size: 10px;

.vulnerability-hover-cell {

  --severity-critical: #{$critical-color};
  --severity-high: #{$high-color};
  --severity-medium: #{$medium-color};
  --severity-low: #{$low-color};
  --severity-unknown: #{$na-color};

  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;

  &:hover .hover-overlay {
    display: block;
    visibility: visible;
    opacity: 1;
  }

  &:hover .trigger-bar {
    border-color: var(--border);
  }
}

.trigger-bar {
  width: 100%;
  padding: 4px;
  border: 1px solid transparent;
  border-radius: 12px;
  transition: border-color 0.2s;
}

.hover-overlay {
  display: none;
  position: absolute;
  top: calc(100% + #{$gap-size});
  right: 10px;
  z-index: 20;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
    height: $gap-size;
    top: -$gap-size;
    background: transparent;
  }

  &.show-top {
    top: auto;
    bottom: calc(100% + #{$gap-size});

    &::before {
      top: auto;
      bottom: -$gap-size;
    }
  }
}

.popup-container {
  width: 320px;
  background: var(--popover-bg);
  border-radius: 6px;
  border: 1px solid var(--popover-border);
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.04);
  padding: 16px;
  z-index: 100;
  font-family: Lato, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .title {
    font-weight: 600;
    font-size: 16px;
    line-height: 24px;
  }

  .view-all {
    font-size: 14px;
    text-decoration: none;
    cursor: pointer;
    &:hover { text-decoration: underline; }
  }
}

.severity-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.severity-row {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 400;
  line-height: 20px;

  .label {
    width: 80px;
    font-size: 14px;
    line-height: 21px;
    text-decoration: underline;
    color: var(--default-text);

    &.disabled-link {
      pointer-events: none;
      text-decoration: none;
      color: var(--label-secondary);
    }
  }

  .bar-container {
    flex-grow: 1;
    height: 8px;
    background-color: var(--disabled-bg);
    border-radius: 4px;
    margin: 0 12px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .count {
    width: 35px;
    text-align: right;
    color: var(--label-secondary);
  }
}

.footer {
  margin-top: 12px;
  text-align: right;
  font-size: 14px;
  line-height: 140%;
  color: var(--label-secondary);

  .provider-name {
    color: var(--label-secondary);
    text-decoration: underline;
  }
}

.critical { background-color: $critical-color; }
.high     { background-color: $high-color; }
.medium   { background-color: $medium-color; }
.low      { background-color: $low-color; }
.unknown  { background-color: $na-color; }

</style>