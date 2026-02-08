<template>
  <div class="images-used-cell">
    <router-link :to="row.workloadName">{{ imagesUsed }}</router-link>
  </div>
</template>
<script>
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