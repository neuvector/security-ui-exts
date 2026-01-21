<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import FileSelector from '@shell/components/form/FileSelector';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import CruResource from '@shell/components/CruResource';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Banner from '@components/Banner/Banner.vue';
import { SECRET } from '@shell/config/types';
import {
  REGISTRY_TYPE,
  REGISTRY_TYPE_OPTIONS,
  SCAN_INTERVAL_OPTIONS, SCAN_INTERVALS
} from '@sbomscanner-ui-ext/constants';
import { PRODUCT_NAME, PAGE, LOCAT_HOST } from '@sbomscanner-ui-ext/types';
import { SECRET_TYPES } from '@shell/config/secret';

const VALID_PLATFORMS = {
  linux:     ['amd64', 'arm', 'arm64', 's390x','386', 'loong64', 'mips', 'mipsle', 'mips64', 'mips64le', 'ppc64', 'ppc64le', 'riscv64'],
  aix:       ['ppc64'],
  android:   ['amd64', 'arm', 'arm64','386'],
  darwin:    ['amd64', 'arm64'],
  dragonfly: ['amd64'],
  freebsd:   ['amd64', 'arm', '386'],
  illumos:   ['amd64'],
  ios:       ['arm64'],
  js:        ['wasm'],
  netbsd:    ['amd64', 'arm', '386'],
  openbsd:   ['amd64', 'arm', 'arm64', '386'],
  plan9:     ['amd64', 'arm', '386'],
  solaris:   ['amd64'],
  wasip1:    ['wasm'],
  windows:   ['amd64', 'arm', 'arm64', '386']
};

const ALLOWED_VARIANTS = {
  arm:   ['v6', 'v7', 'v8'],
  arm64: ['v8']
};

export default {
  name: 'CruRegistry',

  components: {
    LabeledInput,
    Checkbox,
    FileSelector,
    NameNsDescription,
    CruResource,
    LabeledSelect,
    Banner,
  },

  mixins: [CreateEditView],

  async fetch() {
    this.allSecrets = await this.$store.dispatch(
      `${ this.inStore }/findAll`, { type: SECRET }
    );
  },

  data() {
    if (!this.value.spec) {
      this.value.spec = {
        catalogType:  REGISTRY_TYPE.OCI_DISTRIBUTION,
        authSecret:   '',
        uri:          '',
        repositories: [],
        scanInterval: SCAN_INTERVALS.MANUAL,
        caBundle:     '',
        insecure:     false,
      };
    }

    if (!this.value.spec.platforms) {
      this.value.spec.platforms = [];
    }

    if (this.value.spec.insecure === undefined) this.value.spec.insecure = false;
    if (this.value.spec.caBundle === undefined) this.value.spec.caBundle = '';

    if ( this.value.spec.scanInterval === null) {
      this.value.spec.scanInterval = SCAN_INTERVALS.MANUAL;
    }

    const osOptions = Object.keys(VALID_PLATFORMS).map((k) => ({
      label: k,
      value: k
    }));

    return {
      inStore:         this.$store.getters['currentProduct'].inStore,
      errors:          null,
      allSecrets:      null,
      filteredSecrets: null,
      PAGE,
      PRODUCT_NAME,
      authLoading:     false,
      osOptions:       osOptions,
    };
  },

  computed: {
    repoNames: {
      get(){
        return (this.value.spec.repositories || []).map( (r) => r.name);
      },
      set(repoStrings){
        this.value.spec.repositories = repoStrings.map((repoName) => ({ name: repoName }));
      },
    },
    /**
     * Build the options list for the authentication dropdown
     */
    options() {
      const headerOptions = [
        {
          label: this.t('imageScanner.registries.configuration.cru.authentication.create'),
          value: 'create',
          kind:  'highlighted'
        },
        {
          label:    'divider',
          disabled: true,
          kind:     'divider'
        },
        {
          label: this.t('generic.none'),
          value: '',
        }
      ];

      if (!this.allSecrets) {
        return headerOptions;
      }

      const currentNamespace = this.value.metadata?.namespace ?? 'default';

      const secretOptions = this.allSecrets
        .filter((secret) => {
          return secret.metadata.namespace === currentNamespace &&
                secret._type === SECRET_TYPES.DOCKER_JSON;
        })
        .map((secret) => {
          const name = secret.metadata.name;

          return {
            label: name,
            value: name,
          };
        });

      return [
        ...headerOptions,
        ...secretOptions
      ];
    },

    SCAN_INTERVAL_OPTIONS() {
      return SCAN_INTERVAL_OPTIONS;
    },

    selectedScanInterval: {
      get() {
        const currentInterval = this.value.spec.scanInterval;

        if (!currentInterval || currentInterval === SCAN_INTERVALS.MANUAL ) {
          return SCAN_INTERVALS.MANUAL;
        }

        return currentInterval;
      },
      set(newValue) {
        this.value.spec.scanInterval = newValue;
      }
    },

    REGISTRY_TYPE_OPTIONS() {
      return REGISTRY_TYPE_OPTIONS;
    },

    REGISTRY_TYPE() {
      return REGISTRY_TYPE;
    },

    /**
     * Validation for the CruResource save button.
     */
    validationPassed() {
      const spec = this.value?.spec || {};

      const hasName = !!this.value?.metadata?.name?.trim();
      const hasCatalogType = !!spec.catalogType;
      const hasUri = !!spec.uri?.trim();

      const requiresRepositories = spec.catalogType === REGISTRY_TYPE.NO_CATALOG;
      const hasRepositories = !requiresRepositories || !!spec.repositories?.length;

      const validSecret = spec.authSecret !== 'create';

      return hasName && hasCatalogType && hasUri && hasRepositories && validSecret;
    },

    secretCreateUrl() {
      const clusterId = this.$route.params.cluster;

      return `${ LOCAT_HOST.includes(window.location.host) ? '' : '/dashboard' }/c/${ clusterId }/explorer/secret/create?scope=namespaced`;
    },
  },

  methods: {
    async finish(event) {
      if (this.value.spec.scanInterval === SCAN_INTERVALS.MANUAL) {
        delete this.value.spec.scanInterval;
      }

      this.cleanPlatforms();

      try {
        await this.save(event);
      } catch (e) {
        this.errors = [e];
      } finally {
        if (!this.errors || this.errors.length === 0) {
          this.$router.push({
            name:   `c-cluster-${ PRODUCT_NAME }-${ PAGE.REGISTRIES }`,
            params: {
              cluster: this.$route.params.cluster,
              product: PRODUCT_NAME
            }
          });
        }
      }
    },

    /**
     * Manually refresh the list of secrets for the dropdown.
     */
    async refreshList() {
      this.authLoading = true;
      try {
        this.allSecrets = await this.$store.dispatch(
          `${ this.inStore }/findAll`, { type: SECRET }
        );
      } catch (e) {
        this.errors = [e];
      } finally {
        this.authLoading = false;
      }
    },

    onFileSelected(value) {
      this.value.spec.caBundle = value;
    },

    addPlatform() {
      this.value.spec.platforms.push({
        os:      'linux',
        arch:    'amd64',
        variant: '',
      });
    },

    removePlatform(index) {
      this.value.spec.platforms.splice(index, 1);
    },

    getArchOptions(os) {
      const validArchs = VALID_PLATFORMS[os] || [];

      return validArchs.map((arch) => ({ label: arch, value: arch }));
    },

    getVariantOptions(arch) {
      const validVariants = ALLOWED_VARIANTS[arch] || [];

      return validVariants.map((v) => ({ label: v, value: v }));
    },

    updateOS(platform, newOS) {
      platform.os = newOS;

      const validArchs = VALID_PLATFORMS[newOS];

      // Default to the first valid arch (usually 'amd64' or similar) to prevent invalid state
      if (validArchs && validArchs.length > 0) {
        platform.arch = validArchs.includes('amd64') ? 'amd64' : validArchs[0];
      } else {
        platform.arch = '';
      }

      platform.variant = '';
    },

    updateArch(platform, newArch) {
      platform.arch = newArch;

      if (!this.isVariantSupported(newArch)) {
        platform.variant = '';
      }
    },

    isVariantSupported(arch) {
      return !!ALLOWED_VARIANTS[arch];
    },

    cleanPlatforms() {
      if (!this.value.spec.platforms) return;
      const uniqueSet = new Set();

      this.value.spec.platforms = this.value.spec.platforms.filter((p) => {
        if (!p.os || !p.arch) {
          return false;
        }
        const key = `${p.os}-${p.arch}-${p.variant || ''}`;

        if (uniqueSet.has(key)) {
          return false;
        }
        uniqueSet.add(key);

        return true;
      });
    }
  }
};
</script>

<template>
  <div class="filled-height">
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
      <NameNsDescription
        name-label="imageScanner.registries.configuration.cru.registry.label"
        :value="value"
        :mode="mode"
        @update:value="$emit('input', $event)"
      />

      <div class="registry-input-label">
        {{ t('imageScanner.registries.configuration.cru.registry.label') }}
      </div>

      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="value.spec.catalogType"
            data-testid="registry-type-select"
            :label="t('imageScanner.registries.configuration.cru.registry.type.label')"
            :options="REGISTRY_TYPE_OPTIONS"
            option-key="value"
            option-label="label"
            required
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.uri"
            :label="t('imageScanner.registries.configuration.cru.registry.uri.label')"
            :placeholder="t('imageScanner.registries.configuration.cru.registry.uri.placeholder')"
            required
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
              v-model:value="value.spec.caBundle"
              type="multiline"
              label="CA Cert Bundle"
              style="max-height: 110px; overflow-y: auto;"
              data-testid="auth-ca-bundle-input"
              :placeholder="t('imageScanner.registries.configuration.cru.registry.caBundle.placeholder')"
          />
          <div class="mt-10">
            <FileSelector
                class="btn btn-sm role-tertiary"
                :label="t('generic.readFromFile')"
                @selected="onFileSelected"
            />
          </div>
        </div>
        <div class="col span-6">
          <div class="mt-10">
            <Checkbox
                v-model:value="value.spec.insecure"
                :label="t('imageScanner.registries.configuration.cru.registry.insecure.label')"
                :tooltip="t('imageScanner.registries.configuration.cru.registry.insecure.tooltip')"
                data-testid="auth-insecure-checkbox"
            />
          </div>
        </div>
      </div>
      <div class="registry-input-label mt-24">
        {{ t('imageScanner.registries.configuration.cru.authentication.label') }}
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="value.spec.authSecret"
            data-testid="auth-secret-select"
            :label="t('imageScanner.registries.configuration.cru.authentication.label')"
            :mode="mode"
            :options="options"
            :loading="authLoading"
          />
        </div>
      </div>
      <div
        v-if="value.spec.authSecret === 'create' "
        class="row"
      >
        <div class="col span-12">
          <Banner color="info">
            <div>
              <p class="m-0 mb-5">
                {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine1_start') }}
                <a
                  :href="secretCreateUrl"
                  target="_blank"
                >
                  {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine1_link') }}
                </a>
                {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine1_end') }}
              </p>

              <p class="m-0">
                {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine2_start') }}
                <a
                  href="#"
                  @click.prevent="refreshList"
                >
                  {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine2_link') }}
                </a>
                {{ t('imageScanner.registries.configuration.cru.authentication.createDescriptionLine2_end') }}
              </p>
            </div>
          </Banner>
        </div>
      </div>
      <div :class="['registry-input-label', { 'mt-24': value.spec.authSecret !== 'create' }]">
        {{ t('imageScanner.registries.configuration.cru.scan.label') }}
      </div>

      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="repoNames"
            data-testid="registry-scanning-repository-names"
            :taggable="true"
            :searchable="true"
            :push-tags="true"
            :close-on-select="false"
            :mode="mode"
            :multiple="true"
            :label="t('imageScanner.registries.configuration.cru.scan.repoName')"
            :placeholder="value.spec.catalogType === REGISTRY_TYPE.OCI_DISTRIBUTION ? t('imageScanner.registries.configuration.cru.scan.placeholder.ociDistribution') : t('imageScanner.registries.configuration.cru.scan.placeholder.nocatalog')"
            :options="repoNames"
            :disabled="mode==='view'"
            :required="value.spec.catalogType === REGISTRY_TYPE.NO_CATALOG"
          />
        </div>
        <div class="col span-3">
          <LabeledSelect
            v-model:value="selectedScanInterval"
            data-testid="registry-scanning-interval-select"
            :placeholder="t('imageScanner.registries.configuration.cru.scan.schedule.placeholder', { manualScan: t('imageScanner.registries.configuration.cru.scan.schedule.manualScan') })"
            :options="SCAN_INTERVAL_OPTIONS"
            option-key="value"
            option-label="label"
            :label="t('imageScanner.registries.configuration.cru.scan.schedule.label')"
            required
          />
        </div>
      </div>
      <div class="registry-input-label mt-24">
        {{ t('imageScanner.registries.configuration.cru.filters.label') }}
      </div>
      <div v-if="value.spec.platforms && value.spec.platforms.length > 0" class="row mb-5">
        <div class="col span-3">
          <label class="text-label">{{ t('imageScanner.registries.configuration.cru.filters.os') || 'OS' }}</label>
        </div>
        <div class="col span-3">
          <label class="text-label">{{ t('imageScanner.registries.configuration.cru.filters.arch') || 'Architecture' }}</label>
        </div>
        <div class="col span-3">
          <label class="text-label">{{ t('imageScanner.registries.configuration.cru.filters.variant') || 'Variable' }}</label>
        </div>
        <div class="col span-1"></div>
      </div>
      <div
          v-for="(platform, index) in value.spec.platforms"
          :key="index"
          class="row mb-10 align-center"
      >
        <div class="col span-3">
          <LabeledSelect
              v-model:value="platform.os"
              @update:value="updateOS(platform, $event)"
              :options="osOptions"
          />
        </div>

        <div class="col span-3">
          <LabeledSelect
              v-model:value="platform.arch"
              @update:value="updateArch(platform, $event)"
              :options="getArchOptions(platform.os)"
              :disabled="!platform.os"
          />
        </div>

        <div class="col span-3">
          <LabeledSelect
              v-model:value="platform.variant"
              :options="getVariantOptions(platform.arch)"
              :disabled="!isVariantSupported(platform.arch)"
          />
        </div>
        <div class="col span-1">
          <button
              v-if="!isView"
              type="button"
              class="btn role-link"
              style="padding: 0;"
              @click="removePlatform(index)"
          >
            {{ t('generic.remove') || 'Remove' }}
          </button>
        </div>
      </div>
      <div class="row mt-10">
        <div class="col span-12">
          <button
              v-if="!isView"
              type="button"
              class="btn btn-sm role-tertiary"
              @click="addPlatform"
          >
            {{ t('imageScanner.registries.configuration.cru.filters.add') }}
          </button>
        </div>
      </div>
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
.registry-input-label {
  margin-bottom: 16px;
  font-size: 16px;
  line-height: 20px;
  font-weight: 400;
  font-family: 'Lato', sans-serif;
  color: var(--disabled-text);
  display: block;
}
.mt-24 {
  margin-top: 24px;
}

.text-label {
  color: var(--input-label);
  font-size: 12px;
}
</style>
