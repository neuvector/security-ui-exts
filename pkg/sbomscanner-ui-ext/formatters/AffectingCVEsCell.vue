<template>
    <div class="workload-affecting-cves-cell">
        <router-link :to="affectingCVEsLink">{{ affectingCVEs }}</router-link>
    </div>
</template>
<script>
import { getWorkloadLink } from '@sbomscanner-ui-ext/utils/app';
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
    },
    affectingCVEsLink() {
      return getWorkloadLink(this.row, this.$route.params.cluster, 'vulnerabilities');
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