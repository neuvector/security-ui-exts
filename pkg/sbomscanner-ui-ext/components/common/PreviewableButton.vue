<template>
    <div ref="element">
        <button ref="button" class="vendor-tag" test-id="previewable-button" @click="openPreview">
            <div>{{ props.repository.name }}</div>
            <div v-if="props.repository.matchConditions" class="icon-filter"></div>
        </button>
        <Preview
            v-if="showPreview"
            :id="previewId"
            class="preview"
            :value="yamlValue"
            :anchor-element="element"
            aria-live="polite"
            @close="onClose"
        />
    </div>
</template>

<script setup lang="ts">
import Preview from '@sbomscanner-ui-ext/components/rancher-rewritten/shell/components/Preview.vue';
import { nextTick, ref, computed } from 'vue';
import { randomStr } from '@shell/utils/string';
import { Type } from '@components/Pill/types';
import * as jsyaml from 'js-yaml';

export interface KeyValueRowProps {
    repository: any;
    type: Type;
}

const props = defineProps<KeyValueRowProps>();
const showPreview = ref(false);
const element = ref<HTMLDivElement | null>(null);
const button = ref<HTMLButtonElement | null>(null);

const yamlValue = computed(() => {
  if (!props.repository) return '';
  try {
    return jsyaml.dump(props.repository);
  } catch (e) {
    return '';
  }
});

const openPreview = () => {
  if (props.repository.matchConditions) {
    showPreview.value = true;
  }
};

const onClose = (keyboardExit: boolean) => {
  showPreview.value = false;
  if (keyboardExit) {
    nextTick(() => {
      button.value?.focus();
    });
  }
};
const previewId = randomStr();
</script>

<style lang="scss" scoped>

.vendor-tag {
  display: flex;
  margin-right: 5px;
  padding: 1px 6px;
  background-color: transparent;
  border: solid var(--border-width) var(--input-border);
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  height: 24px;
  min-height: auto;
  align-items: center;
}

.icon-filter {
  width: 12px;
  height: 12px;
  margin-top: 2px;
  margin-left: 8px;
  background: url('../../assets/img/filter.svg') no-repeat center center;
  background-size: contain;
}

.vendor-tag:hover, .vendor-tag.active {
  background-color: #d1d3e0;
}
</style>
