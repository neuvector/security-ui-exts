<script>
import RegisterStatusBadge from '@pkg/components/common/RegisterStatusBadge';
export default {
  components: { RegisterStatusBadge },
  props:      {
    value: {
      type:     String,
      required: true
    },
  },
};
</script>

<template>
  <RegisterStatusBadge :status="value.toLowerCase()" />
</template>
