<template>
  <div style="margin-right: 32px;">
    <AmountBarBySeverityPoppedDetail
        :cve-amount="value.cveAmount"
        :viewAllLink="value.link"
    />
  </div>
</template>
<script>
import AmountBarBySeverityPoppedDetail from '@sbomscanner-ui-ext/components/common/AmountBarBySeverityPoppedDetail.vue';
export default {
  props: {
    /**
     * The data object for the cell, typically passed by the table formatter.
     * * @property {Object} cveAmount - Object containing vulnerability counts by severity.
     * @property {number} cveAmount.critical - Count of critical vulnerabilities.
     * @property {number} cveAmount.high - Count of high vulnerabilities.
     * @property {number} cveAmount.medium - Count of medium vulnerabilities.
     * @property {number} cveAmount.low - Count of low vulnerabilities.
     * @property {number} cveAmount.unknown - Count of unknown vulnerabilities.
     * @property {string} link - The target URL for the "View All" link in the popup (e.g., "#affectingCVEs").
     * * @example
     * {
     * cveAmount: { critical: 5, high: 2, medium: 0, low: 1, unknown: 0 },
     * link: "/c/local/explorer/apps.deployment/default/my-app#vulnerabilities"
     * }
     */
    value: {
      type:     Object,
      required: true,
      default: () => ({
        cveAmount: {},
        link: ''
      })
    }
  },
  components: { AmountBarBySeverityPoppedDetail },
};
</script>