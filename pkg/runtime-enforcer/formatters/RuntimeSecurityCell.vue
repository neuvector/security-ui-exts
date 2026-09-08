<template>
  <span v-if="!isProtected" class="unprotected-text">
    {{ t('runtimeEnforcer.activePolicies.mode.unprotected') }}
  </span>
  <div
      v-else
      ref="cellRoot"
      class="runtime-security-cell"
      @mouseenter="onCellMouseEnter"
      @mouseleave="onCellMouseLeave"
  >
    <div class="cell-content">
      <img
          v-if="modeIconSrc"
          :src="modeIconSrc"
          width="16"
          height="16"
          class="mode-icon"
          alt=""
      />
      <i
          v-else-if="modeIconClass"
          :class="`icon ${modeIconClass} mode-icon`"
      />
      <span class="mode-text" :class="mode">{{ modeLabel }}</span>
      <span class="counts-text">{{ violationCountsFormatted }}</span>
    </div>

    <div
        v-show="isPopoverVisible"
        class="message-hover-overlay"
        :class="{ 'show-top': showOnTop, 'align-right': showOnRight }"
        @mouseenter="onPopoverMouseEnter"
        @mouseleave="onPopoverMouseLeave"
    >
      <div class="popover-title">
        {{ t('runtimeEnforcer.tableColumns.runtimeSecurity.popover.title') }}
      </div>

      <div class="popover-grid">
        <div class="grid-row">
          <span class="row-label">{{ t('runtimeEnforcer.tableColumns.runtimeSecurity.popover.activePolicy') }}</span>
          <router-link :to="policyDetailLocation" class="text-link row-value">
            {{ policyName }}
          </router-link>
        </div>

        <div class="grid-row">
          <span class="row-label">{{ t('runtimeEnforcer.tableColumns.runtimeSecurity.popover.protectionMode') }}</span>
          <div class="row-value mode-row">
            <img
                v-if="modeIconSrc"
                :src="modeIconSrc"
                width="14"
                height="14"
                class="mode-icon"
                alt=""
            />
            <span class="mode-text" :class="mode">{{ modeLabel }}</span>
          </div>
        </div>

        <div class="grid-row">
          <span class="row-label">{{ t('runtimeEnforcer.tableColumns.runtimeSecurity.popover.runtimeViolations') }}</span>
          <router-link :to="deploymentViolationsLocation" class="text-link row-value underline-link">
            {{ violationsSummaryText }}
          </router-link>
        </div>

        <div class="grid-row">
          <span class="row-label">{{ t('runtimeEnforcer.tableColumns.runtimeSecurity.popover.lastOccurrence') }}</span>
          <span class="row-value regular-text">{{ lastOccurrenceText }}</span>
        </div>
      </div>

      <div class="popover-footer">
        <span>{{ t('runtimeEnforcer.tableColumns.runtimeSecurity.popover.providedBy') }}&nbsp;</span>
        <a
            :href="quickstartDocsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
        >
          {{ t('runtimeEnforcer.tableColumns.runtimeSecurity.popover.runtimeEnforcer') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { RESOURCE, PRODUCT_NAME, POLICY_MODE } from '../types/runtime-enforcer';
import { findBoundPolicy } from '../utils/workload-policy';
import day from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

day.extend(relativeTime);
day.extend(utc);

const QUICKSTART_DOCS_URL = 'https://rancher.github.io/runtime-enforcer-product-docs/runtime-enforcer/latest/en/installation/quickstart.html';

export default {
  name: 'RuntimeSecurityCell',
  props: {
    value: {
      type:    String,
      default: '',
    },
    row: {
      type:    Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      protectIconSrc:    null,
      monitorIconSrc:    null,
      showOnTop:         false,
      showOnRight:       false,
      isPopoverVisible:  false,
      hideTimeout:       null,
      quickstartDocsUrl: QUICKSTART_DOCS_URL,
    };
  },
  created() {
    try {
      this.protectIconSrc = require('@runtime-enforcer/assets/img/protect.svg');
      this.monitorIconSrc = require('@runtime-enforcer/assets/img/monitor.svg');
    } catch {
      this.protectIconSrc = null;
      this.monitorIconSrc = null;
    }
  },
  beforeUnmount() {
    this.clearHideTimer();
  },
  async fetch() {
    const existing = this.$store.getters['cluster/all']?.(RESOURCE.ACTIVE_POLICIES);
    if (!existing || !existing.length) {
      try {
        await this.$store.dispatch('cluster/findAll', { type: RESOURCE.ACTIVE_POLICIES });
      } catch {
        // Continue if policies cannot be loaded
      }
    }
  },
  computed: {
    cluster() {
      return this.$route.params.cluster || this.$store.getters['currentCluster']?.id || 'local';
    },
    boundPolicy() {
      const allPolicies = this.$store.getters['cluster/all']?.(RESOURCE.ACTIVE_POLICIES) || [];
      return findBoundPolicy(this.row, allPolicies);
    },
    isProtected() {
      return !!this.boundPolicy;
    },
    policyName() {
      return this.boundPolicy?.metadata?.name || '';
    },
    namespace() {
      return this.row?.metadata?.namespace || this.boundPolicy?.metadata?.namespace || '';
    },
    mode() {
      return this.boundPolicy?.spec?.mode?.toLowerCase() || '';
    },
    modeLabel() {
      if (this.mode === POLICY_MODE.PROTECT) {
        return this.t('runtimeEnforcer.activePolicies.mode.protect');
      }
      if (this.mode === POLICY_MODE.MONITOR) {
        return this.t('runtimeEnforcer.activePolicies.mode.monitor');
      }
      return this.mode || '';
    },
    modeIconSrc() {
      if (this.mode === POLICY_MODE.PROTECT) {
        return this.protectIconSrc;
      }
      if (this.mode === POLICY_MODE.MONITOR) {
        return this.monitorIconSrc;
      }
      return null;
    },
    modeIconClass() {
      if (this.mode === POLICY_MODE.PROTECT) {
        return 'icon-shield';
      }
      if (this.mode === POLICY_MODE.MONITOR) {
        return 'icon-search';
      }
      return '';
    },
    activeViolationCount() {
      return this.boundPolicy?.status?.activeViolationCount ?? 0;
    },
    totalViolationCount() {
      return this.boundPolicy?.status?.violationCount ?? 0;
    },
    violationCountsFormatted() {
      return `(${ this.activeViolationCount } | ${ this.totalViolationCount })`;
    },
    violationsSummaryText() {
      const activeLabel = this.t('runtimeEnforcer.tableColumns.runtimeSecurity.popover.active');
      const occurrencesLabel = this.t('runtimeEnforcer.tableColumns.runtimeSecurity.popover.occurrences');
      return `${ this.activeViolationCount } ${ activeLabel } | ${ this.totalViolationCount } ${ occurrencesLabel }`;
    },
    lastOccurrenceText() {
      const violations = this.boundPolicy?.status?.violations || [];
      if (!violations.length) {
        return '-';
      }

      let latest = 0;
      violations.forEach((v) => {
        const ts = v?.lastObservedTimestamp ? new Date(v.lastObservedTimestamp).getTime() : 0;
        if (ts > latest) {
          latest = ts;
        }
      });

      if (!latest) {
        return '-';
      }

      return day(latest).fromNow();
    },
    policyDetailLocation() {
      return {
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          cluster:   this.cluster,
          product:   PRODUCT_NAME,
          resource:  RESOURCE.ACTIVE_POLICIES,
          namespace: this.namespace,
          id:        this.policyName,
        },
      };
    },
    deploymentViolationsLocation() {
      return {
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          cluster:   this.cluster,
          product:   'explorer',
          resource:  'apps.deployment',
          namespace: this.namespace,
          id:        this.row?.metadata?.name || '',
        },
        hash: '#runtime-violations',
      };
    },
  },
  methods: {
    clearHideTimer() {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    },
    startHideTimer() {
      this.clearHideTimer();
      this.hideTimeout = setTimeout(() => {
        this.isPopoverVisible = false;
      }, 250);
    },
    checkPosition() {
      if (!this.$refs.cellRoot) {
        return;
      }
      const trigger = this.$refs.cellRoot.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Flip above if cell is within bottom 260px of the viewport
      this.showOnTop = (viewportHeight - trigger.bottom < 260);

      // Flip to align with right edge of cell if less than 410px space to viewport edge
      this.showOnRight = (viewportWidth - trigger.left < 410);
    },
    onCellMouseEnter() {
      this.clearHideTimer();
      this.checkPosition();
      this.isPopoverVisible = true;
    },
    onCellMouseLeave() {
      this.startHideTimer();
    },
    onPopoverMouseEnter() {
      this.clearHideTimer();
      this.isPopoverVisible = true;
    },
    onPopoverMouseLeave() {
      this.startHideTimer();
    },
  },
};
</script>

<style lang="scss" scoped>
.unprotected-text {
  color: var(--body-text, #141419);
  font-size: 14px;
  line-height: 140%;
  font-family: Lato, sans-serif;
}

.runtime-security-cell {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 4px 0;
}

.cell-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.mode-icon {
  display: inline-flex;
  vertical-align: middle;
}

.mode-text {
  font-family: Lato, sans-serif;
  font-size: 14px;
  line-height: 140%;
  font-weight: 500;

  &.protect {
    color: #007032;
  }
  &.monitor {
    color: #1f67db;
  }
}

.counts-text {
  font-family: Lato, sans-serif;
  font-size: 14px;
  line-height: 140%;
  color: #6c6c76;
}

.message-hover-overlay {
  position: absolute;
  top: 100%;
  left: 0;
  right: auto;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: max-content;
  min-width: 320px;
  max-width: min(396px, 90vw);
  padding: 16px;
  background: var(--popover-bg, #ffffff);
  border: 1px solid var(--popover-border, #dcdee4);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  font-family: Lato, sans-serif;
  color: var(--body-text, #141419);
  pointer-events: auto;

  /* Invisible hover bridge spanning between the trigger and the card */
  &::before {
    content: '';
    position: absolute;
    top: -12px;
    left: 0;
    right: 0;
    height: 12px;
  }

  &.show-top {
    top: auto;
    bottom: 100%;

    &::before {
      top: auto;
      bottom: -12px;
      height: 12px;
    }
  }

  &.align-right {
    left: auto;
    right: 0;
  }
}

.popover-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
  color: var(--body-text, #141419);
  margin-bottom: 12px;
}

.popover-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.grid-row {
  display: grid;
  grid-template-columns: 130px 1fr;
  align-items: center;
  column-gap: 16px;
  font-size: 14px;
  line-height: 21px;

  .row-label {
    color: var(--text-muted, #6c6c76);
    font-weight: 400;
    white-space: nowrap;
  }

  .row-value {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .regular-text {
    color: var(--body-text, #141419);
    font-weight: 400;
  }
}

.mode-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .mode-icon {
    display: inline-flex;
  }
}

.text-link {
  color: var(--link, #3d98d3);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  &.underline-link {
    text-decoration: underline;
  }
}

.popover-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 14px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text-muted, #6c6c76);

  .footer-link {
    color: var(--text-muted, #6c6c76);
    text-decoration: underline;

    &:hover {
      color: var(--link, #3d98d3);
    }
  }
}
</style>