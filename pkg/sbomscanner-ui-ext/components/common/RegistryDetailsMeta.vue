<template>
    <div class="stats">
        <div class="column column-1">
            <div class="stats-item">
                <div class="stat-item">
                    <span class="label">{{ properties.namespace.label }}</span>
                    <span class="value">{{ properties.namespace.value }}</span>
                </div>
                <div class="stat-item">
                    <span class="label">{{ properties.uri.label }}</span>
                    <span class="value">{{ properties.uri.value }}</span>
                </div>
                 <div class="stat-item">
                    <span class="label">{{ properties.schedule.label }}</span>
                    <span class="value">{{ properties.schedule.value }}</span>
                </div>
            </div>
        </div>
        <div class="column column-2">
          <KeyValue
            :propertyName="properties.repositories.label"
            :rows="repositories"
            type="active"
            @show-configuration="(returnFocusSelector) => emit('show-configuration', returnFocusSelector, 'labels-and-annotations')"
          />
        </div>
        <div class="column column-3">
          <div class="heading">
            <span class="title text-deemphasized">{{ properties.platforms.label }}</span>
            <span class="count">{{ properties.platforms.value }}</span>
          </div>
          <div test-id="platforms" v-if="properties.platforms.value > 0" class="vendor-tags-wrapper">
              <div class="vendor-tags">
                  <span v-for="(platform, index) in properties.platforms.list" :key="index" class="vendor-tag active">
                      {{ getPlatformTag(platform)}}
                  </span>
              </div>
          </div>
        </div>
    </div>
</template>

<script>
import KeyValue from '../rancher-rewritten/shell/components/KeyValue.vue';
import jsyaml from 'js-yaml';
export default {
  name:       'RegistryDetailsMeta',
  components: { KeyValue },
  props:      {
    properties: {
      type:     Object,
      default:  () => ({}),
      required: true,
    },
  },
  methods: {
    getPlatformTag(platform) {
      const { os, arch, variant } = platform;

      return `${os} / ${arch}${variant ? ` / ${variant}` : ''}`;
    },
  },
  computed: {
    repositories() {
      return this.properties.repositories.list?.map((repo) => ({ key: repo.name, value: jsyaml.dump(repo) })) || [];
    }
  }
};
</script>

<style lang="scss" scoped>

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: flex-start;
  row-gap: 4px;
  column-gap: 24px;
  align-self: stretch;
  margin-top: 16px;
}

.stat-item {
  display: flex;
  align-items: flex-start;
  align-self: stretch;
  font-family: Lato;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 21px;
  margin-bottom: 4px;
}
.label {
  display: flex;
  width: 144px;
  align-items: center;
  gap: 8px;
  color: var(--disabled-text);
}
.value {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 0 0;
}

.vendor-tags-wrapper {
  position: relative;
  display: inline-block;
}
.vendor-tags {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}
.vendor-tag {
  display: flex;
  margin-right: 5px;
  padding: 1px 6px;
  background-color: transparent;
  border-radius: 4px;
  user-select: none;
  height: 24px;
  min-height: auto;
  align-items: center;
  font-family: Lato;
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
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
  background-color: #EDEFF3;
}
.hover-panel {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: var(--input-bg);
  border: solid var(--border-width) var(--input-border);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  border-radius: 8px;
  padding: 12px;

  min-width: 400px;
  max-width: 500px;
  width: auto;
  box-sizing: border-box;

  z-index: 1000;
}
.hover-panel h4 {
  margin: 0 0 6px;
  font-size: 14px;
}

.hover-panel a {
  color: #007acc;
  text-decoration: none;
}

.hover-panel a:hover {
  text-decoration: underline;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;

  h4 {
    margin: 0;
    font-size: 14px;
  }

  .icon-close {
    cursor: pointer;
    font-size: 14px;
    color: var(--disabled-text);

    &:hover {
      color: var(--text-color);
    }
  }
}

.count {
    margin-left: 24px;
}

.heading {
    margin-bottom: 8px;
}
</style>
