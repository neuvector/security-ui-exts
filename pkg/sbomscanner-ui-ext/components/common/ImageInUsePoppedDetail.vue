<template>
  <div
      ref="trigger"
      class="image-in-use-detail"
      @mouseenter="checkPosition"
      @mouseleave="showOnTop = false"
  >
    <div class="indicator-wrapper">

      <FixAvailableIcon :fixAvailable="isInUse" />

      <RouterLink
          v-if="isInUse"
          :to="link"
          class="count text-bold"
      >
        {{ count }}
      </RouterLink>
    </div>

    <div
        v-if="isInUse"
        class="hover-overlay"
        :class="{ 'show-top': showOnTop }"
    >
      <div class="popup-box">
        <div class="popup-content">
          <div class="popup-text">
            <span>
               {{ t('imageScanner.images.listTable.popup.imageUsedBy') }}&nbsp;
            </span>
            <span class="popup-workload-count">
              {{ t(count <= 1 ? 'imageScanner.images.listTable.popup.inUseTooltipSingle' : 'imageScanner.images.listTable.popup.inUseTooltipPlural', { count }) }}
            </span>
            <a
              class="learn-more-link"
              :href="learnMoreLink"
              target="_blank"
          >
            {{ t('imageScanner.general.learnMore') }}
          </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FixAvailableIcon from "@sbomscanner-ui-ext/components/common/FixAvailableIcon.vue";

export default {
  name: 'ImageInUsePoppedDetail',
  components: {FixAvailableIcon},
  props: {
    count: {
      type:    Number,
      default: 0
    },
    link: {
      type:    [Object, String],
      default: () => ({})
    }
  },
  data() {
    return {
      showOnTop:     false,
      learnMoreLink: '',
    };
  },
  computed: {
    isInUse() {
      return this.count > 0;
    }
  },
  methods: {
    checkPosition() {
      if (!this.$refs.trigger) return;

      const trigger = this.$refs.trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      this.showOnTop = (viewportHeight - trigger.bottom < 90);
    }
  }
};
</script>

<style lang="scss" scoped>
.image-in-use-detail {
  position: relative;
  display: flex;
  align-items: center;
  cursor: default;
  width: fit-content;

  // Show popup on hover
  &:hover .hover-overlay {
    display: block;
    visibility: visible;
    opacity: 1;
  }
}

.indicator-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.count {
  min-width: 20px;
  color: var(--body-text);
  &.text-bold {
    font-weight: 400;
    text-decoration: underline;
  }
}

.hover-overlay {
  display: none;
  position: absolute;
  top: 100%;
  left: 20px;
  z-index: 100;
  padding-top: 10px;
  min-width: 240px;

  &.show-top {
    top: auto;
    bottom: 100%;
    padding-top: 0;
    padding-bottom: 10px;

    .popup-box {
      &::before {
        top: auto;
        bottom: -6px;
        border-width: 6px 6px 0 6px;
        border-color: var(--border) transparent transparent transparent;
      }
      &::after {
        top: auto;
        bottom: -5px;
        border-width: 5px 5px 0 5px;
        border-color: var(--body-bg) transparent transparent transparent;
      }
    }
  }
}

.popup-box {
  display: inline-block;
  width: max-content;
  max-width: none;
  background: var(--body-bg);
  border: 1px solid var(--border);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 16px;
  position: relative;
  white-space: normal;
}

.popup-content {
  display: flex;
  gap: 4px;
  text-align: left;
  .popup-text {
    font-size: 14px;
    font-weight: 400;
    color: var(--body-text);
    .popup-workload-count {
      font-weight: 600;
    }
  }
}

.learn-more-link {
  font-size: 14px;
  color: var(--body-text);
  cursor: pointer;
  text-decoration: underline;
  font-weight: normal;

  &:hover {
    text-decoration: underline;
  }
}
</style>