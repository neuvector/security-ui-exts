import { shallowMount } from '@vue/test-utils';
import CruWorkloadScanConfiguration from '../sbomscanner.kubewarden.io.workloadscanconfiguration.vue';
import { SCAN_INTERVALS } from '@sbomscanner-ui-ext/constants';

// 1. Properly mock the Mixin as an ES Module so Vue recognizes the 'value' prop
jest.mock('@shell/mixins/create-edit-view', () => ({
  __esModule: true,
  default: {
    props: {
      mode: { type: String, default: 'edit' },
      value: { type: Object, required: true }
    },
    computed: {
      isCreate() {
        return this.mode === 'create';
      },
      isView() {
        return this.mode === 'view';
      }
    },
    methods: {
      save: jest.fn().mockResolvedValue(true),
      done: jest.fn()
    }
  }
}));

describe('CruWorkloadScanConfiguration.vue', () => {
  let wrapper;
  let mockDispatch;
  let mockGetters;

  const createWrapper = (valueOverrides = {}, mode = 'edit') => {
    mockDispatch = jest.fn().mockResolvedValue([]);

    mockGetters = {
      'currentProduct': { inStore: 'cluster' },
      // Mock the getter that returns a function for namespaces and secrets
      'cluster/all': jest.fn((type) => {
        if (type === 'namespace') return [{ id: 'default' }, { id: 'cattle-sbomscanner-system' }];
        if (type === 'secret') return [];
        return [];
      }),
      'i18n/t': (key) => key, // Return the translation key as a simple string
    };

    const baseValue = {
      metadata: { name: 'default' },
      spec: {
        enabled: true,
        scanOnChange: true,
        artifactsNamespace: '',
        namespaceSelector: {},
        authSecret: '',
        caBundle: '',
        insecure: false,
        platforms: [],
        scanInterval: '3h',
        ...valueOverrides
      }
    };

    return shallowMount(CruWorkloadScanConfiguration, {
      // Pass props properly
      props: {
        value: baseValue,
        mode: mode,
      },
      // 2. In Vue 3 / VTU v2, ALL mocks and stubs MUST be inside `global`
      global: {
        mocks: {
          $store: {
            dispatch: mockDispatch,
            getters: mockGetters
          },
          $route: { params: { cluster: 'local' } },
          t: (key) => key, // Provide simple mock translation for the component
        },
        stubs: {
          CruResource: { template: '<div><slot></slot><slot name="form-footer"></slot></div>' },
          LabeledSelect: true,
          LabeledInput: true,
          Checkbox: true,
          MatchExpressions: true,
          Banner: true,
          FileSelector: true
        }
      }
    });
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('renders correctly and initializes default data', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.value.spec.enabled).toBe(true);
      expect(wrapper.vm.value.spec.scanInterval).toBe('3h');
      expect(wrapper.vm.value.spec.artifactsNamespace).toBe('cattle-sbomscanner-system');
    });

    it('fetches namespaces and secrets on fetch() hook', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', { type: 'secret' });
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', { type: 'namespace' });
    });
  });

  describe('Computed Properties', () => {
    describe('isArtifactsNamespaceLocked', () => {
      it('returns true when mode is edit', () => {
        wrapper = createWrapper({}, 'edit');
        expect(wrapper.vm.isArtifactsNamespaceLocked).toBe(true);
      });

      it('returns false when mode is create', () => {
        wrapper = createWrapper({}, 'create');
        expect(wrapper.vm.isArtifactsNamespaceLocked).toBe(false);
      });
    });

    describe('artifactsNamespaceTooltipText', () => {
      it('returns locked tooltip translation when locked (edit mode)', () => {
        wrapper = createWrapper({}, 'edit');
        expect(wrapper.vm.artifactsNamespaceTooltipText).toBe('imageScanner.workloads.configuration.cru.general.artifactsNamespaceLockedTooltip');
      });

      it('returns general tooltip translation when not locked (create mode)', () => {
        wrapper = createWrapper({}, 'create');
        expect(wrapper.vm.artifactsNamespaceTooltipText).toBe('imageScanner.workloads.configuration.cru.general.artifactsNamespaceTooltip');
      });
    });
  });

  describe('Validation', () => {
    it('passes validation when a valid secret is selected or left blank', () => {
      wrapper = createWrapper({ authSecret: 'my-secret' });
      expect(wrapper.vm.validationPassed).toBe(true);

      wrapper = createWrapper({ authSecret: '' });
      expect(wrapper.vm.validationPassed).toBe(true);
    });

    it('fails validation when authSecret is set to "create" (placeholder)', () => {
      wrapper = createWrapper({ authSecret: 'create' });
      expect(wrapper.vm.validationPassed).toBe(false);
    });
  });

  describe('Platform Management', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('adds a new default platform when addPlatform is called', () => {
      expect(wrapper.vm.value.spec.platforms.length).toBe(0);
      wrapper.vm.addPlatform();
      expect(wrapper.vm.value.spec.platforms.length).toBe(1);
      expect(wrapper.vm.value.spec.platforms[0]).toEqual({ os: 'linux', arch: 'amd64', variant: '' });
    });

    it('removes a platform when removePlatform is called', () => {
      wrapper.vm.addPlatform();
      wrapper.vm.addPlatform();
      expect(wrapper.vm.value.spec.platforms.length).toBe(2);

      wrapper.vm.removePlatform(0);
      expect(wrapper.vm.value.spec.platforms.length).toBe(1);
    });

    it('updates OS and gracefully resets arch and variant', () => {
      const platform = { os: 'linux', arch: 'amd64', variant: '' };
      wrapper.vm.updateOS(platform, 'darwin');

      expect(platform.os).toBe('darwin');
      expect(platform.arch).toBe('amd64'); // Default fallback for darwin
      expect(platform.variant).toBe('');
    });

    it('cleans duplicate and invalid platforms on save', () => {
      wrapper.vm.value.spec.platforms = [
        { os: 'linux', arch: 'amd64' },
        { os: 'linux', arch: 'amd64' }, // Duplicate
        { os: '', arch: 'amd64' }       // Invalid
      ];

      wrapper.vm.cleanPlatforms();
      expect(wrapper.vm.value.spec.platforms.length).toBe(1);
      expect(wrapper.vm.value.spec.platforms[0]).toEqual({ os: 'linux', arch: 'amd64' });
    });
  });

  describe('Namespace Selector Management', () => {
    it('removes namespaceSelector entirely if matchExpressions is empty', () => {
      wrapper = createWrapper({ namespaceSelector: { matchExpressions: [] } });
      wrapper.vm.cleanNamespaceSelector();

      expect(wrapper.vm.value.spec.namespaceSelector).toBeUndefined();
    });

    it('filters out invalid and duplicate match expressions', () => {
      wrapper = createWrapper({
        namespaceSelector: {
          matchExpressions: [
            { key: 'env', operator: 'In', values: ['prod', 'dev'] },
            { key: 'env', operator: 'In', values: ['dev', 'prod'] }, // Duplicate (different array order)
            { key: '', operator: 'Exists' } // Invalid (no key)
          ]
        }
      });

      wrapper.vm.cleanNamespaceSelector();

      const cleaned = wrapper.vm.value.spec.namespaceSelector.matchExpressions;
      expect(cleaned.length).toBe(1);
      expect(cleaned[0].key).toBe('env');
    });
  });

  describe('finish (Save logic)', () => {
    it('cleans data and calls save', async () => {
      wrapper = createWrapper();

      jest.spyOn(wrapper.vm, 'cleanPlatforms');
      jest.spyOn(wrapper.vm, 'cleanNamespaceSelector');

      // FIX: Explicitly mock save on the instance to bypass Vue's method binding
      wrapper.vm.save = jest.fn().mockResolvedValue(true);

      const preventDefault = jest.fn();

      await wrapper.vm.finish({ preventDefault });

      expect(preventDefault).toHaveBeenCalled();
      expect(wrapper.vm.cleanPlatforms).toHaveBeenCalled();
      expect(wrapper.vm.cleanNamespaceSelector).toHaveBeenCalled();

      // Now Jest will properly recognize this as a mock!
      expect(wrapper.vm.save).toHaveBeenCalled();

      expect(mockDispatch).toHaveBeenCalledWith(
        'growl/success',
        {
          title: 'imageScanner.general.saved',
          message: 'imageScanner.workloads.configuration.cru.general.successMessage'
        },
        { root: true }
      );
    });

    it('deletes scanInterval if it is set to MANUAL', async () => {
      wrapper = createWrapper({ scanInterval: SCAN_INTERVALS.MANUAL });

      await wrapper.vm.finish();

      expect(wrapper.vm.value.spec.scanInterval).toBeUndefined();
    });

    it('handles save errors gracefully', async () => {
      wrapper = createWrapper();

      wrapper.vm.save = jest.fn().mockRejectedValue(new Error('Save failed'));

      await wrapper.vm.finish();

      expect(wrapper.vm.errors).toEqual([new Error('Save failed')]);
      expect(wrapper.vm.saveLoading).toBe(false);
    });
  });
});