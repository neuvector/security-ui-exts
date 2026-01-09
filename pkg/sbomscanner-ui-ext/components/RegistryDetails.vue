<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="registry-details">
    <div class="about">
      <div class="header">
        <div class="resource-header">
          <h1
            class="resource-header-name-state"
            style="margin-bottom: 4px;"
          >
            <RouterLink
              class="resource-link"
              :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${PAGE.REGISTRIES}`"
            >
              {{ t('imageScanner.registries.title') }}:
            </RouterLink>
            <span class="resource-header-name">
              {{ $route.params.id }}
            </span>
            <StatusBadge
              style="margin-left: 12px; margin-top: 6px;"
              :status="registry?.scanRec.currStatus"
            />
          </h1>
          <span class="resource-header-description">
            {{ t('imageScanner.registries.detail.description') }}
          </span>
        </div>
        <div class="resource-header-actions">
          <ScanButton
            v-if="canEdit"
            :selected-registries="[{name: $route.params.id, namespace: $route.params.ns, currStatus: registry?.scanRec.currStatus}]"
            :reload-fn="loadData"
          />
          <ActionMenu
            v-if="registry"
            button-role="multiAction"
            :resource="registry"
            data-testid="masthead-action-menu"
            :button-aria-label="t('component.resource.detail.titleBar.ariaLabel.actionMenu', { resource: RESOURCE.REGISTRY })"
          />
        </div>
      </div>
      <RegistryDetailsMeta :properties="registryMetadata" />
    </div>
    <RegistryDetailScanTable :scan-history="scanHistory" />
  </div>
</template>

<script>
import { PRODUCT_NAME, RESOURCE, PAGE } from '@sbomscanner-ui-ext/types';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import Loading from '@shell/components/Loading';
import RegistryDetailsMeta from './common/RegistryDetailsMeta.vue';
import StatusBadge from './common/StatusBadge.vue';
import RegistryDetailScanTable from './RegistryDetailScanTable.vue';
import ScanButton from './common/ScanButton.vue';
import { getPermissions } from '@sbomscanner-ui-ext/utils/permissions';
import { trimIntervalSuffix } from '@sbomscanner-ui-ext/utils/app';

export default {
  name:       'RegistryDetails',
  components: {
    RegistryDetailsMeta,
    StatusBadge,
    RegistryDetailScanTable,
    ScanButton,
    ActionMenu,
    Loading,
  },
  data() {
    return {
      PRODUCT_NAME,
      RESOURCE,
      PAGE,
      registry:         null,
      registryMetadata: [],
      scanHistory:      [],
      canEdit:          getPermissions(this.$store.getters).canEdit,
    };
  },
  async fetch() {
    await this.loadData();
  },
  computed: {
    scanInterval() {
      return trimIntervalSuffix(this.registry.spec.scanInterval);
    }
  },
  methods: {
    async loadData() {
      this.registry = await this.$store.dispatch('cluster/find', { type: RESOURCE.REGISTRY, id: `${ this.$route.params.ns }/${ this.$route.params.id }` });
      this.scanHistory = (await this.$store.dispatch('cluster/findAll', { type: RESOURCE.SCAN_JOB })).filter((rec) => {
        return rec.spec.registry === this.registry.metadata.name;
      });

      /*
      Simulate matchConditions for demo purposes
      In real implementation, matchConditions should come from backend API
      */
      this.registry.spec.repositories = this.registry.spec.repositories?.map((repo) => {
        if (repo.name === 'library/alpine') {
          return {
            name:            repo.name,
            matchConditions: [
              {
                name:       'tags greater than v1.12.0',
                expression: '"semver(tag, true).isGreaterThan(semver(\'v1.12.0\'))"',
              },
            ],
          };
        } else {
          return { name: repo.name };
        }
      }) || [];
      /*
      End simulate matchConditions
      */

      this.registryMetadata = {
        namespace: {
          label: this.t('imageScanner.registries.configuration.meta.namespace'),
          value: this.registry.metadata.namespace,
        },
        uri: {
          label: this.t('imageScanner.registries.configuration.meta.uri'),
          value: this.registry.spec.uri,
        },
        schedule: {
          label: this.t('imageScanner.registries.configuration.meta.schedule'),
          value: this.registry.spec.scanInterval ? this.t('imageScanner.general.schedule', { i: this.scanInterval }) : '',
        },
        repositories: {
          label: this.t('imageScanner.registries.configuration.meta.repositories'),
          value: this.registry.spec.repositories?.length || 0,
          list:  this.registry.spec.repositories || [],
        },
        platforms: {
          label: this.t('imageScanner.registries.configuration.meta.platforms'),
          value: this.registry.spec.platforms?.length || 0,
          list:  this.registry.spec.platforms || [],
        },
      };
    },
  },
};
</script>

<style lang="scss" scoped>
  .btn {
    padding: 0 16px;
    gap: 12px;
  }

  .registry-details {
    display: flex;
    padding: 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
    flex: 1 0 0;
    align-self: stretch;
  }

  .about {
    /* layout */
    display: flex;
    padding-bottom: 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    align-self: stretch;
    /* style */
    border-bottom: dashed var(--border-width) var(--input-border);

    .header {
      /* layout */
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      align-self: stretch;
      /* style */
      border-radius: 6px;
      min-width: 740px;

      .resource-header {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: 4px;
        flex: 1 0 0;
        max-width: calc(100% - 350px);

        .resource-header-name-state {
          display: flex;
          align-items: center;
          max-width: 100%;

          .resource-header-name {
            display: inline-block;
            flex: 1;
            white-space: nowrap;
            overflow-x: hidden;
            overflow-y: clip;
            text-overflow: ellipsis;
            margin-left: 4px;
          }
        }

        .resource-header-description {
          /* layout */
          display: flex;
          max-width: 900px;
          height: 21px;
          flex-direction: column;
          justify-content: center;
          /* typography */
          overflow: hidden;
          color: var(--disabled-text);
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: Lato;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 21px; /* 150% */
        }
      }

      .resource-header-actions {
        display: flex;
        align-items: center;
        gap: 16px;

        &:deep() button[data-testid="masthead-action-menu"] {
          border-radius: 4px;
          width: 35px;
          height: 40px;

          display: inline-flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
        }
      }
    }
  }
</style>
