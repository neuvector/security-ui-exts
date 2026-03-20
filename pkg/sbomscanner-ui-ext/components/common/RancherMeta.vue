<template>
  <div :class="isGrid ? 'rancher-meta' : ''">
    <RancherMetaProperty
      v-for="(property, index) in properties"
      :key="index"
      :property="property"
    />
  </div>
</template>

<script>
import RancherMetaProperty from './RancherMetaProperty.vue';

export default {
  name:       'RancherMeta',
  components: { RancherMetaProperty },
  props:      {
    properties: {
      type:    Array,
      default: () => []
    },
    isGrid: {
      type:    Boolean,
      default: () => {
        return true;
      },
    }
  },
};
</script>

<style lang="scss" scoped>
  .rancher-meta {
    column-count: 3;
    column-gap: 24px;
    align-self: stretch;
    > * {
      display: inline-block;
      width: 100%;
      margin-bottom: 4px;
      break-inside: avoid;
      min-width: 0;
      word-break: break-word;
    }
  }
</style>
