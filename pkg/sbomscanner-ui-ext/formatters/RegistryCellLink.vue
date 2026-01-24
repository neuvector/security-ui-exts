<script>
import {
  PRODUCT_NAME,
  PAGE,
  RESOURCE
} from '@sbomscanner-ui-ext/types';
export default {
  name:  'RegistryCellLink',
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
          id:        this.value,
        }
      };
    }
  }
};
</script>

<template>
  <RouterLink :to="registryDetailLink">
    {{ `${row.metadata.namespace}/${value}` }}
  </RouterLink>
</template>
