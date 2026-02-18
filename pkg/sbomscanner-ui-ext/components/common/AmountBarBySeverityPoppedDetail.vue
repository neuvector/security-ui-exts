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
      <div class="header">
        <div class="title">
          {{ headerTitle || `${totalVulnerabilities} ${t('imageScanner.images.listTable.headers.vulnerabilities')}` }}
        </div>
        <a
            v-if="viewAllLink"
            :href="viewAllLink"
            class="view-all"
            @click.stop="$emit('view-all')"
        >
          {{ t('imageScanner.vulnerabilities.popup.viewAll') }}
        </a>
      </div>

      <div class="severity-list">
        <div v-for="severity in severities" :key="severity.key" class="severity-row">
          <RouterLink
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
        Provided by <span class="provider-name">{{ footerProvider }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { RouterLink } from 'vue-router';
import AmountBarBySeverity from './AmountBarBySeverity.vue';

export default {
  name: 'AmountBarBySeverityPoppedDetail',
  components: { AmountBarBySeverity },
  props: {
    cveAmount: {
      type: Object,
      required: true,
      default: () => ({ critical: 0, high: 0, medium: 0, low: 0, unknown: 0 })
    },
    headerTitle: {
      type: String,
      default: ''
    },
    viewAllLink: {
      type: String,
      default: ''
    },
    footerProvider: {
      type: String,
      default: 'SBOMScanner'
    },
  },
  data() {
    return {
      showOnTop: false,
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
    getSeverityLink(severityLabel) {
      if (!this.viewAllLink) return '';
      
      // Split path and hash from viewAllLink
      const [path, hash] = this.viewAllLink.split('#');
      
      return {
        path,
        hash: hash ? `#${hash}` : undefined,
        query: { severity: severityLabel }
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
  width: 320px;
  background: var(--popover-bg);
  border: var(--popover-border);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 100;
  font-family: Lato, sans-serif;
  color: var(--text-primary);

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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .title {
    font-weight: 700;
    font-size: 16px;
    color: var(--text-primary);
  }

  .view-all {
    font-size: 14px;
    text-decoration: none;
    cursor: pointer;
    &:hover { text-decoration: underline; }
  }
}

.severity-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;

  .label {
    width: 60px;
    text-decoration: underline;
    text-decoration-color: var(--border);
    text-underline-offset: 3px;
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
    width: 30px;
    text-align: right;
    font-weight: 600;
    color: var(--text-secondary);
  }
}

.footer {
  margin-top: 12px;
  text-align: right;
  font-size: 12px;
  color: var(--text-secondary);

  .provider-name {
    text-decoration: underline;
    color: var(--text-secondary);
  }
}

.critical { background-color: $critical-color; }
.high     { background-color: $high-color; }
.medium   { background-color: $medium-color; }
.low      { background-color: $low-color; }
.unknown  { background-color: $na-color; }

</style>