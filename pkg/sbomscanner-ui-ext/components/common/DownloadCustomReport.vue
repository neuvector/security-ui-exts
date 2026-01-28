<template>
  <button
    class="btn role-primary btn-text-report"
    :disabled="!(selectedRows && selectedRows.length)"
    @click="downloadFn()"
  >
    <i class="icon icon-download"></i>
    {{ buttonName }}
  </button>
</template>

<script>

export default {
  name:  'ScanButton',
  props: {
    selectedRows: {
      type:    Array,
      default: () => []
    },
    buttonName: {
      type:    String,
      default: ''
    },
    downloadFn: {
      type:    Function,
      default: null
    }
  },
  methods: {},
};
</script>

<style lang="scss" scoped>
.btn-text-report {
  font-size: 16px;
  padding: 0 16px;
}

.me-3 {
  margin-right: 12px;
}
</style>

