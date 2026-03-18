import { shallowMount } from '@vue/test-utils';
import CruWorkloadScanConfiguration from '../sbomscanner.kubewarden.io.workloadscanconfiguration.vue';
import { SCAN_INTERVALS } from '@sbomscanner-ui-ext/constants';
import { SECRET_TYPES } from '@shell/config/secret';

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
    mockDispatch = jest.fn((action, payload) => {
      // Safely handle the app fetch to dynamically determine the installation namespace
      if (action === 'cluster/findAll' && payload?.type === 'catalog.cattle.io.app') {
        return Promise.resolve([
          { spec: { name: 'rancher-sbomscanner' }, metadata: { namespace: 'custom-sbom-namespace' } }
        ]);
      }
      return Promise.resolve([]);
    });

    mockGetters = {
      'currentProduct': { inStore: 'cluster' },
      'cluster/all': jest.fn((type) => {
        if (type === 'namespace') return [{ id: 'default' }, { id: 'cattle-sbomscanner-system' }];
        if (type === 'secret') return [];
        return [];
      }),
      'i18n/t': (key) => key,
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
      props: {
        value: baseValue,
        mode: mode,
      },
      global: {
        mocks: {
          $store: {
            dispatch: mockDispatch,
            getters: mockGetters
          },
          $route: { params: { cluster: 'local' } },
          t: (key) => key,
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

  describe('Initialization and State', () => {
    it('renders correctly and captures initial savedEnabledState', () => {
      wrapper = createWrapper({ enabled: true });
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.savedEnabledState).toBe(true);
    });

    it('does not change savedEnabledState when the checkbox is toggled', async () => {
      wrapper = createWrapper({ enabled: true });

      expect(wrapper.vm.savedEnabledState).toBe(true);

      // Simulate user unchecking the box
      wrapper.vm.value.spec.enabled = false;
      await wrapper.vm.$nextTick();

      // The state powering the badge/lock should remain true until save
      expect(wrapper.vm.savedEnabledState).toBe(true);
    });

    it('converts matchLabels to matchExpressions on load via created hook', () => {
      wrapper = createWrapper({
        namespaceSelector: {
          matchLabels: {
            'sbomscanner.kubewarden.io/workloadscan': 'true'
          }
        }
      });

      const spec = wrapper.vm.value.spec;
      expect(spec.namespaceSelector.matchLabels).toBeUndefined();
      expect(spec.namespaceSelector.matchExpressions).toBeDefined();
      expect(spec.namespaceSelector.matchExpressions.length).toBe(1);
      expect(spec.namespaceSelector.matchExpressions[0]).toEqual({
        key: 'sbomscanner.kubewarden.io/workloadscan',
        operator: 'In',
        values: ['true']
      });
    });
  });

  describe('Computed Properties', () => {
    describe('isArtifactsNamespaceLocked', () => {
      it('returns true when mode is edit and saved state is active', () => {
        wrapper = createWrapper({ enabled: true }, 'edit');
        expect(wrapper.vm.isArtifactsNamespaceLocked).toBe(true);
      });

      it('returns false when mode is edit but saved state is inactive', () => {
        wrapper = createWrapper({ enabled: false }, 'edit');
        expect(wrapper.vm.isArtifactsNamespaceLocked).toBe(false);
      });

      it('returns false when mode is create', () => {
        wrapper = createWrapper({ enabled: true }, 'create');
        expect(wrapper.vm.isArtifactsNamespaceLocked).toBe(false);
      });
    });

    describe('namespaceOptions', () => {
      it('includes the empty value option at the top for default namespace behavior', () => {
        wrapper = createWrapper({});
        const options = wrapper.vm.namespaceOptions;

        expect(options.length).toBeGreaterThan(0);
        expect(options[0].value).toBe('');
      });
    });

    describe('authOptions', () => {
      it('filters secrets by type DOCKER_JSON and the dynamically fetched installation namespace', async () => {
        wrapper = createWrapper({});

        if (wrapper.vm.$options.fetch) {
          await wrapper.vm.$options.fetch.call(wrapper.vm);
        }

        wrapper.vm.allSecrets = [
          { metadata: { name: 'wrong-ns-secret', namespace: 'default' }, _type: SECRET_TYPES.DOCKER_JSON },
          { metadata: { name: 'correct-secret', namespace: 'custom-sbom-namespace' }, _type: SECRET_TYPES.DOCKER_JSON },
          { metadata: { name: 'wrong-type-secret', namespace: 'custom-sbom-namespace' }, _type: 'Opaque' },
        ];

        const options = wrapper.vm.authOptions;

        // 3 default header options (Create, Divider, None) + 1 matching secret
        expect(options.length).toBe(4);
        expect(options[3].value).toBe('correct-secret');
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
      wrapper.vm.addPlatform();
      expect(wrapper.vm.value.spec.platforms.length).toBe(1);
      expect(wrapper.vm.value.spec.platforms[0]).toEqual({ os: 'linux', arch: 'amd64', variant: '' });
    });

    it('removes a platform when removePlatform is called', () => {
      wrapper.vm.addPlatform();
      wrapper.vm.addPlatform();
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
            { key: 'env', operator: 'In', values: ['dev', 'prod'] }, // Duplicate
            { key: '', operator: 'Exists' } // Invalid
          ]
        }
      });

      wrapper.vm.cleanNamespaceSelector();
      expect(wrapper.vm.value.spec.namespaceSelector.matchExpressions.length).toBe(1);
      expect(wrapper.vm.value.spec.namespaceSelector.matchExpressions[0].key).toBe('env');
    });
  });

  describe('finish (Save logic)', () => {
    it('calls save and updates savedEnabledState upon success', async () => {
      wrapper = createWrapper({ enabled: true });

      // User unchecks the box
      wrapper.vm.value.spec.enabled = false;
      expect(wrapper.vm.savedEnabledState).toBe(true);

      wrapper.vm.save = jest.fn().mockResolvedValue(true);
      jest.spyOn(wrapper.vm, 'cleanBeforeSave');

      const preventDefault = jest.fn();
      await wrapper.vm.finish({ preventDefault });

      expect(preventDefault).toHaveBeenCalled();
      expect(wrapper.vm.cleanBeforeSave).toHaveBeenCalled();
      expect(wrapper.vm.save).toHaveBeenCalled();
      expect(wrapper.vm.savedEnabledState).toBe(false);

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
      wrapper.vm.save = jest.fn().mockResolvedValue(true);

      await wrapper.vm.finish();
      expect(wrapper.vm.value.spec.scanInterval).toBeUndefined();
    });

    it('cleans up default empty caBundle and false insecure on save', async () => {
      wrapper = createWrapper({ caBundle: '', insecure: false });
      wrapper.vm.save = jest.fn().mockResolvedValue(true);

      await wrapper.vm.finish({ preventDefault: jest.fn() });

      expect(wrapper.vm.value.spec.caBundle).toBeUndefined();
      expect(wrapper.vm.value.spec.insecure).toBeUndefined();
    });

    it('does not update savedEnabledState if save fails', async () => {
      wrapper = createWrapper({ enabled: true });
      wrapper.vm.value.spec.enabled = false;

      wrapper.vm.save = jest.fn().mockRejectedValue(new Error('Save failed'));

      await wrapper.vm.finish();

      expect(wrapper.vm.errors).toEqual([new Error('Save failed')]);
      expect(wrapper.vm.savedEnabledState).toBe(true); // Should remain true on error
    });
  });
});