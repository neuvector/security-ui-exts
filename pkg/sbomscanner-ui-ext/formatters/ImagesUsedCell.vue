<template>
  <div class="images-used-cell">
    <router-link :to="imagesUsedLink">{{ imagesUsed }}</router-link>
  </div>
</template>
<script>
import { getWorkloadLink } from '@sbomscanner-ui-ext/utils/app';
export default {
  name: 'ImagesUsedCell',
  props: {
    row: {
      type:     Object,
      required: true
    }
  },
  computed: {
    imagesUsed() {
      return this.row.imagesUsed || 0;
    },
    imagesUsedLink() {
      return getWorkloadLink(this.row, this.$route.params.cluster, 'vulnerabilities', 'defaultTab=imagesUsed');
    }
  }
};
</script>
<style scoped>
.images-used-cell {
  text-align: left;
  text-decoration: underline;
  >a {
    color: var(--text-color);
  }
}
</style>