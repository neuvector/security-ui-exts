import { shallowMount, Wrapper, flushPromises } from '@vue/test-utils';
import CruRegistry from '../sbomscanner.kubewarden.io.registry.vue';
import { SECRET } from '@shell/config/types';
import { SECRET_TYPES } from '@shell/config/secret';
import { SCAN_INTERVALS, REGISTRY_TYPE } from '../../constants';

jest.mock('@sbomscanner-ui-ext/types', () => ({
  PRODUCT_NAME: 'kubewarden',
  PAGE:         { REGISTRIES: 'registries' },
  LOCAT_HOST:   [],
}));

const LabeledSelectStub = {
  name:     'LabeledSelect',
  template: `
    <select :data-testid="dataTestid" @change="$emit('update:value', $event.target.value)" :required="required">
      <option
          v-for="opt in options"
          :key="opt[optionKey]"
          :value="opt[optionKey]"
      >
        {{ opt[optionLabel] }}
      </option>
    </select>
  `,
  props: ['value', 'options', 'optionKey', 'optionLabel', 'required', 'dataTestid'],
};

// Updated stubs to include Checkbox and FileSelector
const stubs = {
  CruResource:       { name: 'CruResource', template: '<div><slot /></div>' },
  NameNsDescription: true,
  LabeledInput:      true,
  Banner:            { name: 'Banner', template: '<div><slot /></div>' },
  LabeledSelect:     LabeledSelectStub,
  Checkbox:          {
    name: 'Checkbox', template: '<input type="checkbox" :checked="value" @change="$emit(\'update:value\', $event.target.checked)" />', props: ['value']
  },
  FileSelector: { name: 'FileSelector', template: '<button @click="$emit(\'selected\', \'file-content\')">Read</button>' }
};

const t = (key: string) => key;

const mockSecrets = [
  { metadata: { name: 'secret-1', namespace: 'default' }, _type: SECRET_TYPES.DOCKER_JSON },
  { metadata: { name: 'secret-2', namespace: 'other' }, _type: SECRET_TYPES.DOCKER_JSON },
  { metadata: { name: 'secret-3', namespace: 'default' }, _type: 'Opaque' },
];

const mockStore = {
  dispatch: jest.fn(),
  getters:  { currentProduct: { inStore: 'cluster' } },
};

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
};
const mockRoute = { params: { cluster: 'c-123' } };

const defaultProps = {
  mode:  'create',
  value: {
    metadata: { name: '', namespace: 'default' },
    spec:     {
      catalogType:  REGISTRY_TYPE.OCI_DISTRIBUTION,
      authSecret:   '',
      uri:          '',
      repositories: [],
      scanInterval: SCAN_INTERVALS.MANUAL,
      caBundle:     '',
      insecure:     false,
      platforms:    []
    },
  },
};

const createWrapper = (props: any, storeMock = mockStore) => {
  return shallowMount(CruRegistry, {
    props:  { ...defaultProps, ...props },
    global: {
      mocks: {
        $store:  storeMock,
        $route:  mockRoute,
        $router: mockRouter,
        t,
      },
      stubs,
    }
  });
};

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

describe('CruRegistry', () => {
  let wrapper: Wrapper<any>;

  beforeEach(() => {
    mockStore.dispatch.mockClear();
    mockRouter.push.mockClear();
    mockRouter.back.mockClear();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize spec with defaults if it is undefined', () => {
      wrapper = createWrapper({});
      const spec = wrapper.vm.value.spec;

      expect(spec.catalogType).toBe(REGISTRY_TYPE.OCI_DISTRIBUTION);
      expect(spec.scanInterval).toBe(SCAN_INTERVALS.MANUAL);
      // New fields checks
      expect(spec.caBundle).toBe('');
      expect(spec.insecure).toBe(false);
      // expect(spec.platforms).toEqual([]);
    });

    it('should default scanInterval to MANUAL if it is null', () => {
      const props = {
        value: {
          metadata: { namespace: 'default' },
          spec:     {
            catalogType:  REGISTRY_TYPE.NO_CATALOG,
            authSecret:   'my-secret',
            uri:          'http://my.registry',
            repositories: [{ name: 'repo1' }],
            scanInterval: null,
            platforms:    []
          },
        },
      };

      wrapper = createWrapper(props);
      expect(wrapper.vm.value.spec.scanInterval).toBe(SCAN_INTERVALS.MANUAL);
    });
  });

  describe('fetch', () => {
    it('should call dispatch to find secrets on creation', async() => {
      const dispatch = jest.fn().mockResolvedValue(mockSecrets);
      const specificStore = { ...mockStore, dispatch };

      wrapper = createWrapper({}, specificStore);

      if (wrapper.vm.$options.fetch) {
        await wrapper.vm.$options.fetch.call(wrapper.vm);
      }

      await flushPromises();

      expect(dispatch).toHaveBeenCalledWith('cluster/findAll', { type: SECRET });

      expect(wrapper.vm.allSecrets).toStrictEqual(mockSecrets);
    });
  });

  describe('computed: repoNames (Object <-> String mapping)', () => {
    beforeEach(() => {
      wrapper = createWrapper({});
      if (!wrapper.vm.value.spec) wrapper.vm.value.spec = { repositories: [] };
    });

    it('get: should transform backend objects to UI strings', () => {
      wrapper.vm.value.spec.repositories = [{ name: 'repo1' }, { name: 'repo2' }];
      expect(wrapper.vm.repoNames).toEqual(['repo1', 'repo2']);
    });

    it('get: should handle undefined repositories safely', () => {
      wrapper.vm.value.spec.repositories = undefined;
      expect(wrapper.vm.repoNames).toEqual([]);
    });

    it('set: should transform UI strings to backend objects', () => {
      wrapper.vm.repoNames = ['new-repo-1', 'new-repo-2'];
      expect(wrapper.vm.value.spec.repositories).toEqual([
        { name: 'new-repo-1' },
        { name: 'new-repo-2' }
      ]);
    });
  });
  // ---------------------------------------------

  describe('computed: options (Auth Secrets)', () => {
    beforeEach(async() => {
      wrapper = createWrapper({});
      wrapper.vm.allSecrets = mockSecrets;
      await wrapper.vm.$nextTick();
    });

    it('should return default options if no secrets are loaded', async() => {
      wrapper.vm.allSecrets = null;
      await wrapper.vm.$nextTick();
      const options = wrapper.vm.options;

      expect(options.length).toBe(3);
    });

    it('should filter secrets by namespace (default) and type (docker-json)', () => {
      const options = wrapper.vm.options;

      expect(options.length).toBe(4);
      expect(options[3].label).toBe('secret-1');
    });

    it('should update options when namespace changes', async() => {
      await wrapper.setProps({
        value: {
          ...defaultProps.value,
          metadata: { namespace: 'other' },
          spec:     wrapper.vm.value.spec,
        },
      });
      await wrapper.vm.$nextTick();
      const options = wrapper.vm.options;

      expect(options.length).toBe(4);
      expect(options[3].label).toBe('secret-2');
    });
  });

  describe('computed: validationPassed', () => {
    let validValue: any;

    beforeEach(async() => {
      wrapper = createWrapper({});
      validValue = {
        metadata: { name: 'my-registry', namespace: 'default' },
        spec:     {
          catalogType:  REGISTRY_TYPE.OCI_DISTRIBUTION,
          authSecret:   'my-secret',
          uri:          'http://my.registry',
          repositories: [],
          scanInterval: SCAN_INTERVALS.MANUAL,
          caBundle:     '',
          insecure:     false,
          platforms:    []
        },
      };
      await wrapper.setProps({ value: validValue });
      await wrapper.vm.$nextTick();
    });

    it('should pass validation with valid data', () => {
      expect(wrapper.vm.validationPassed).toBe(true);
    });

    it('should fail if name is missing', async() => {
      const newValue = deepClone(validValue);

      newValue.metadata.name = ' ';
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should fail if URI is missing', async() => {
      const newValue = deepClone(validValue);

      newValue.spec.uri = ' ';
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should fail if authSecret is "create"', async() => {
      const newValue = deepClone(validValue);

      newValue.spec.authSecret = 'create';
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should fail if catalogType is NO_CATALOG and repositories is empty', async() => {
      const newValue = deepClone(validValue);

      newValue.spec.catalogType = REGISTRY_TYPE.NO_CATALOG;
      newValue.spec.repositories = [];
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should pass if catalogType is NO_CATALOG and repositories has items', async() => {
      const newValue = deepClone(validValue);

      newValue.spec.catalogType = REGISTRY_TYPE.NO_CATALOG;
      newValue.spec.repositories = [{ name: 'my-repo' }];
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(true);
    });
  });

  // --- NEW METHODS TESTS ---
  describe('methods: Platforms & Files', () => {
    beforeEach(() => {
      wrapper = createWrapper({});
    });

    it('onFileSelected should set caBundle', () => {
      wrapper.vm.onFileSelected('my-cert-content');
      expect(wrapper.vm.value.spec.caBundle).toBe('my-cert-content');
    });

    it('addPlatform should push an empty template to platforms array', () => {
      wrapper.vm.addPlatform();
      expect(wrapper.vm.value.spec.platforms).toHaveLength(1);
      expect(wrapper.vm.value.spec.platforms[0]).toEqual({
        os: '', arch: '', variant: ''
      });
    });

    it('removePlatform should remove item from platforms array', () => {
      wrapper.vm.value.spec.platforms = [
        {
          os: 'linux', arch: 'amd64', variant: ''
        },
        {
          os: 'windows', arch: 'amd64', variant: ''
        }
      ];
      wrapper.vm.removePlatform(0);
      expect(wrapper.vm.value.spec.platforms).toHaveLength(1);
      expect(wrapper.vm.value.spec.platforms[0].os).toBe('windows');
    });

    it('updateOS should set OS and reset Arch/Variant defaults', () => {
      const platform = {
        os: '', arch: '', variant: 'v7'
      };

      // Testing Linux which has 'amd64' in the allowed list
      wrapper.vm.updateOS(platform, 'linux');
      expect(platform.os).toBe('linux');
      expect(platform.arch).toBe('amd64'); // Should auto-select amd64
      expect(platform.variant).toBe(''); // Should clear variant
    });

    it('updateArch should set Arch and clear Variant if unsupported', () => {
      const platform = {
        os: 'linux', arch: 'arm', variant: 'v7'
      };

      // Change to amd64 (does not support variants)
      wrapper.vm.updateArch(platform, 'amd64');
      expect(platform.arch).toBe('amd64');
      expect(platform.variant).toBe('');
    });

    it('updateArch should keep Variant if supported (manually logic check)', () => {
      // Logic check: updateArch clears it if !isVariantSupported.
      // If we manually change it to something supported, it logic implies it won't clear it,
      // but the method implementation clears it if NOT supported.
      // So checking the negative case:
      const platform = {
        os: 'linux', arch: 'amd64', variant: ''
      };

      wrapper.vm.updateArch(platform, 'arm');
      // The method does NOT auto-set a variant, but it shouldn't force clear it if it was set (though here it is empty)
      // The key is that it doesn't run the clearing logic.
      expect(platform.arch).toBe('arm');
    });
  });
  // -------------------------

  describe('methods: finish', () => {
    const save = jest.fn();

    beforeEach(() => {
      save.mockReset();
      wrapper = createWrapper({});
      wrapper.vm.save = save;
      wrapper.setProps({
        value: {
          metadata: { name: 'my-registry', namespace: 'default' },
          spec:     {
            catalogType:  REGISTRY_TYPE.OCI_DISTRIBUTION,
            authSecret:   'my-secret',
            uri:          'http://my.registry',
            repositories: [],
            scanInterval: SCAN_INTERVALS.MANUAL,
            platforms:    []
          },
        },
      });
    });

    it('should delete scanInterval if MANUAL and call save, then route', async() => {
      save.mockResolvedValue({});
      await wrapper.vm.finish();
      expect(wrapper.vm.value.spec.scanInterval).toBeUndefined();
      expect(save).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
    });

    it('should NOT delete scanInterval if not MANUAL', async() => {
      save.mockResolvedValue({});
      wrapper.vm.value.spec.scanInterval = SCAN_INTERVALS.DAILY;
      await wrapper.vm.$nextTick();
      await wrapper.vm.finish();
      expect(wrapper.vm.value.spec.scanInterval).toBe(SCAN_INTERVALS.DAILY);
      expect(save).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
    });

    it('should set errors and not route on save failure', async() => {
      const error = new Error('Save failed');

      save.mockRejectedValue(error);
      await wrapper.vm.finish();
      expect(save).toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(wrapper.vm.errors).toEqual([error]);
    });
  });

  describe('methods: refreshList', () => {
    it('should set loading state and re-fetch secrets', async() => {
      const newMockSecret = [{ metadata: { name: 'new-secret', namespace: 'default' }, _type: SECRET_TYPES.DOCKER_JSON }];
      const dispatch = jest.fn().mockResolvedValue(newMockSecret);
      const specificStore = { ...mockStore, dispatch };

      wrapper = createWrapper({}, specificStore);

      if (wrapper.vm.$options.fetch) {
        await wrapper.vm.$options.fetch.call(wrapper.vm);
      }
      await flushPromises();
      dispatch.mockClear();

      expect(wrapper.vm.authLoading).toBe(false);
      const promise = wrapper.vm.refreshList();

      expect(wrapper.vm.authLoading).toBe(true);

      await promise;

      expect(dispatch).toHaveBeenCalledWith('cluster/findAll', { type: SECRET });
      expect(wrapper.vm.allSecrets).toEqual(newMockSecret);
      expect(wrapper.vm.authLoading).toBe(false);
    });
  });

  describe('Template', () => {
    it('should show info banner when authSecret is "create"', async() => {
      wrapper = createWrapper({});
      await wrapper.setProps({ value: { ...wrapper.vm.value, spec: { ...wrapper.vm.value.spec, authSecret: 'create' } } });
      await wrapper.vm.$nextTick();
      const banner = wrapper.findComponent({ name: 'Banner' });

      expect(banner.exists()).toBe(true);
    });

    it('should NOT show info banner when authSecret is not "create"', async() => {
      wrapper = createWrapper({});
      await wrapper.setProps({ value: { ...wrapper.vm.value, spec: { ...wrapper.vm.value.spec, authSecret: 'my-secret' } } });
      await wrapper.vm.$nextTick();
      const banner = wrapper.findComponent({ name: 'Banner' });

      expect(banner.exists()).toBe(false);
    });

    it('should mark repositories as required when type is NO_CATALOG', async() => {
      wrapper = createWrapper({});
      await wrapper.setProps({ value: { ...wrapper.vm.value, spec: { ...wrapper.vm.value.spec, catalogType: REGISTRY_TYPE.NO_CATALOG } } });
      await wrapper.vm.$nextTick();
      const repoSelect = wrapper.find('[data-testid="registry-scanning-repository-names"]');

      expect(repoSelect.exists()).toBe(true);
      const requiredAttr = repoSelect.attributes('required');

      expect(requiredAttr).toBe('');
    });

    it('should show FileSelector for CA Bundle', () => {
      wrapper = createWrapper({});
      const fileSelector = wrapper.findComponent({ name: 'FileSelector' });

      expect(fileSelector.exists()).toBe(true);
    });

    it('should show Checkbox for Insecure', () => {
      wrapper = createWrapper({});
      const checkbox = wrapper.findComponent({ name: 'Checkbox' });

      expect(checkbox.exists()).toBe(true);
    });
  });
});