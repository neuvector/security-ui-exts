<template>
  <div
    class="badge"
    :class="computedSeverity"
  >
    <div
      class="text"
    >
      {{ score || 'n/a' }} {{ scoreType ? `(${scoreType})` : '' }}
    </div>
  </div>
</template>

<script>
import { SEVERITY } from '@sbomscanner-ui-ext/types/image';
export default {
  name:  'ScoreBadge',
  props: {
    score: {
      type:    String,
      default: ''
    },
    scoreType: {
      type:    String,
      default: ''
    },
    severity: {
      type:    String,
      default: ''
    }
  },
  computed: {
    computedSeverity() {
      if (!this.severity) {
        return 'na';
      }

      if (this.severity.toLowerCase() === SEVERITY.CRITICAL) {
        return SEVERITY.CRITICAL;
      } else if (this.severity.toLowerCase() === SEVERITY.HIGH) {
        return SEVERITY.HIGH;
      } else if (this.severity.toLowerCase() === SEVERITY.MEDIUM) {
        return SEVERITY.MEDIUM;
      } else if (this.severity.toLowerCase() === SEVERITY.LOW) {
        return SEVERITY.LOW;
      } else {
        return 'na';
      }
    }
  }
};
</script>

<style lang="scss" scoped>
  @import '../../styles/_variables.scss';

  .badge {
    /* layout */
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1 0 0;
    align-self: stretch;
    /* style */
    border-radius: 4px;
    width: 120px;

    &.critical {
      background: $critical-color;
      color: rgba(255, 255, 255, 0.90);
    }

    &.high {
      background: $high-color;
      color: rgba(255, 255, 255, 0.90);
    }

    &.medium {
      background: $medium-color;
      color: rgba(255, 255, 255, 0.90);
    }

    &.low {
      background: $low-color;
      color: $low-na-text;
    }

    &.na{
      background: $na-color;
      color: $low-na-text;
    }

    .text {
      font-family: Lato;
      font-size: 13px;
      font-style: normal;
      font-weight: 400;
      line-height: 24px; /* 153.846% */
      &.na {
        color: #717179;
      }
    }
  }
</style>
