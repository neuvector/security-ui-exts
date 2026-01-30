<script>
import RegistryDetails from '@sbomscanner-ui-ext/components/RegistryDetails.vue';

export default {
  name:  'CruRegistry',
  props: {
    value: {
      type:     Object,
      required: true
    }
  },
  data() {
    return {};
  },
  components: { RegistryDetails },
};
</script>

<template>
    <RegistryDetails/>
</template>
