<script>
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import RcButton from '@components/RcButton/RcButton.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { POLICY_MODE } from '../types/runtime-enforcer';

export default {
  emits: ['close'],

  components: {
    Card,
    Banner,
    RcButton,
    LabeledSelect,
  },

  props: {
    resources: {
      type:    Array,
      default: () => [],
    },
  },

  data() {
    return { targetMode: POLICY_MODE.MONITOR };
  },

  computed: {
    isBulk() {
      return this.resources.length > 1;
    },

    allSameMode() {
      return this.resources.every((r) => r.spec.mode === this.resources[0]?.spec.mode);
    },
    showModeSelect() {
      return this.isBulk && !this.allSameMode;
    },

    transitionDirection() {
      if (this.resources[0].spec.mode === POLICY_MODE.MONITOR) {
        return {
          from: POLICY_MODE.MONITOR,
          to:   POLICY_MODE.PROTECT,
        };
      } else if (this.resources[0].spec.mode === POLICY_MODE.PROTECT) {
        return {
          from: POLICY_MODE.PROTECT,
          to:   POLICY_MODE.MONITOR,
        };
      }
    },

    modeOptions() {
      return [
        { value: POLICY_MODE.MONITOR, label: this.t('runtimeEnforcer.policyProposal.exportDialog.mode.monitor') },
        { value: POLICY_MODE.PROTECT, label: this.t('runtimeEnforcer.policyProposal.exportDialog.mode.protect') },
      ];
    },

    title() {
      return this.t(`runtimeEnforcer.activePolicies.changeModeDialog.title.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    bannerText() {
      return this.t(`runtimeEnforcer.activePolicies.changeModeDialog.banner.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    confirmText() {
      return this.isBulk
        ? (this.allSameMode ?
          this.t('runtimeEnforcer.activePolicies.changeModeDialog.confirm.bulkSame', { count: this.resources.length }, true)
          : this.t('runtimeEnforcer.activePolicies.changeModeDialog.confirm.bulk', { count: this.resources.length }, true))
        : this.t('runtimeEnforcer.activePolicies.changeModeDialog.confirm.single', { name: this.resources[0]?.nameDisplay }, true);
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    modeIconImgSrc(mode) {
      if (mode === 'monitor') {
        return require('@runtime-enforcer/assets/img/monitor.svg');
      } else if (mode === 'protect') {
        return require('@runtime-enforcer/assets/img/protect.svg');
      } else if (mode === 'enforce') {
        return  null;
      }
    },

    modetext(mode) {
      return this.t(`runtimeEnforcer.activePolicies.mode.${mode.toLowerCase()}`);
    },

    changeMode() {
      const targetMode = this.isBulk ? this.targetMode : this.transitionDirection.to;

      this.resources.forEach((resource) => {
        resource.spec.mode = targetMode;
        resource.save();
      });
      this.close();
    },
  },
};
</script>

<template>
  <Card
    class="export-policy-dialog-card"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ title }}
      </h4>
    </template>
    <template #body>
      <Banner
        class="export-banner"
        color="info"
      >
        {{ bannerText }}
      </Banner>
      <template v-if="showModeSelect">
        <p
          class="export-confirm-text"
          v-clean-html="confirmText"
        />
        <LabeledSelect
          class="export-mode-select"
          v-model:value="targetMode"
          :options="modeOptions"
        />
      </template>
      <p v-else class="export-confirm-text confirm-with-direction">
        <span
          class="confirm-inline-text"
          v-clean-html="confirmText"
        />
        <span class="mode-change-direction">
          <span
            class="text-wrap"
          ><img
              :src="modeIconImgSrc(transitionDirection.from)"
              alt=""
              width="16"
              height="16"
              class="mode-icon"
            ><span class="mode-text" :class="transitionDirection.from.toLowerCase()">{{ modetext(transitionDirection.from) }}</span></span>
          <span
            aria-hidden="true"
            class="mode-arrow"
          />
          <span
            class="text-wrap"
          ><img
              :src="modeIconImgSrc(transitionDirection.to)"
              alt=""
              width="16"
              height="16"
              class="mode-icon"
            ><span class="mode-text" :class="transitionDirection.to.toLowerCase()">{{ modetext(transitionDirection.to) }}</span></span>
          </span>
        </p>
    </template>
    <template #actions>
      <RcButton
        variant="link"
        size="large"
        @click="close"
      >
        {{ t('runtimeEnforcer.activePolicies.changeModeDialog.cancel') }}
      </RcButton>
      <RcButton
        variant="primary"
        size="large"
        left-icon="refresh"
        class="ml-10"
        @click="changeMode"
      >
        {{ t('runtimeEnforcer.activePolicies.changeModeDialog.changeMode') }}
      </RcButton>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.export-policy-dialog-card {
  box-shadow: none;

  :deep(.card-actions) {
    justify-content: end;
  }

  .export-banner {
    margin: 16px 0 24px;
  }

  .export-confirm-text {
    margin: 0 0 16px;
  }

  .confirm-with-direction {
    margin-bottom: 20px;

    .confirm-inline-text {
      display: inline;
      line-height: 21px;
      white-space: normal;
      overflow-wrap: anywhere;

      :deep(p) {
        display: inline;
        margin: 0;
        line-height: 21px;
      }
    }

    .mode-change-direction {
      display: inline-flex;
      align-items: center;
      line-height: 21px;
      gap: 8px;
      margin-top: 0;
      margin-bottom: 0;
      margin-left: 8px;
      vertical-align: middle;
      white-space: nowrap;
    }
  }

  .mode-change-direction {
    margin-top: 8px;
    margin-bottom: 20px;
  }

  .export-mode-select {
    display: inline-block;
    margin-bottom: 20px;
  }
  .text-wrap {
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  .mode-icon {
    margin-right: 8px;
  }

  .mode-arrow {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-right: 8px;
    background-image: url('~@runtime-enforcer/assets/img/arrow-right.svg');
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    flex: 0 0 auto;
    body.theme-dark & {
      filter: brightness(0) invert(1);
    }
  }

  .mode-text {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 21px; /* 150% */
    &.monitor {
      color: #1F67DB;
    }
    &.protect {
      color: #007032;
    }
  }
}
</style>
