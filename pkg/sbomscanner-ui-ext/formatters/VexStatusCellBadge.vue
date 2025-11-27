<script>
import VexStatusBadge from '@sbomscanner-ui-ext/components/common/VexStatusBadge.vue';
export default {
  components: { VexStatusBadge },
  props:      {
    value: {
      type:     Boolean,
      required: true
    },
  },
};
</script>

<template>
  <VexStatusBadge :enabled="value" />
</template>
