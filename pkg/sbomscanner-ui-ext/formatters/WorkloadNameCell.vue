<template>
    <div class="workload-name-cell">
        <router-link :to="value">{{ value }}</router-link>
    </div>
</template>
<script>
export default {
  name:  'WorkloadNameCell',
  props: {
    value: {
      type:     String,
      required: true
    }
  },
};
</script>