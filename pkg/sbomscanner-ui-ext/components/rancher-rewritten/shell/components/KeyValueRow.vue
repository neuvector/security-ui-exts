<script setup lang="ts">
import CopyToClipboard from '@shell/components/Resource/Detail/CopyToClipboard.vue';
import { Row } from '@shell/components/Resource/Detail/Metadata/KeyValue.vue';
import Preview from './Preview.vue';
import { nextTick, ref } from 'vue';
import RcTag from '@components/Pill/RcTag/RcTag.vue';
import RcButton from '@components/RcButton/RcButton.vue';
// import { Type } from '@components/Pill/types';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { randomStr } from '@shell/utils/string';

export interface KeyValueRowProps {
    row: Row;
    type: Type;
}

export type Type = 'active' | 'inactive';

const props = defineProps<KeyValueRowProps>();

const store = useStore();
const i18n = useI18n(store);

const showPreview = ref(false);
const element = ref<HTMLElement | null>(null);
const button = ref<HTMLElement | null>(null);

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

<template>
  <div
    ref="element"
    class="key-value-row"
    :class="{'show-preview': showPreview, [props.type]: true}"
  >
    <RcButton
      ref="button"
      ghost
      aria-haspopup="dialog"
      :aria-expanded="showPreview"
      :aria-controls="previewId"
      :aria-label="i18n.t('component.resource.detail.metadata.keyValue.ariaLabel.showPreview')"
      @click="() => showPreview = true"
    >
      <RcTag
        :type="type"
        :highlight="showPreview"
      >
        <div class="tag-data" :class="{'suffix-filter': props.row.value.includes('matchConditions')}">{{ props.row.key }}</div>
      </RcTag>
    </RcButton>
    <CopyToClipboard :value="row.value" />
    <Preview
      v-if="showPreview"
      :id="previewId"
      class="preview"
      :title="row.key"
      :value="row.value"
      :anchor-element="element"
      aria-live="polite"
      @close="onClose"
    />
  </div>
</template>

<style lang="scss" scoped>
.key-value-row {
  display: inline-block;
  position: relative;
  padding: 0;

  .copy-to-clipboard {
    position: fixed;

    right: -20px;
    top: -6px;
    z-index: 20px;
  }

  &, .btn, .rc-tag {
    max-width: calc(100%);
  }

  .rc-tag {
    display: inline-block;
    line-height: normal;
  }

  .tag-data {
    display: inline-flex;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: calc(100%);
    line-height: 21px;
    font-family: Lato;
    font-size: 13px;
    font-weight: 400;
    align-items: center;
  }

  & .btn {
    line-height: initial;
    min-height: initial;
  }

  &.active {
    $ellipsis-padding: 22px;

    &.show-preview {
      .copy-to-clipboard {
        position: fixed;
      }
    }

    button:focus-visible, button:hover, .copy-to-clipboard:focus-visible {
      .rc-tag .tag-data {
        // This alters the ellipsis so we show more letters when the clipboard button is visible and occluding parts of the tag
        padding-right: $ellipsis-padding;
      }

      & + .copy-to-clipboard {
        position: absolute;
      }
    }

    .copy-to-clipboard:focus-visible, .copy-to-clipboard:hover {
      position: absolute;

    }

    .btn:has(+ .copy-to-clipboard:focus-visible), .btn:has(+ .copy-to-clipboard:hover)  {
      .rc-tag .tag-data {
        // This alters the ellipsis so we show more letters when the clipboard button is visible and occluding parts of the tag
        padding-right: $ellipsis-padding;
      }
    }
  }

  .suffix-filter {
    display: inline-flex;
    align-items: center;
  }

  .suffix-filter::after {
    content: "";
    width: 12px;
    height: 12px;
    margin-top: 2px;
    margin-left: 8px;
    background: url('../../../../assets/img/filter.svg') no-repeat center center;
    background-size: contain;
  }
}
</style>
