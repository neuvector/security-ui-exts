<template>
  <div class="workload-severity-cell">
    <span>{{ workloadSeverity }}</span>
  </div>
</template>
<script>
export default {
  name: 'WorkloadSeverityCell',
  props: {
    workloadSeverity: {
      type: String,
      required: true
    }
  }
};
</script>
<style scoped>
.workload-severity-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  background-color: var(--input-bg);
}
</style>