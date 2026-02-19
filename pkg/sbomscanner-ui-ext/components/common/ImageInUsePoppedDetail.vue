<template>
  <div
      ref="trigger"
      class="image-in-use-detail"
      @mouseenter="checkPosition"
      @mouseleave="showOnTop = false"
  >
    <div class="indicator-wrapper">
      <div
          class="icon-container"
          :class="{ 'is-active': isInUse }"
      >
        <i class="icon" :class="isInUse ? 'icon-checkmark' : 'icon-x'" />
      </div>

      <span
          v-if="isInUse"
          class="count text-bold"
      >
        {{ count }}
      </span>
    </div>

    <div
        v-if="isInUse"
        class="hover-overlay"
        :class="{ 'show-top': showOnTop }"
    >
      <div class="popup-box">
        <div class="popup-content">
          <span class="popup-text">
            {{ t(count <= 1 ? 'imageScanner.images.listTable.popup.inUseTooltipSingle' : 'imageScanner.images.listTable.popup.inUseTooltipPlural', { count }) }}
          </span>
          <RouterLink
              class="learn-more-link"
              :to="link"
          >
            {{ t('imageScanner.general.learnMore') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageInUsePoppedDetail',
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
    return { showOnTop: false };
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

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--border);
  color: var(--disabled-text);

  &.is-active {
    border-color: var(--primary);
    color: var(--primary);
  }

  i {
    font-size: 10px;
    font-weight: bold;
  }
}

.count {
  min-width: 20px;
  color: var(--body-text);
  &.text-bold {
    font-weight: bold;
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
  background: var(--body-bg);
  border: 1px solid var(--border);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 12px;
  position: relative;
  white-space: normal;

  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 10px;
    border-width: 0 6px 6px 6px;
    border-style: solid;
    border-color: transparent transparent var(--border) transparent;
    z-index: 100;
  }

  &::after {
    content: '';
    position: absolute;
    top: -5px;
    left: 11px;
    border-width: 0 5px 5px 5px;
    border-style: solid;
    border-color: transparent transparent var(--body-bg) transparent;
    z-index: 101;
  }
}

.popup-content {
  font-size: 13px;
  color: var(--body-text);
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.learn-more-link {
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
  font-weight: normal;

  &:hover {
    text-decoration: underline;
  }
}
</style>