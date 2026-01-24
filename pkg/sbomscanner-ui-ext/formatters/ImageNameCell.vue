<template>
  <RouterLink :to="imageDetailLink">
    {{ displayName }}
  </RouterLink>
</template>
<script>
import {
  PRODUCT_NAME,
  PAGE,
  RESOURCE,
} from '@sbomscanner-ui-ext/types';
import { constructImageName } from '@sbomscanner-ui-ext/utils/image';
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
    displayName() {
      return this.row.imageReference ? this.row.imageReference : constructImageName(this.row.imageMetadata);
    },
    imageDetailLink() {
      return {
        name:   `c-cluster-${PRODUCT_NAME}-${PAGE.IMAGES}-id`,
        params: {
          cluster: this.$route.params.cluster,
          id:      this.row.metadata.name,
        }
      };
    }
  }
};
</script>
