<script>
import Loading from '@shell/components/Loading.vue';
import { PRODUCT_NAME, RESOURCE } from '@sbomscanner-ui-ext/types';

export default {
  name: 'ListWorkloadScanConfiguration',

  components: {
    Loading
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    // Fetch all instances (should only ever be 0 or 1 because it's a singleton)
    const configs = await this.$store.dispatch(`${inStore}/findAll`, {
      type: RESOURCE.WORKLOAD_SCAN_CONFIGURATION
    });

    if (configs && configs.length > 0) {
      // The 'default' configuration exists. Redirect directly to the Edit page.
      this.$router.replace({
        name: 'c-cluster-product-resource-id',
        params: {
          cluster:  this.$route.params.cluster,
          product:  PRODUCT_NAME,
          resource: RESOURCE.WORKLOAD_SCAN_CONFIGURATION,
          id:       'default' // Target the singleton
        },
        query: { mode: 'edit' }
      });
    } else {
      // The configuration does not exist yet. Redirect to the Create page.
      this.$router.replace({
        name: 'c-cluster-product-resource-create',
        params: {
          cluster:  this.$route.params.cluster,
          product:  PRODUCT_NAME,
          resource: RESOURCE.WORKLOAD_SCAN_CONFIGURATION
        }
      });
    }
  }
};
</script>

<template>
  <Loading />
</template>