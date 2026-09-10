<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import SortableTable from '@shell/components/SortableTable';
import RcButton from '@components/RcButton/RcButton.vue';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import type { ViolationRecord } from '@runtime-enforcer/types';

const props = defineProps<{
  policy: any;
  violations?: ViolationRecord[];
  imageMap?: Record<string, string>;
}>();

const store = useStore();
const { t } = useI18n(store);

const selectedRows = ref<any[]>([]);

const rows = ref<any[]>([]);

watchEffect(() => {
  const violations = props.violations || [];

  rows.value = violations.map((violation, index) => {
    const containerName = violation.containerName || '';
    const executablePath = violation.executablePath || '';

    return {
      id:                     `${ containerName }-${ executablePath }-${ index }`,
      executable:             executablePath || '-',
      occurrences:            violation.occurrences ?? '-',
      container:              containerName || '-',
      image:                  props.imageMap?.[containerName] || '',
      node:                   violation.nodeName || '-',
      lastObservedTimestamp:  violation.lastObservedTimestamp,
      firstObservedTimestamp: violation.firstObservedTimestamp,
      containerName,
      executablePath,
    };
  });
});

const headers = computed(() => [
  {
    name:  'executable',
    value: 'executable',
    label: t('runtimeEnforcer.activePolicy.violations.table.executable'),
    sort:  'executable',
    width: 260,
  },
  {
    name:  'occurrences',
    value: 'occurrences',
    label: t('runtimeEnforcer.activePolicy.violations.table.occurrences'),
    sort:  'occurrences',
    width: 100,
  },
  {
    name:  'container',
    value: 'container',
    label: t('runtimeEnforcer.activePolicy.violations.table.container'),
    sort:  'container',
    width: 150,
  },
  {
    name:  'image',
    value: 'image',
    label: t('runtimeEnforcer.activePolicy.violations.table.image'),
    sort:  'image',
    width: 170,
  },
  {
    name:  'node',
    value: 'node',
    label: t('runtimeEnforcer.activePolicy.violations.table.node'),
    sort:  'node',
    width: 120,
  },
  {
    name:  'lastObservedTimestamp',
    value: 'lastObservedTimestamp',
    label: t('runtimeEnforcer.activePolicy.violations.table.lastOccurrence'),
    sort:  'lastObservedTimestamp',
    width: 140,
  },
  {
    name:  'firstObservedTimestamp',
    value: 'firstObservedTimestamp',
    label: t('runtimeEnforcer.activePolicy.violations.table.age'),
    sort:  'firstObservedTimestamp',
    width: 90,
  },
  {
    name:  'allow',
    value: 'allow',
    label: ' ',
    sort:  false,
    width: 140,
  },
]);

function onSelectionChange(selected: any[]) {
  selectedRows.value = selected || [];
}

function allowExecutable(row: any) {
  props.policy.allowExecutables([row]);
}

function allowSelected() {
  if (!selectedRows.value.length) {
    return;
  }

  props.policy.allowExecutables(selectedRows.value);
}
</script>

<template>
  <SortableTable
      key-field="id"
      :rows="rows"
      :headers="headers"
      :table-actions="true"
      :row-actions="false"
      :search="true"
      :search-fields="['executable', 'container', 'node']"
      :paging="false"
      @selection="onSelectionChange"
  >
    <template #header-left>
      <div class="table-top-left">
        <RcButton
            variant="primary"
            size="medium"
            :disabled="!selectedRows.length"
            @click="allowSelected"
        >
          <i class="icon icon-plus"></i>
          {{ t('runtimeEnforcer.activePolicy.violations.allow') }}
        </RcButton>
        <span
            v-if="selectedRows.length"
            class="selected-count"
        >
          {{ selectedRows.length }} {{ t('runtimeEnforcer.activePolicy.violations.selectedCount') }}
        </span>
      </div>
    </template>

    <template #col:executable="{ row }">
      <td>
        <span class="executable-pill">
          {{ row.executable }}
        </span>
      </td>
    </template>

    <template #col:image="{ row }">
      <td>
        <span v-if="row.image">image: {{ row.image }}</span>
        <span v-else class="text-muted">-</span>
      </td>
    </template>

    <template #col:lastObservedTimestamp="{ row }">
      <td>
        <LiveDate
            v-if="row.lastObservedTimestamp"
            :value="row.lastObservedTimestamp"
            add-suffix
        />
        <span v-else class="text-muted">-</span>
      </td>
    </template>

    <template #col:firstObservedTimestamp="{ row }">
      <td>
        <LiveDate
            v-if="row.firstObservedTimestamp"
            :value="row.firstObservedTimestamp"
        />
        <span v-else class="text-muted">-</span>
      </td>
    </template>

    <template #col:allow="{ row }">
      <td class="allow-col">
        <RcButton
            variant="secondary"
            @click="allowExecutable(row)"
        >
          <i class="icon icon-plus"></i>
          {{ t('runtimeEnforcer.activePolicy.violations.allow') }}
        </RcButton>
      </td>
    </template>
  </SortableTable>
</template>

<style lang="scss" scoped>
.executable-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--tag-bg);
  color: var(--tag-primary);
  font-size: 13px;
  font-family: monospace;
}

.table-top-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  color: var(--body-text);
}

.allow-col {
  text-align: right;
}
</style>
