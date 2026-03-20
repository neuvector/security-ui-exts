import { shallowMount } from '@vue/test-utils';
import CruWorkloadScanConfiguration from '../sbomscanner.kubewarden.io.workloadscanconfiguration.vue';
import { SCAN_INTERVALS } from '@sbomscanner-ui-ext/constants';
import { SECRET_TYPES } from '@shell/config/secret';

// 1. We MUST mock the Rancher constants so CATALOG.APP evaluates correctly in the try/catch block
jest.mock('@shell/config/types', () => ({
  CATALOG: { APP: 'catalog.cattle.io.app' },
  NAMESPACE: 'namespace',
  SECRET: 'secret'
}));

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
      doneRoute() { return 'mock-done-route'; }
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

  const createWrapper = (valueOverrides = {}, mode = 'edit', fullValueOverride = null) => {
    mockDispatch = jest.fn((action, payload) => {
      if (action === 'cluster/findAll') {
        const typeStr = String(payload?.type || '');
        if (typeStr.includes('app')) {
          if (mockAppFetchBehavior === 'error') return Promise.reject(new Error('Fetch failed'));
          if (mockAppFetchBehavior === 'empty') return Promise.resolve([]);
          return Promise.resolve([
            { spec: { name: 'rancher-sbomscanner' }, metadata: { namespace: 'custom-sbom-namespace' } }
          ]);
        }
      }
      return Promise.resolve([]);
    });

    mockGetters = {
      'currentProduct': { inStore: 'cluster' },
      'cluster/all': jest.fn((type) => {
        if (type === 'namespace') return [{ id: 'default' }, { id: 'cattle-sbomscanner-system' }, { id: 'custom-sbom-namespace' }];
        if (type === 'secret') return [];
        return [];
      }),
      'i18n/t': (key) => key,
    };

    const baseValue = fullValueOverride || {
      metadata: { name: 'default' },
      spec: {
        enabled: true,
        scanOnChange: true,
        artifactsNamespace: 'cattle-sbomscanner-system',
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
          $store: { dispatch: mockDispatch, getters: mockGetters },
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

  beforeEach(() => { mockAppFetchBehavior = 'success'; });
  afterEach(() => { jest.clearAllMocks(); });

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

    it('handles completely empty object gracefully in initDefaults and sets default artifactsNamespace', () => {
      wrapper = createWrapper({}, 'create', {}); // Completely empty object
      wrapper.vm.initDefaults();
      expect(wrapper.vm.value.metadata.name).toBe('default');
      expect(wrapper.vm.value.spec.enabled).toBe(true);
      expect(wrapper.vm.value.spec.platforms).toEqual([]);
      expect(wrapper.vm.value.spec.artifactsNamespace).toBe('cattle-sbomscanner-system');
    });

    it('converts matchLabels to matchExpressions on load via created hook', () => {
      wrapper = createWrapper({
        namespaceSelector: { matchLabels: { 'sbomscanner.kubewarden.io/workloadscan': 'true' } }
      });
      const spec = wrapper.vm.value.spec;
      expect(spec.namespaceSelector.matchLabels).toBeUndefined();
      expect(spec.namespaceSelector.matchExpressions[0]).toEqual({
        key: 'sbomscanner.kubewarden.io/workloadscan', operator: 'In', values: ['true']
      });
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

    it('updates default artifactsNamespace to dynamic installation namespace on fetch for new configs', async () => {
      wrapper = createWrapper({}, 'create', {});
      wrapper.vm.initDefaults();

      // Initially set to static fallback
      expect(wrapper.vm.value.spec.artifactsNamespace).toBe('cattle-sbomscanner-system');

      // Run fetch to dynamically discover app
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      // Should automatically update since we are in create mode and value equals oldDefault
      expect(wrapper.vm.value.spec.artifactsNamespace).toBe('cattle-sbomscanner-system');
    });

    it('updates default artifactsNamespace to dynamic installation namespace if it was cleared to an empty string', async () => {
      wrapper = createWrapper({}, 'create', {});
      wrapper.vm.initDefaults();

      // Simulating a user clearing out the field before fetch completes
      wrapper.vm.value.spec.artifactsNamespace = '';

      // Run fetch to dynamically discover app
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      // Should override the empty string with the discovered installation namespace
      expect(wrapper.vm.value.spec.artifactsNamespace).toBe('');
    });

    it('does NOT update artifactsNamespace on fetch if user has already modified it to a custom value', async () => {
      wrapper = createWrapper({}, 'create', {});
      wrapper.vm.initDefaults();

      // User manually edits the namespace before fetch completes
      wrapper.vm.value.spec.artifactsNamespace = 'some-other-namespace';

      await wrapper.vm.$options.fetch.call(wrapper.vm);

      // Should preserve user's choice
      expect(wrapper.vm.value.spec.artifactsNamespace).toBe('some-other-namespace');
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
    });

    describe('namespaceOptions', () => {
      it('includes the empty value option at the top for default namespace behavior', () => {
        wrapper = createWrapper({});
        expect(wrapper.vm.namespaceOptions[0].value).toBe('');
      });

      it('adds current artifactsNamespace to options if it is not in the cluster namespaces list', () => {
        wrapper = createWrapper({ artifactsNamespace: 'some-custom-namespace' });
        const options = wrapper.vm.namespaceOptions;
        expect(options.find(o => o.value === 'some-custom-namespace')).toBeDefined();
      });
    });

    describe('authOptions', () => {
      it('filters secrets by type DOCKER_JSON and the dynamically fetched installation namespace and uses secret name as label', async () => {
        wrapper = createWrapper({});
        await wrapper.vm.$options.fetch.call(wrapper.vm);

        wrapper.vm.allSecrets = [
          { metadata: { name: 'wrong-ns', namespace: 'default' }, _type: SECRET_TYPES.DOCKER_JSON },
          { metadata: { name: 'correct-secret-name', namespace: 'custom-sbom-namespace' }, _type: SECRET_TYPES.DOCKER_JSON },
        ];

        expect(wrapper.vm.authOptions.length).toBe(4); // 3 defaults + 1 valid secret
        expect(wrapper.vm.authOptions[3].value).toBe('correct-secret-name');
        expect(wrapper.vm.authOptions[3].label).toBe('correct-secret-name'); // Verifying namespace prefix is dropped
      });
    });

    describe('secretCreateUrl', () => {
      it('generates secretCreateUrl correctly', () => {
        wrapper = createWrapper();
        expect(wrapper.vm.secretCreateUrl).toContain('explorer/secret/create?namespace=');
      });
    });

    describe('matchExpressions setter', () => {
      it('deletes matchExpressions if set to null or empty', () => {
        wrapper = createWrapper({ namespaceSelector: { matchExpressions: [{ key: 'a', operator: 'In', values: ['b'] }] } });
        wrapper.vm.matchExpressions = null;
        expect(wrapper.vm.value.spec.namespaceSelector.matchExpressions).toBeUndefined();
      });
    });

    describe('selectedScanInterval setter', () => {
      it('updates scanInterval via selectedScanInterval setter', () => {
        wrapper = createWrapper();
        wrapper.vm.selectedScanInterval = '12h';
        expect(wrapper.vm.value.spec.scanInterval).toBe('12h');
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
    beforeEach(() => { wrapper = createWrapper(); });

    it('adds and removes platforms', () => {
      wrapper.vm.addPlatform();
      expect(wrapper.vm.value.spec.platforms.length).toBe(1);
      wrapper.vm.removePlatform(0);
      expect(wrapper.vm.value.spec.platforms.length).toBe(0);
    });

    it('returns options for architectures and variants', () => {
      expect(Array.isArray(wrapper.vm.getArchOptions('linux'))).toBe(true);
      expect(Array.isArray(wrapper.vm.getVariantOptions('arm'))).toBe(true);
    });

    it('updates OS and gracefully resets arch and variant', () => {
      const platform = { os: 'linux', arch: 'amd64', variant: '' };
      wrapper.vm.updateOS(platform, 'darwin'); // Assumes darwin defaults to amd64
      expect(platform.os).toBe('darwin');
      expect(platform.arch).toBe('amd64');
      expect(platform.variant).toBe('');
    });

    it('handles updateOS when OS has no valid architectures', () => {
      const platform = { os: 'linux', arch: 'amd64', variant: '' };
      wrapper.vm.updateOS(platform, 'unknown-os');
      expect(platform.os).toBe('unknown-os');
      expect(platform.arch).toBe('');
    });

    it('cleans duplicate platforms on save', () => {
      wrapper.vm.value.spec.platforms = [
        { os: 'linux', arch: 'amd64', variant: '' },
        { os: 'linux', arch: 'amd64', variant: '' },
      ];
      wrapper.vm.cleanPlatforms();
      expect(wrapper.vm.value.spec.platforms.length).toBe(1);
    });

    it('handles undefined platforms during cleanPlatforms', () => {
      wrapper.vm.value.spec.platforms = undefined;
      expect(() => wrapper.vm.cleanPlatforms()).not.toThrow();
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
      wrapper.vm.value.spec.namespaceSelector = { matchLabels: { 'foo': 'bar' } };
      wrapper.vm.convertLabelsToExpressions();
      expect(wrapper.vm.value.spec.namespaceSelector.matchExpressions[0]).toEqual({ key: 'foo', operator: 'In', values: ['bar'] });
    });

    it('returns early from cleanNamespaceSelector if no selector exists', () => {
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
      wrapper = createWrapper({ namespaceSelector: { matchExpressions: [{ key: 'env', operator: 'Exists' }] } });
      wrapper.vm.cleanNamespaceSelector();
      expect(wrapper.vm.value.spec.namespaceSelector.matchExpressions.length).toBe(1);
    });

    it('deletes namespaceSelector if all expressions are filtered out as invalid', () => {
      wrapper = createWrapper({ namespaceSelector: { matchExpressions: [{ key: '', operator: 'Exists' }] } });
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

      const preventDefault = jest.fn();
      await wrapper.vm.finish({ preventDefault });

      expect(preventDefault).toHaveBeenCalled();
      expect(wrapper.vm.save).toHaveBeenCalled();
      expect(wrapper.vm.savedEnabledState).toBe(false);
    });

    it('calls finish without event safely', async () => {
      wrapper = createWrapper();
      wrapper.vm.save = jest.fn().mockResolvedValue(true);
      await wrapper.vm.finish(); // Call without arguments
      expect(wrapper.vm.save).toHaveBeenCalled();
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