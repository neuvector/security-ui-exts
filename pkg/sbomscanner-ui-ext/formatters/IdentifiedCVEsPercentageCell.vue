<template>
  <div style="margin-right: 32px;">
    <VulnerabilityHoverCell
        :cve-amount="value.cveAmount"
        :header-title="`${value.total} ${t('imageScanner.images.listTable.headers.vulnerabilities')}`"
        :view-all-link="value.link"
    />
  </div>
</template>
<script>
import VulnerabilityHoverCell from "@sbomscanner-ui-ext/components/common/VulnerabilityHoverCell.vue";
export default {
  props: {
    value: {
      type:     Object,
      required: true,
      default: () => ({
        cveAmount: {},
        total: 0,
        link: ''
      })
    }
  },
  components: {VulnerabilityHoverCell },
};
</script>
