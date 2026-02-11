<template>
    <div class="workload-name-cell">
        <router-link :to="workloadLink">{{ value }}</router-link>
    </div>
</template>
<script>
import { getWorkloadLink } from '@sbomscanner-ui-ext/utils/app';
export default {
  name:  'WorkloadNameCell',
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
  computed: {
    workloadLink() {
      return getWorkloadLink(this.row, this.$route.params.cluster);
    }
  }
};
</script>