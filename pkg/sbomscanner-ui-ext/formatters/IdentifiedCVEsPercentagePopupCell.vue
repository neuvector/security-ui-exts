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