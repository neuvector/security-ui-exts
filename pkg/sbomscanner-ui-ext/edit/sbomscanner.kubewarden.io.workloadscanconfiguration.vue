<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import FileSelector from '@shell/components/form/FileSelector';
import CruResource from '@shell/components/CruResource';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import Banner from '@components/Banner/Banner.vue';
import { SECRET } from '@shell/config/types';
import { SECRET_TYPES } from '@shell/config/secret';
import { SCAN_INTERVAL_OPTIONS, SCAN_INTERVALS } from '@sbomscanner-ui-ext/constants';
import { PRODUCT_NAME, PAGE, LOCAT_HOST } from '@sbomscanner-ui-ext/types';
import { filterUnique } from '@sbomscanner-ui-ext/utils/app';
import { VALID_PLATFORMS, ALLOWED_VARIANTS, WORKLOAD_SCAN_DOCS_URL } from '@sbomscanner-ui-ext/constants/securityConstants';

export default {
  name: 'CruWorkloadScanConfiguration',

  components: {
    LabeledInput,
    Checkbox,
    FileSelector,
    CruResource,
    LabeledSelect,
    MatchExpressions,
    Banner,
  },

  mixins: [CreateEditView],

  async fetch() {
    await Promise.all([
      this.$store.dispatch(`${ this.inStore }/findAll`, { type: SECRET }),
      this.$store.dispatch('cluster/findAll', { type: 'namespace' })
    ]);
    this.allSecrets = this.$store.getters[`${ this.inStore }/all`](SECRET);
  },

  data() {
    if (!this.value.metadata) {
      this.value.metadata = {};
    }
    this.value.metadata.name = 'default';

    if (!this.value.spec) {
      this.value.spec = {
        enabled:            true,
        scanOnChange:       true,
        artifactsNamespace: '',
        namespaceSelector:  {},
        authSecret:         '',
        caBundle:           '',
        insecure:           false,
        platforms:          [],
        scanInterval:       '3h',
      };
    }

    if (!this.value.spec.namespaceSelector || Array.isArray(this.value.spec.namespaceSelector)) {
      this.value.spec.namespaceSelector = {};
    }

    if (this.value.spec.enabled === undefined) this.value.spec.enabled = true;
    if (this.value.spec.scanOnChange === undefined) this.value.spec.scanOnChange = true;
    if (this.value.spec.insecure === undefined) this.value.spec.insecure = false;
    if (this.value.spec.caBundle === undefined) this.value.spec.caBundle = '';
    if (!this.value.spec.platforms) this.value.spec.platforms = [];

    if (!this.value.spec.artifactsNamespace) {
      this.value.spec.artifactsNamespace = 'cattle-sbomscanner-system';
    }

    if (!this.value.spec.scanInterval) {
      this.value.spec.scanInterval = '3h';
    }

    const osOptions = Object.keys(VALID_PLATFORMS).map((k) => ({ label: k, value: k }));

    return {
      inStore:       this.$store.getters['currentProduct'].inStore,
      errors:        null,
      allSecrets:    null,
      authLoading:   false,
      osOptions:     osOptions,
      PAGE,
      PRODUCT_NAME,
      saveLoading:   false,
      WORKLOAD_SCAN_DOCS_URL,
    };
  },

  computed: {
    SCAN_INTERVAL_OPTIONS() { return SCAN_INTERVAL_OPTIONS; },

    isArtifactsNamespaceLocked() {
      // Lock the field if we are editing an existing configuration
      return this.mode === 'edit';
    },

    artifactsNamespaceTooltipText() {
      if (this.isArtifactsNamespaceLocked) {
        return this.t('imageScanner.workloads.configuration.cru.general.artifactsNamespaceLockedTooltip');
      } else {
        return this.t('imageScanner.workloads.configuration.cru.general.artifactsNamespaceTooltip');
      }
    },

    namespaceOptions() {
      const namespaces = this.$store.getters['cluster/all']('namespace') || [];
      const options = namespaces.map(n => n.id);

      const currentNs = this.value?.spec?.artifactsNamespace;
      if (currentNs && !options.includes(currentNs)) {
        options.push(currentNs);
      }

      return options;
    },

    matchExpressions: {
      get() {
        return this.value?.spec?.namespaceSelector?.matchExpressions || [];
      },
      set(val) {
        if (!this.value.spec.namespaceSelector) {
          this.value.spec.namespaceSelector = {};
        }
        if (val && val.length > 0) {
          this.value.spec.namespaceSelector.matchExpressions = val;
        } else {
          delete this.value.spec.namespaceSelector.matchExpressions;
        }
      }
    },

    selectedScanInterval: {
      get() {
        const currentInterval = this.value.spec.scanInterval;
        if (!currentInterval || currentInterval === SCAN_INTERVALS.MANUAL) return SCAN_INTERVALS.MANUAL;
        return currentInterval;
      },
      set(newValue) {
        this.value.spec.scanInterval = newValue;
      }
    },

    authOptions() {
      const headerOptions = [
        { label: this.t('imageScanner.registries.configuration.cru.authentication.create'), value: 'create', kind: 'highlighted' },
        { label: 'divider', disabled: true, kind: 'divider' },
        { label: this.t('generic.none'), value: '' }
      ];

      if (!this.allSecrets) return headerOptions;

      const currentNamespace = this.value?.spec?.artifactsNamespace;

      const secretOptions = this.allSecrets
          .filter((secret) => {
            return secret._type === SECRET_TYPES.DOCKER_JSON &&
                secret.metadata?.namespace === currentNamespace;
          })
          .map((secret) => ({
            label: `${secret.metadata.namespace}/${secret.metadata.name}`,
            value: secret.metadata.name,
          }));

      return [...headerOptions, ...secretOptions];
    },

    validationPassed() {
      const spec = this.value?.spec || {};
      const validSecret = spec.authSecret !== 'create';
      return validSecret;
    },

    secretCreateUrl() {
      const clusterId = this.$route.params.cluster;
      return `${ LOCAT_HOST.includes(window.location.host) ? '' : '/dashboard' }/c/${ clusterId }/explorer/secret/create?scope=namespaced`;
    },
  },

  methods: {
    async finish(event) {
      if (event) {
        event.preventDefault();
      }

      this.saveLoading = true;
      this.errors = [];

      if (this.value.spec.scanInterval === SCAN_INTERVALS.MANUAL) {
        delete this.value.spec.scanInterval;
      }

      this.cleanNamespaceSelector()
      this.cleanPlatforms();

      try {
        await this.save();
      } catch (e) {
        this.errors = [e];
      } finally {
        this.saveLoading = false;
        if (!this.errors || this.errors.length === 0) {
          this.$store.dispatch('growl/success', {
            title: this.t('imageScanner.general.saved'),
            message: this.t('imageScanner.workloads.configuration.cru.general.successMessage')
          }, { root: true });
        }
      }
    },

    async refreshList() {
      this.authLoading = true;
      try {
        this.allSecrets = await this.$store.dispatch(`${ this.inStore }/findAll`, { type: SECRET }, { force: true });
      } catch (e) {
        this.errors = [e];
      } finally {
        this.authLoading = false;
      }
    },

    onFileSelected(value) { this.value.spec.caBundle = value; },
    addPlatform() { this.value.spec.platforms.push({ os: 'linux', arch: 'amd64', variant: '' }); },
    removePlatform(index) { this.value.spec.platforms.splice(index, 1); },
    getArchOptions(os) { return (VALID_PLATFORMS[os] || []).map((arch) => ({ label: arch, value: arch })); },
    getVariantOptions(arch) { return (ALLOWED_VARIANTS[arch] || []).map((v) => ({ label: v, value: v })); },
    updateOS(platform, newOS) {
      platform.os = newOS;
      const validArchs = VALID_PLATFORMS[newOS];
      platform.arch = validArchs && validArchs.length > 0 ? (validArchs.includes('amd64') ? 'amd64' : validArchs[0]) : '';
      platform.variant = '';
    },

    updateArch(platform, newArch) {
      platform.arch = newArch;
      if (!this.isVariantSupported(newArch)) platform.variant = '';
    },

    isVariantSupported(arch) { return !!ALLOWED_VARIANTS[arch]; },

    cleanNamespaceSelector() {
      if (!this.value.spec.namespaceSelector) return;

      const { matchExpressions } = this.value.spec.namespaceSelector;

      if (!matchExpressions || matchExpressions.length === 0) {
        delete this.value.spec.namespaceSelector;
        return;
      }

      const cleanedExpressions = filterUnique(
          matchExpressions,
          (m) => !!m.key,
          (m) => {
            const sortedVals = m.values?.length ? [...m.values].sort().join(',') : '';
            return `${m.key}-${m.operator}-${sortedVals}`;
          }
      );

      if (cleanedExpressions.length === 0) {
        delete this.value.spec.namespaceSelector;
      } else {
        this.value.spec.namespaceSelector.matchExpressions = cleanedExpressions;
      }
    },

    cleanPlatforms() {
      if (!this.value.spec.platforms) return;

      this.value.spec.platforms = filterUnique(
          this.value.spec.platforms,
          (p) => p.os && p.arch,
          (p) => `${p.os}-${p.arch}-${p.variant || ''}`
      );
    }
  }
};
</script>

<template>
  <div class="filled-height workload-scan-config">

    <div class="custom-page-header">
      <h1 class="page-title">
        {{ t('imageScanner.workloads.configuration.title') }}
        <span
            class="badge-state"
            :class="{
              'bg-info': isCreate,
              'bg-success': !isCreate && value.spec.enabled,
              'bg-error': !isCreate && !value.spec.enabled
            }"
        >
          {{ isCreate ? t('generic.create') : (value.spec.enabled ? t('imageScanner.general.active') : t('imageScanner.general.inactive')) }}
        </span>
      </h1>
    </div>

    <CruResource
        :done-route="doneRoute"
        :mode="mode"
        :resource="value"
        :subtypes="[]"
        :errors="errors"
        :validation-passed="validationPassed"
        @finish="finish"
        @cancel="done"
    >

      <Banner color="info" class="mt-0 mb-24">
        <span class="banner-text">
          {{ t('imageScanner.workloads.configuration.cru.general.descriptionStart') }}

          <a :href="WORKLOAD_SCAN_DOCS_URL" target="_blank" rel="noopener noreferrer">
            {{ t('imageScanner.workloads.configuration.cru.general.documentationLink') }}
            <i class="icon icon-external-link" />
          </a>
        </span>
      </Banner>

      <div class="row">
        <div class="col span-12">
          <Checkbox
              v-model:value="value.spec.enabled"
              :label="t('imageScanner.workloads.configuration.cru.general.enabled')"
              :tooltip="t('imageScanner.workloads.configuration.cru.general.enabledTooltip')"
              :mode="mode"
          />
        </div>
      </div>

      <template v-if="value.spec.enabled">

        <div class="input-label mt-24">
          {{ t('imageScanner.workloads.configuration.cru.resourceLocation.label') }}
        </div>

        <Banner color="warning" class="mt-16">
          {{ t('imageScanner.workloads.configuration.cru.resourceLocation.description') }}
        </Banner>

        <div class="w-half">
          <LabeledSelect
              v-model:value="value.spec.artifactsNamespace"
              @update:value="value.spec.authSecret = ''"
              :label="t('imageScanner.workloads.configuration.cru.general.artifactsNamespace')"
              :placeholder="t('imageScanner.workloads.configuration.cru.general.artifactsNamespacePlaceholder')"
              :options="namespaceOptions"
              :mode="mode"
              :searchable="true"
              :disabled="isArtifactsNamespaceLocked"
              :tooltip="artifactsNamespaceTooltipText"
          />
        </div>

        <div class="input-label mt-24">
          {{ t('imageScanner.registries.configuration.cru.authentication.label') }}
        </div>

        <div class="row-half mt-16">
          <div>
            <LabeledSelect
                v-model:value="value.spec.authSecret"
                :label="t('imageScanner.registries.configuration.cru.authentication.label')"
                :mode="mode"
                :options="authOptions"
                :loading="authLoading"
            />
          </div>
          <div>
            <div class="checkbox-align">
              <Checkbox
                  v-model:value="value.spec.insecure"
                  :label="t('imageScanner.registries.configuration.cru.registry.insecure.label')"
                  :tooltip="t('imageScanner.registries.configuration.cru.registry.insecure.tooltip')"
                  :mode="mode"
              />
            </div>
          </div>
        </div>

        <div v-if="value.spec.authSecret === 'create'" class="row mt-16">
          <div class="col span-12">
            <Banner color="info" class="m-0">
              <div>
                <p class="m-0 mb-5">
                  {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine1_start') }}
                  <a :href="secretCreateUrl" target="_blank">{{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine1_link') }}</a>
                  {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine1_end') }}
                </p>
                <p class="m-0">
                  {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine2_start') }}
                  <a href="#" @click.prevent="refreshList">{{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine2_link') }}</a>
                  {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine2_end') }}
                </p>
              </div>
            </Banner>
          </div>
        </div>

        <div class="w-half mt-16">
          <LabeledInput
              v-model:value="value.spec.caBundle"
              type="multiline"
              :label="t('imageScanner.registries.configuration.cru.registry.caBundle.label')"
              style="max-height: 110px; overflow-y: auto;"
              :placeholder="t('imageScanner.registries.configuration.cru.registry.caBundle.placeholder')"
          />
          <div class="mt-16">
            <FileSelector class="btn btn-sm role-tertiary" :label="t('generic.readFromFile')" @selected="onFileSelected" />
          </div>
        </div>

        <div class="input-label mt-24">
          {{ t('imageScanner.workloads.configuration.cru.scanning.label') }}
        </div>

        <div class="row-half mt-16">
          <div>
            <LabeledSelect
                v-model:value="selectedScanInterval"
                :options="SCAN_INTERVAL_OPTIONS"
                option-key="value"
                option-label="label"
                :label="t('imageScanner.registries.configuration.cru.scan.schedule.label')"
                :mode="mode"
            />
          </div>
          <div>
            <div class="checkbox-align">
              <Checkbox
                  v-model:value="value.spec.scanOnChange"
                  :label="t('imageScanner.workloads.configuration.cru.general.scanOnChange')"
                  :tooltip="t('imageScanner.workloads.configuration.cru.general.scanOnChangeTooltip')"
                  :mode="mode"
              />
            </div>
          </div>
        </div>

        <div class="input-label mt-24 tooltip-label">
          {{ t('imageScanner.workloads.configuration.cru.scanning.namespaces') }}
          <i
              v-clean-tooltip="{ content: t('imageScanner.workloads.configuration.cru.scanning.namespacesTooltip'), triggers: ['hover', 'touch', 'focus'] }"
              class="icon icon-info icon-lg custom-info-icon"
              tabindex="0"
              role="tooltip"
          />
        </div>

        <div class="namespace-selector-row">
          <MatchExpressions
              v-model:value="matchExpressions"
              :mode="mode"
              type="namespace"
          />
        </div>

        <div class="input-label mt-24">
          {{ t('imageScanner.registries.configuration.cru.filters.label') }}
        </div>

        <div v-if="value.spec.platforms && value.spec.platforms.length > 0" class="row-platforms mt-6">
          <label class="text-label">{{ t('imageScanner.registries.configuration.cru.filters.os') }}</label>
          <label class="text-label">{{ t('imageScanner.registries.configuration.cru.filters.arch') }}</label>
          <label class="text-label">{{ t('imageScanner.registries.configuration.cru.filters.variant') }}</label>
          <div></div> </div>

        <div v-for="(platform, index) in value.spec.platforms" :key="index" class="row-platforms mb-10">
          <LabeledSelect v-model:value="platform.os" @update:value="updateOS(platform, $event)" :options="osOptions" :mode="mode" />
          <LabeledSelect v-model:value="platform.arch" @update:value="updateArch(platform, $event)" :options="getArchOptions(platform.os)" :disabled="!platform.os" :mode="mode" />
          <LabeledSelect v-model:value="platform.variant" :options="getVariantOptions(platform.arch)" :disabled="!isVariantSupported(platform.arch)" :mode="mode" />
          <button v-if="!isView" type="button" class="btn role-link" style="padding: 0;" @click="removePlatform(index)">
            {{ t('generic.remove') }}
          </button>
        </div>

        <div :class="['platform-add-row', value.spec.platforms && value.spec.platforms.length > 0 ? 'mt-6' : 'mt-16']">
          <button v-if="!isView" type="button" class="btn role-tertiary add" @click="addPlatform">
            {{ t('imageScanner.registries.configuration.cru.filters.add') }}
          </button>
        </div>

      </template>

      <template #form-footer>
        <div class="custom-footer">
<!--          <button type="button" class="btn role-secondary" @click="done">-->
<!--            {{ t('generic.cancel') }}-->
<!--          </button>-->
          <button
              type="button"
              class="btn role-primary"
              :disabled="!validationPassed || saveLoading"
              @click="finish"
          >
            {{ t('imageScanner.general.apply') }}
<!--            {{ isCreate ? t('generic.create') : t('generic.save') }}-->
          </button>
        </div>
      </template>
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
.workload-scan-config {

  /* ---- Custom Grid Classes (Ensures strict 16px gaps everywhere) ---- */

  .w-half {
    width: calc(50% - 8px); /* 50% minus half of the 16px gap */
  }

  .row-half {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    width: 100%;
  }

  /* Matches the exact width of a standard Rancher .span-10 col (83.33%) */
  $span-10-width: calc(100% * 10 / 12);

  .row-platforms {
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 3fr) minmax(0, 3fr) minmax(0, 1fr);
    gap: 16px;
    width: $span-10-width;
    align-items: center;
  }

  .platform-add-row {
    width: $span-10-width;
  }

  /* ---- Match Expressions Grid Override ---- */
  .namespace-selector-row {
    width: $span-10-width;

    &:has(input) {
      margin-top: 16px;
    }

    /* Force the MatchExpressions component to use our exact 3/3/3/1 fractional grid and 16px gap */
    :deep(.match-expression-row),
    :deep(.match-expression-header) {
      grid-template-columns: minmax(0, 3fr) minmax(0, 3fr) minmax(0, 3fr) minmax(0, 1fr) !important;
      grid-gap: 16px !important;
    }

    /* Reset Rancher's native padding overrides on the MatchExpressions component */
    :deep(.match-expression-row > div),
    :deep(.match-expression-header > label) {
      padding-right: 0 !important;
    }

    :deep(.remove-container) {
      justify-content: flex-start !important;
      padding-left: 0 !important;
    }
  }

  /* ---- Miscellaneous Overrides ---- */
  .checkbox-align {
    padding-top: 14px;
  }

  :deep(.checkbox-outer-container-extra) {
    display: none;
  }

  /* ---- Typography & Decor ---- */
  .custom-footer {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    padding-top: 24px;
    margin-top: 32px;
    border-top: 1px solid var(--border);
  }

  .input-label {
    font-size: 18px;
    line-height: 24px;
    font-weight: 500;
    font-family: 'Lato', sans-serif;
    color: var(--body-text);
    display: block;
  }

  .text-label {
    color: var(--input-label);
    font-size: 12px;

    i {
      margin-left: 4px;
      font-size: 12px;
      color: var(--muted);
    }
  }

  .banner-text {
    a {
      display: inline-flex;
      align-items: center;
      gap: 4px;

      .icon-external-link {
        font-size: 14px;
      }
    }
  }

  .tooltip-label {
    display: flex;
    align-items: center;

    .custom-info-icon {
      line-height: normal;
      margin-left: 4px;
      color: var(--muted);

      &:focus-visible {
        @include focus-outline;
        outline-offset: 2px;
      }
    }
  }

  /* Deep CSS forces inputs, MatchExpressions headers to 12px */
  :deep(.labeled-input label),
  :deep(.labeled-select label) {
    font-size: 12px;
  }
  :deep(.match-expressions th) {
    font-size: 12px;
    font-weight: normal;
    color: var(--input-label);
  }

  :deep(.checkbox-label) {
    font-size: 14px;
  }
  .btn.add {
    font-size: 14px;
  }

  /* 8-Point Grid Spacing Classes */
  .mt-6 { margin-top: 6px; }
  .mt-8  { margin-top: 8px; }
  .mt-16 { margin-top: 16px; }
  .mt-24 { margin-top: 24px; }
  .mt-32 { margin-top: 32px; }

  .mb-8  { margin-bottom: 8px; }
  .mb-10 { margin-bottom: 10px; }
  .mb-16 { margin-bottom: 16px; }
  .mb-24 { margin-bottom: 24px; }
}
.custom-page-header {
  margin-bottom: 20px;

  .page-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 24px;
    font-weight: 500;
    margin: 0;
  }

  .badge-state {
    font-size: 12px;
    line-height: normal;
    padding: 2px 8px;
    border-radius: 20px;
    border: 1px solid transparent;

    &.bg-info {
      color: var(--on-info-banner, var(--info-text));
      background: var(--info-badge, var(--info));
    }

    &.bg-success {
      color: var(--on-success-banner, var(--success-text));
      background: var(--success-badge, var(--success));
    }

    &.bg-error {
      color: var(--on-error-banner, var(--error-text));
      background: var(--error-badge, var(--error));
    }
  }
}
</style>