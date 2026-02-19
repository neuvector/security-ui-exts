<template>
  <div class="image-in-use-popup-cell">
    <ImageInUsePoppedDetail
        :count="value"
        :link="workloadTabLink"
    />
  </div>
</template>

<script>
import ImageInUsePoppedDetail from '@sbomscanner-ui-ext/components/common/ImageInUsePoppedDetail.vue';
import { PRODUCT_NAME, RESOURCE, PAGE } from '@sbomscanner-ui-ext/types';

export default {
  name: 'ImageInUsePopupCell',
  components: { ImageInUsePoppedDetail },
  props: {
    value: {
      type:    Number,
      default: 0
    },
    row: {
      type:     Object,
      required: true
    }
  },
  computed: {
    workloadTabLink() {
      // Safely grab the cluster ID from the current route, fallback to local
      const clusterId = this.$route?.params?.cluster || this.$store.getters['currentCluster']?.id || 'local';
      const imageId = this.row?.metadata?.name || '';

      return {
        name:   `c-cluster-${PRODUCT_NAME}-${PAGE.IMAGES}-id`,
        params: {
          cluster: clusterId,
          id:      imageId
        },
        hash: '#workloads'
      };
    }
  }
};
</script>

<style scoped>
.image-in-use-popup-cell {
  display: flex;
  align-items: center;
  height: 100%;
}
</style>