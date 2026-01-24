<template>
  <RouterLink :to="registryDetailLink">
    {{ row.metadata.name }}
  </RouterLink>
</template>
<script>
import {
  PRODUCT_NAME,
  PAGE,
  RESOURCE
} from '@sbomscanner-ui-ext/types';
export default {
  props: {
    row: {
      type:     Object,
      required: true
    }
  },
  data() {
    return {
      PRODUCT_NAME,
      PAGE,
      RESOURCE,
    };
  },
  computed: {
    registryDetailLink() {
      return {
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          cluster:   this.$route.params.cluster,
          product:   PRODUCT_NAME,
          resource:  RESOURCE.REGISTRY,
          namespace: this.row.metadata.namespace,
          id:        this.row.metadata.name,
        }
      };
    }
  }
};
</script>
