import { shallowMount } from '@vue/test-utils';
import WorkloadTableSet from '../WorkloadTableSet.vue';

describe('WorkloadTableSet.vue (Vue 3)', () => {
  const workloadsMock = [
    {
      workloadName: 'nginx-deploy',
      type: 'Deployment',
      namespace: 'default',
      severity: {
        critical: 1,
        high: 0,
        medium: 0,
        low: 0,
        unknown: 0,
      },
    },
    {
      workloadName: 'api-pod',
      type: 'Pod',
      namespace: 'backend',
      severity: {
        critical: 0,
        high: 2,
        medium: 0,
        low: 0,
        unknown: 0,
      },
    },
  ];

  const factory = (props = {}) => {
    return shallowMount(WorkloadTableSet, {
      props: {
        workloads: workloadsMock,
        isInImageContext: false,
        ...props,
      },
      global: {
        mocks: {
          t: (key: string) => key,
        },
        stubs: {
          LabeledSelect: true,
          WorkloadTable: true,
        },
      },
    });
  };

  it('mounts successfully', () => {
    const wrapper = factory();
    expect(wrapper.exists()).toBe(true);
  });

  it('initializes filtered workloads correctly', async () => {
    const wrapper = factory();

    // Instead of fetch(), call updateFilteredImages directly
    wrapper.vm.updateFilteredImages();

    expect(wrapper.vm.cachedFilteredWorkloads.length).toBe(2);
  });

  it('filters by workload name search', async () => {
    const wrapper = factory();
    wrapper.vm.updateFilteredImages();

    await wrapper.setData({
      filters: {
        ...wrapper.vm.filters,
        workloadSearch: 'nginx',
      },
    });

    wrapper.vm.updateFilteredImages();

    expect(wrapper.vm.cachedFilteredWorkloads.length).toBe(1);
    expect(wrapper.vm.cachedFilteredWorkloads[0].workloadName).toBe('nginx-deploy');
  });

  it('filters by type', async () => {
    const wrapper = factory();
    wrapper.vm.updateFilteredImages();

    await wrapper.setData({
      filters: {
        ...wrapper.vm.filters,
        type: 'Pod',
      },
    });

    wrapper.vm.updateFilteredImages();

    expect(wrapper.vm.cachedFilteredWorkloads.length).toBe(1);
    expect(wrapper.vm.cachedFilteredWorkloads[0].type).toBe('Pod');
  });

  it('filters by namespace', async () => {
    const wrapper = factory();
    wrapper.vm.updateFilteredImages();

    await wrapper.setData({
      filters: {
        ...wrapper.vm.filters,
        namespace: 'backend',
      },
    });

    wrapper.vm.updateFilteredImages();

    expect(wrapper.vm.cachedFilteredWorkloads.length).toBe(1);
    expect(wrapper.vm.cachedFilteredWorkloads[0].namespace).toBe('backend');
  });

  it('filters by severity (Critical)', async () => {
    const wrapper = factory();
    wrapper.vm.updateFilteredImages();

    await wrapper.setData({
      filters: {
        ...wrapper.vm.filters,
        severity: 'Critical',
      },
    });

    wrapper.vm.updateFilteredImages();

    expect(wrapper.vm.cachedFilteredWorkloads.length).toBe(1);
    expect(wrapper.vm.cachedFilteredWorkloads[0].severity.critical).toBe(1);
  });

  it('filters by severity (High)', async () => {
    const wrapper = factory();
    wrapper.vm.updateFilteredImages();

    await wrapper.setData({
      filters: {
        ...wrapper.vm.filters,
        severity: 'High',
      },
    });

    wrapper.vm.updateFilteredImages();

    expect(wrapper.vm.cachedFilteredWorkloads.length).toBe(1);
    expect(wrapper.vm.cachedFilteredWorkloads[0].severity.high).toBe(2);
  });

  it('updates when workloads prop changes', async () => {
    const wrapper = factory();
    wrapper.vm.updateFilteredImages();

    await wrapper.setProps({
      workloads: [workloadsMock[0]],
    });

    wrapper.vm.updateFilteredImages();

    expect(wrapper.vm.cachedFilteredWorkloads.length).toBe(1);
  });

  it('updates when filters change', async () => {
    const wrapper = factory();
    wrapper.vm.updateFilteredImages();

    await wrapper.setData({
      filters: {
        ...wrapper.vm.filters,
        workloadSearch: 'api',
      },
    });

    wrapper.vm.updateFilteredImages();

    expect(wrapper.vm.cachedFilteredWorkloads.length).toBe(1);
    expect(wrapper.vm.cachedFilteredWorkloads[0].workloadName).toBe('api-pod');
  });

  it('filterBySeverity sets filter severity correctly', async () => {
    const wrapper = factory();

    wrapper.vm.severity = 'Critical';
    wrapper.vm.filterBySeverity();

    expect(wrapper.vm.filters.severity).toBe('Critical');
  });
});
