import { shallowMount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import WorkloadTableSet from '../WorkloadTableSet.vue';

describe('WorkloadTableSet.vue', () => {
  const workloadsMock = [
    {
      workloadName: 'nginx-deploy',
      type:         'Deployment',
      namespace:    'default',
      severity:     {
        critical: 1,
        high:     0,
        medium:   0,
        low:      0,
        unknown:  0,
      },
    },
    {
      workloadName: 'api-pod',
      type:         'Pod',
      namespace:    'backend',
      severity:     {
        critical: 0,
        high:     2,
        medium:   1,
        low:      0,
        unknown:  0,
      },
    },
    {
      workloadName: 'cache-service',
      type:         'StatefulSet',
      namespace:    'default',
      severity:     {
        critical: 0,
        high:     0,
        medium:   3,
        low:      1,
        unknown:  0,
      },
    },
  ];

  const createMockStore = (namespaces = { default: true, backend: true }) => ({
    getters: {
      'activeNamespaceCache': namespaces,
    },
  });

  const factory = (props = {}, storeData = { default: true, backend: true }) => {
    return shallowMount(WorkloadTableSet, {
      props: {
        workloads:       workloadsMock,
        isInImageContext: false,
        ...props,
      },
      global: {
        mocks: {
          t:      (key: string) => key,
          $store: createMockStore(storeData),
        },
        stubs: {
          LabeledSelect: true,
          WorkloadTable: true,
        },
      },
    });
  };

  describe('Component Lifecycle', () => {
    it('mounts successfully', () => {
      const wrapper = factory();
      expect(wrapper.exists()).toBe(true);
    });

    it('initializes data correctly', () => {
      const wrapper = factory();
      expect(wrapper.vm.cachedFilteredWorkloads).toEqual([]);
      expect(wrapper.vm.filters.workloadSearch).toBe('');
      expect(wrapper.vm.filters.type).toBe('any');
      expect(wrapper.vm.filters.severity).toBe('any');
    });

    it('initializes filterSeverityOptions with correct labels', () => {
      const wrapper = factory();
      expect(wrapper.vm.filterSeverityOptions).toHaveLength(6);
      expect(wrapper.vm.filterSeverityOptions[0].value).toBe('any');
      expect(wrapper.vm.filterSeverityOptions[1].value).toBe('Critical');
    });
  });

  describe('Filtering by Workload Name', () => {
    it('filters by workload name search - partial match', async () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();

      wrapper.vm.filters.workloadSearch = 'nginx';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);
      expect(wrapper.vm.cachedFilteredWorkloads[0].workloadName).toBe('nginx-deploy');
    });

    it('filters by workload name search - case insensitive', async () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();

      wrapper.vm.filters.workloadSearch = 'API-POD';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);
      expect(wrapper.vm.cachedFilteredWorkloads[0].workloadName).toBe('api-pod');
    });

    it('filters by workload name search - empty search returns all', async () => {
      const wrapper = factory();
      wrapper.vm.filters.workloadSearch = 'nginx';
      wrapper.vm.updateFilteredImages();
      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);

      wrapper.vm.filters.workloadSearch = '';
      wrapper.vm.updateFilteredImages();
      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(3);
    });

    it('filters by workload name search - no matches', async () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();

      wrapper.vm.filters.workloadSearch = 'nonexistent';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(0);
    });

    it('handles input with whitespace only', async () => {
      const wrapper = factory();
      wrapper.vm.filters.workloadSearch = '   ';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(3);
    });
  });

  describe('Filtering by Type', () => {
    it('filters by type - single match', async () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();

      wrapper.vm.filters.type = 'Pod';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);
      expect(wrapper.vm.cachedFilteredWorkloads[0].type).toBe('Pod');
    });

    it('filters by type - multiple matches', async () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();

      wrapper.vm.filters.type = 'Deployment';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);
      expect(wrapper.vm.cachedFilteredWorkloads[0].type).toBe('Deployment');
    });

    it('filters by type - any returns all', async () => {
      const wrapper = factory();
      wrapper.vm.filters.type = 'Pod';
      wrapper.vm.updateFilteredImages();
      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);

      wrapper.vm.filters.type = 'any';
      wrapper.vm.updateFilteredImages();
      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(3);
    });
  });

  describe('Filtering by Namespace', () => {
    it('filters by activeNamespaceCache - single namespace', async () => {
      const wrapper = factory({}, { default: true });
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(2);
      expect(wrapper.vm.cachedFilteredWorkloads.every((w) => w.namespace === 'default')).toBe(true);
    });

    it('filters by activeNamespaceCache - multiple namespaces', async () => {
      const wrapper = factory({}, { default: true, backend: true });
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(3);
    });

    it('filters by activeNamespaceCache - empty namespace cache', async () => {
      const wrapper = factory({}, {});
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(0);
    });

    it('filters by activeNamespaceCache - excludes non-selected namespaces', async () => {
      const wrapper = factory({}, { default: true });
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads.some((w) => w.namespace === 'backend')).toBe(false);
    });
  });

  describe('Filtering by Severity', () => {
    it('filters by severity - Critical', async () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();

      wrapper.vm.filters.severity = 'Critical';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);
      expect(wrapper.vm.cachedFilteredWorkloads[0].workloadName).toBe('nginx-deploy');
    });

    it('filters by severity - High', async () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();

      wrapper.vm.filters.severity = 'High';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);
      expect(wrapper.vm.cachedFilteredWorkloads[0].workloadName).toBe('api-pod');
    });

    it('filters by severity - Medium', async () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();

      wrapper.vm.filters.severity = 'Medium';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);
      expect(wrapper.vm.cachedFilteredWorkloads[0].workloadName).toBe('cache-service');
    });

    it('filters by severity - Low', async () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();

      wrapper.vm.filters.severity = 'Low';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(0);
    });

    it('filters by severity - any returns all', async () => {
      const wrapper = factory();
      wrapper.vm.filters.severity = 'Critical';
      wrapper.vm.updateFilteredImages();
      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);

      wrapper.vm.filters.severity = 'any';
      wrapper.vm.updateFilteredImages();
      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(3);
    });

    it('filters by severity - no matches', async () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();

      wrapper.vm.filters.severity = 'Unknown';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(0);
    });
  });

  describe('Combined Filtering', () => {
    it('applies multiple filters - workload name + type', async () => {
      const wrapper = factory();
      wrapper.vm.filters.workloadSearch = 'deploy';
      wrapper.vm.filters.type = 'Deployment';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);
      expect(wrapper.vm.cachedFilteredWorkloads[0].workloadName).toBe('nginx-deploy');
    });

    it('applies multiple filters - name + severity', async () => {
      const wrapper = factory();
      wrapper.vm.filters.workloadSearch = 'api';
      wrapper.vm.filters.severity = 'High';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);
      expect(wrapper.vm.cachedFilteredWorkloads[0].workloadName).toBe('api-pod');
    });

    it('applies multiple filters - type + severity + namespace', async () => {
      const wrapper = factory({}, { default: true });
      wrapper.vm.filters.type = 'Deployment';
      wrapper.vm.filters.severity = 'Critical';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);
      expect(wrapper.vm.cachedFilteredWorkloads[0].workloadName).toBe('nginx-deploy');
    });

    it('applies all filters together with no matches', async () => {
      const wrapper = factory();
      wrapper.vm.filters.workloadSearch = 'nginx';
      wrapper.vm.filters.type = 'Pod';
      wrapper.vm.filters.severity = 'Critical';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(0);
    });
  });

  describe('Watch Handlers', () => {
    it('watches workloads prop and updates filtered results', async () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();
      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(3);

      const newWorkloads = [workloadsMock[0]];
      await wrapper.setProps({ workloads: newWorkloads });
      await nextTick();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);
    });

    it('watches filters and updates filtered results', async () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();

      wrapper.vm.filters.workloadSearch = 'nginx';
      await nextTick();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);
    });

    it('watches globalNamespace and updates filtered results', async () => {
      const mockStore = createMockStore({ default: true, backend: true });
      const wrapper = shallowMount(WorkloadTableSet, {
        props: {
          workloads:       workloadsMock,
          isInImageContext: false,
        },
        global: {
          mocks: {
            t:      (key: string) => key,
            $store: mockStore,
          },
          stubs: {
            LabeledSelect: true,
            WorkloadTable: true,
          },
        },
      });

      wrapper.vm.updateFilteredImages();
      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(3);

      mockStore.getters['activeNamespaceCache'] = { default: true };
      wrapper.vm.$store = createMockStore({ default: true });
      await nextTick();
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(2);
    });
  });

  describe('Computed Properties', () => {
    it('computes globalNamespace from store getter', () => {
      const wrapper = factory({}, { default: true, backend: true });
      expect(wrapper.vm.globalNamespace).toEqual({ default: true, backend: true });
    });

    it('computes globalNamespace with single namespace getter', () => {
      const wrapper = factory({}, { default: true });
      expect(wrapper.vm.globalNamespace).toEqual({ default: true });
    });
  });

  describe('filterBySeverity Method', () => {
    it('filterBySeverity sets filter severity correctly', async() => {
      const wrapper = factory();
      await wrapper.setProps({ severity: 'Critical' });
      wrapper.vm.filterBySeverity();

      expect(wrapper.vm.filters.severity).toBe('Critical');
    });

    it('filterBySeverity updates cached filtered workloads', async () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();
      expect(wrapper.vm.cachedFilteredWorkloads.length).toBeGreaterThan(0);

      await wrapper.setProps({ severity: 'Critical' });
      wrapper.vm.filterBySeverity();
      wrapper.vm.updateFilteredImages();
      await nextTick();

      expect(wrapper.vm.filters.severity).toBe('Critical');
    });

    it('filterBySeverity handles undefined severity', async() => {
      const wrapper = factory();
      await wrapper.setProps({ severity: undefined });
      wrapper.vm.filterBySeverity();

      expect(wrapper.vm.filters.severity).toBe('any');
    });
  });

  describe('updateFilteredImages Method', () => {
    it('initializes cachedFilteredWorkloads correctly', () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(3);
    });

    it('updates cachedFilteredWorkloads when filters change', () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();
      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(3);

      wrapper.vm.filters.workloadSearch = 'nginx';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(1);
    });

    it('does not mutate original workloads array', () => {
      const originalWorkloadsLength = workloadsMock.length;
      const wrapper = factory();
      wrapper.vm.filters.workloadSearch = 'nginx';
      wrapper.vm.updateFilteredImages();

      expect(workloadsMock).toHaveLength(originalWorkloadsLength);
    });

    it('handles empty workloads array', () => {
      const wrapper = shallowMount(WorkloadTableSet, {
        props: {
          workloads:       [],
          isInImageContext: false,
        },
        global: {
          mocks: {
            t:      (key: string) => key,
            $store: createMockStore(),
          },
          stubs: {
            LabeledSelect: true,
            WorkloadTable: true,
          },
        },
      });

      wrapper.vm.updateFilteredImages();
      expect(wrapper.vm.cachedFilteredWorkloads).toEqual([]);
    });

    it('handles workload with missing severity object gracefully', () => {
      const incompleteWorkload = [
        {
          workloadName: 'incomplete',
          type:         'Deployment',
          namespace:    'default',
        },
      ];

      const wrapper = shallowMount(WorkloadTableSet, {
        props: {
          workloads:       incompleteWorkload,
          isInImageContext: false,
        },
        global: {
          mocks: {
            t:      (key: string) => key,
            $store: createMockStore(),
          },
          stubs: {
            LabeledSelect: true,
            WorkloadTable: true,
          },
        },
      });

      expect(() => {
        wrapper.vm.updateFilteredImages();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles workload with zero severity values', () => {
      const zeroSeverityWorkload = [
        {
          workloadName: 'safe',
          type:         'Pod',
          namespace:    'default',
          severity:     {
            critical: 0,
            high:     0,
            medium:   0,
            low:      0,
            unknown:  0,
          },
        },
      ];

      const wrapper = shallowMount(WorkloadTableSet, {
        props: {
          workloads:       zeroSeverityWorkload,
          isInImageContext: false,
        },
        global: {
          mocks: {
            t:      (key: string) => key,
            $store: createMockStore(),
          },
          stubs: {
            LabeledSelect: true,
            WorkloadTable: true,
          },
        },
      });

      wrapper.vm.filters.severity = 'Critical';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(0);
    });

    it('handles special characters in workload name search', () => {
      const wrapper = factory();
      wrapper.vm.updateFilteredImages();
      expect(wrapper.vm.cachedFilteredWorkloads.length).toBeGreaterThan(0);

      wrapper.vm.filters.workloadSearch = 'nginx-*.deploy';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(0);
    });

    it('clears filters correctly', () => {
      const wrapper = factory();
      wrapper.vm.filters.workloadSearch = 'nginx';
      wrapper.vm.filters.type = 'Deployment';
      wrapper.vm.filters.severity = 'Critical';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads.length).toBeGreaterThan(0);

      wrapper.vm.filters.workloadSearch = '';
      wrapper.vm.filters.type = 'any';
      wrapper.vm.filters.severity = 'any';
      wrapper.vm.updateFilteredImages();

      expect(wrapper.vm.cachedFilteredWorkloads).toHaveLength(3);
    });
  });

  describe('Props', () => {
    it('accepts imageName prop', () => {
      const wrapper = factory({ imageName: 'test-image' });
      expect(wrapper.props('imageName')).toBe('test-image');
    });

    it('accepts currentImage prop', () => {
      const image = { name: 'test' };
      const wrapper = factory({ currentImage: image });
      expect(wrapper.props('currentImage')).toEqual(image);
    });

    it('accepts isInImageContext prop', () => {
      const wrapper = factory({ isInImageContext: true });
      expect(wrapper.props('isInImageContext')).toBe(true);
    });
  });
});
