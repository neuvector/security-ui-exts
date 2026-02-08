<template>
    <div class="workload-affecting-cves-cell">
        <router-link :to="row.workloadName">{{ affectingCVEs }}</router-link>
    </div>
</template>
<script>
export default {
  name:  'AffectingCVEsCell',
  props: {
    row: {
      type:     Object,
      required: true
    }
  },
  computed: {
    affectingCVEs() {
      return this.row.affectingCVEs || 0;
    }
  }
};
</script>
<style scoped>
.workload-affecting-cves-cell {
  text-align: left;
  text-decoration: underline;
  >a {
    color: var(--text-color);
  }
}
</style>