<template>
  <div style="margin-right: 32px;">
    <AmountBarBySeverity
      :cve-amount="value"
      :is-collapsed="true"
    />
  </div>
</template>
<script>
import AmountBarBySeverity from '@sbomscanner-ui-ext/components/common/AmountBarBySeverity';
export default {
  props: {
    value: {
      type:     Object,
      required: true
    }
  },
  components: { AmountBarBySeverity },
};
</script>
