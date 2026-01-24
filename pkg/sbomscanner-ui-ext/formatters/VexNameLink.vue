<script>
import {
  PRODUCT_NAME,
  RESOURCE,
  PAGE,
} from '@sbomscanner-ui-ext/types';
export default {
  name:  'VexNameLink',
  props: {
    value: {
      type:     String,
      required: true
    },
    row: {
      type:     Object,
      required: true
    }
  },
  data() {
    return {
      PRODUCT_NAME,
      RESOURCE,
      PAGE,
    };
  },
  computed: {
    vexDetailLink() {
      return {
        name:   'c-cluster-product-resource-id',
        params: {
          cluster:  this.$route.params.cluster,
          product:  PRODUCT_NAME,
          resource: RESOURCE.VEX_HUB,
          id:       this.value,
        }
      };
    }
  }
};
</script>

<template>
  <RouterLink :to="vexDetailLink">
    {{ value }}
  </RouterLink>
</template>
