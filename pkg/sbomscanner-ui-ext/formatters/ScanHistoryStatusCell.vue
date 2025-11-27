<script>
import StatusBadge from '@sbomscanner-ui-ext/components/common/StatusBadge';
export default {
  components: { StatusBadge },
  props:      {
    value: {
      type:     String,
      required: true
    }
  },
};
</script>

<template>
  <StatusBadge :status="value.toLowerCase()" />
</template>
