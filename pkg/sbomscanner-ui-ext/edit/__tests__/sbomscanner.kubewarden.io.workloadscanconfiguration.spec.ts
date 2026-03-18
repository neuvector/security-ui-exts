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
      isCreate() { return this.mode === 'create'; },
      isView() { return this.mode === 'view'; },
      doneRoute() { return 'mock-done-route'; } // Fixes the Vue warn
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
  let mockAppFetchBehavior = 'success';

  const createWrapper = (valueOverrides = {}, mode = 'edit') => {
    mockDispatch = jest.fn((action, payload) => {
      if (action === 'cluster/findAll' && payload?.type === 'catalog.cattle.io.app') {
        if (mockAppFetchBehavior === 'error') {
          return Promise.reject(new Error('Fetch failed'));
        }
        if (mockAppFetchBehavior === 'empty') {
          return Promise.resolve([]);
        }
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

  beforeEach(() => {
    mockAppFetchBehavior = 'success';
  });

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
      wrapper.vm.value.spec.enabled = false;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.savedEnabledState).toBe(true);
    });

    it('handles undefined spec gracefully on initialization', () => {
      wrapper = createWrapper();
      wrapper.vm.value.spec = undefined;
      wrapper.vm.initDefaults();
      expect(wrapper.vm.value.spec.enabled).toBe(true);
    });
  });

  describe('Data Fetching (fetch hook)', () => {
    it('falls back to default namespace if app fetch fails', async () => {
      mockAppFetchBehavior = 'error';
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      wrapper = createWrapper();

      await wrapper.vm.$options.fetch.call(wrapper.vm);
      expect(wrapper.vm.sbomScannerInstallationNamespace).toBe('cattle-sbomscanner-system');

      consoleWarnSpy.mockRestore();
    });

    it('falls back to default namespace if sbomscanner app is not found', async () => {
      mockAppFetchBehavior = 'empty';
      wrapper = createWrapper();

      await wrapper.vm.$options.fetch.call(wrapper.vm);
      expect(wrapper.vm.sbomScannerInstallationNamespace).toBe('cattle-sbomscanner-system');
    });
  });

  describe('Computed Properties', () => {
    describe('isArtifactsNamespaceLocked', () => {
      it('returns true when mode is edit and saved state is active', () => {
        wrapper = createWrapper({ enabled: true }, 'edit');
        expect(wrapper.vm.isArtifactsNamespaceLocked).toBe(true);
      });

      it('returns false when mode is create', () => {
        wrapper = createWrapper({ enabled: true }, 'create');
        expect(wrapper.vm.isArtifactsNamespaceLocked).toBe(false);
      });
    });

    describe('namespaceOptions', () => {
      it('includes the empty value option at the top for default namespace behavior', () => {
        wrapper = createWrapper({});
        expect(wrapper.vm.namespaceOptions[0].value).toBe('');
      });
    });

    describe('authOptions', () => {
      it('filters secrets by type DOCKER_JSON and the dynamically fetched installation namespace', async () => {
        wrapper = createWrapper({});
        await wrapper.vm.$options.fetch.call(wrapper.vm);

        wrapper.vm.allSecrets = [
          { metadata: { name: 'wrong-ns', namespace: 'default' }, _type: SECRET_TYPES.DOCKER_JSON },
          { metadata: { name: 'correct', namespace: 'custom-sbom-namespace' }, _type: SECRET_TYPES.DOCKER_JSON },
          { metadata: { name: 'wrong-type', namespace: 'custom-sbom-namespace' }, _type: 'Opaque' },
        ];

        expect(wrapper.vm.authOptions.length).toBe(4);
        expect(wrapper.vm.authOptions[3].value).toBe('correct');
      });
    });

    describe('matchExpressions setter', () => {
      it('deletes matchExpressions if empty array is passed', () => {
        wrapper = createWrapper();
        wrapper.vm.matchExpressions = [];
        expect(wrapper.vm.value.spec.namespaceSelector.matchExpressions).toBeUndefined();
      });
    });
  });

  describe('Validation', () => {
    it('passes validation when a valid secret is selected or left blank', () => {
      wrapper = createWrapper({ authSecret: 'my-secret' });
      expect(wrapper.vm.validationPassed).toBe(true);
    });

    it('fails validation when authSecret is set to "create"', () => {
      wrapper = createWrapper({ authSecret: 'create' });
      expect(wrapper.vm.validationPassed).toBe(false);
    });
  });

  describe('Platform Management', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('adds and removes platforms', () => {
      wrapper.vm.addPlatform();
      expect(wrapper.vm.value.spec.platforms.length).toBe(1);
      wrapper.vm.removePlatform(0);
      expect(wrapper.vm.value.spec.platforms.length).toBe(0);
    });

    it('updates OS and gracefully resets arch and variant', () => {
      const platform = { os: 'linux', arch: 'amd64', variant: '' };
      wrapper.vm.updateOS(platform, 'darwin');

      expect(platform.os).toBe('darwin');
      expect(platform.arch).toBeDefined();
      expect(platform.variant).toBe('');
    });

    it('handles undefined platforms during cleanPlatforms', () => {
      wrapper.vm.value.spec.platforms = undefined;
      expect(() => wrapper.vm.cleanPlatforms()).not.toThrow();
    });

    it('cleans duplicate platforms on save', () => {
      wrapper.vm.value.spec.platforms = [
        { os: 'linux', arch: 'amd64' },
        { os: 'linux', arch: 'amd64' },
      ];
      wrapper.vm.cleanPlatforms();
      expect(wrapper.vm.value.spec.platforms.length).toBe(1);
    });
  });

  describe('Namespace Selector Management', () => {
    it('resets namespaceSelector if it is an array', () => {
      wrapper = createWrapper();
      wrapper.vm.value.spec.namespaceSelector = [];
      wrapper.vm.convertLabelsToExpressions();
      expect(wrapper.vm.value.spec.namespaceSelector).toEqual({});
    });

    it('converts matchLabels to matchExpressions and handles missing matchExpressions array', () => {
      wrapper = createWrapper();
      wrapper.vm.value.spec.namespaceSelector = {
        matchLabels: { 'foo': 'bar' }
      };

      wrapper.vm.convertLabelsToExpressions();

      const spec = wrapper.vm.value.spec;
      expect(spec.namespaceSelector.matchLabels).toBeUndefined();
      expect(spec.namespaceSelector.matchExpressions[0]).toEqual({ key: 'foo', operator: 'In', values: ['bar'] });
    });

    it('handles undefined namespaceSelector during cleanNamespaceSelector', () => {
      wrapper = createWrapper();
      wrapper.vm.value.spec.namespaceSelector = undefined;
      expect(() => wrapper.vm.cleanNamespaceSelector()).not.toThrow();
    });

    it('removes namespaceSelector entirely if matchExpressions is empty', () => {
      wrapper = createWrapper({ namespaceSelector: { matchExpressions: [] } });
      wrapper.vm.cleanNamespaceSelector();
      expect(wrapper.vm.value.spec.namespaceSelector).toBeUndefined();
    });

    it('cleans namespace selector with Exists operator (no values array)', () => {
      wrapper = createWrapper({
        namespaceSelector: {
          matchExpressions: [{ key: 'env', operator: 'Exists' }]
        }
      });
      wrapper.vm.cleanNamespaceSelector();
      expect(wrapper.vm.value.spec.namespaceSelector.matchExpressions.length).toBe(1);
    });

    it('deletes namespaceSelector if all expressions are filtered out as invalid', () => {
      wrapper = createWrapper({
        namespaceSelector: {
          matchExpressions: [{ key: '', operator: 'Exists' }]
        }
      });
      wrapper.vm.cleanNamespaceSelector();
      expect(wrapper.vm.value.spec.namespaceSelector).toBeUndefined();
    });
  });

  describe('Other Methods', () => {
    it('populates errors if refreshList fails', async () => {
      wrapper = createWrapper();
      wrapper.vm.$store.dispatch = jest.fn().mockRejectedValue(new Error('Refresh failed'));
      await wrapper.vm.refreshList();

      expect(wrapper.vm.errors).toEqual([new Error('Refresh failed')]);
      expect(wrapper.vm.authLoading).toBe(false);
    });

    it('sets caBundle on onFileSelected', () => {
      wrapper = createWrapper();
      wrapper.vm.onFileSelected('cert-data');
      expect(wrapper.vm.value.spec.caBundle).toBe('cert-data');
    });
  });

  describe('finish (Save logic)', () => {
    it('calls save and updates savedEnabledState upon success', async () => {
      wrapper = createWrapper({ enabled: true });
      wrapper.vm.value.spec.enabled = false;
      wrapper.vm.save = jest.fn().mockResolvedValue(true);
      jest.spyOn(wrapper.vm, 'cleanBeforeSave');

      const preventDefault = jest.fn();
      await wrapper.vm.finish({ preventDefault });

      expect(preventDefault).toHaveBeenCalled();
      expect(wrapper.vm.cleanBeforeSave).toHaveBeenCalled();
      expect(wrapper.vm.save).toHaveBeenCalled();
      expect(wrapper.vm.savedEnabledState).toBe(false);
    });

    it('deletes scanInterval if it is set to MANUAL', async () => {
      wrapper = createWrapper({ scanInterval: SCAN_INTERVALS.MANUAL });
      wrapper.vm.save = jest.fn().mockResolvedValue(true);
      await wrapper.vm.finish();
      expect(wrapper.vm.value.spec.scanInterval).toBeUndefined();
    });

    it('keeps caBundle and insecure if they have valid values', async () => {
      wrapper = createWrapper({ caBundle: 'some-cert', insecure: true });
      wrapper.vm.save = jest.fn().mockResolvedValue(true);

      await wrapper.vm.finish();

      expect(wrapper.vm.value.spec.caBundle).toBe('some-cert');
      expect(wrapper.vm.value.spec.insecure).toBe(true);
    });

    it('cleans up default empty caBundle and false insecure on save', async () => {
      wrapper = createWrapper({ caBundle: '', insecure: false });
      wrapper.vm.save = jest.fn().mockResolvedValue(true);

      await wrapper.vm.finish();

      expect(wrapper.vm.value.spec.caBundle).toBeUndefined();
      expect(wrapper.vm.value.spec.insecure).toBeUndefined();
    });

    it('does not update savedEnabledState if save fails', async () => {
      wrapper = createWrapper({ enabled: true });
      wrapper.vm.value.spec.enabled = false;
      wrapper.vm.save = jest.fn().mockRejectedValue(new Error('Save failed'));

      await wrapper.vm.finish();

      expect(wrapper.vm.errors).toEqual([new Error('Save failed')]);
      expect(wrapper.vm.savedEnabledState).toBe(true);
    });
  });
});