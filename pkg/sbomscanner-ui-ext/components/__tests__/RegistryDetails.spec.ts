import { mount, flushPromises } from '@vue/test-utils';
import RegistryDetails from '../RegistryDetails.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import StatusBadge from '../common/StatusBadge.vue';
import RegistryDetailScanTable from '../RegistryDetailScanTable.vue';
import ScanButton from '../common/ScanButton.vue';
import RegistryDetailsMeta from '../common/RegistryDetailsMeta.vue';

import { getPermissions } from '@sbomscanner-ui-ext/utils/permissions';
import { trimIntervalSuffix } from '@sbomscanner-ui-ext/utils/app';

// mock external utils
jest.mock('@sbomscanner-ui-ext/utils/permissions', () => ({
  getPermissions: jest.fn(() => ({ canEdit: true })),
}));

jest.mock('@sbomscanner-ui-ext/utils/app', () => ({
  trimIntervalSuffix: jest.fn(() => '5m'),
}));

jest.mock(
  '@sbomscanner-ui-ext/components/rancher-rewritten/shell/components/Preview.vue',
  () => ({
    name: 'Preview',
    props: ['title', 'value'],
    template: '<div class="preview-mock"><slot /></div>',
  })
);

describe('RegistryDetails.vue', () => {

  let storeMock;
  let tMock;
  const mockRouter = { push: jest.fn() };

  const registryMock = {
    metadata: { name: 'my-reg', namespace: 'ns1' },
    spec:     {
      uri:          'http://test.registry',
      repositories: [{ name: 'repo1' }, { name: 'repo2' }],
      scanInterval: '5m',
    },
    scanRec: { currStatus: 'complete' },
  };

  const scanJobsMock = [
    { spec: { registry: 'my-reg' } },
    { spec: { registry: 'other-reg' } },
  ];

  const factory = (options = {}) => {
    storeMock = {
      dispatch: jest.fn((action) => {
        if (action === 'cluster/find') {
          return Promise.resolve(registryMock);
        } else if (action === 'cluster/findAll') {
          return Promise.resolve(scanJobsMock);
        }
      }),
      getters: {}
    };

    tMock = jest.fn((str, vars) => {
      if (vars?.i) return `Every ${vars.i}`;
      return str;
    });

    return mount(RegistryDetails, {
      global: {
        mocks: {
          $store: storeMock,
          $fetchState: { pending: false },
          $route: {
            params: { cluster: 'local', id: 'my-reg', ns: 'ns1' }
          },
          $router: mockRouter,
          t: tMock,
        },
        stubs: {
          RouterLink: true,
          ActionMenu: true,
          StatusBadge: true,
          RegistryDetailScanTable: true,
          RegistryDetailsMeta: true,
          ScanButton: true,
        },
      },
      ...options,
    });
  };

  it('renders header and structure', async () => {
    const wrapper = factory();
    await wrapper.vm.loadData();

    expect(wrapper.find('.registry-details').exists()).toBe(true);
    expect(wrapper.find('.header').exists()).toBe(true);
  });

  it('fetch() calls loadData()', async () => {
    const wrapper = factory();
    const spy = jest.spyOn(wrapper.vm, 'loadData');

    await wrapper.vm.$options.fetch.call(wrapper.vm);

    expect(spy).toHaveBeenCalled();
  });

  it('loadData populates registry, metadata, and scanHistory', async () => {
    const wrapper = factory();

    await wrapper.vm.loadData();

    expect(wrapper.vm.registry).toEqual(registryMock);
    expect(wrapper.vm.scanHistory).toEqual([{ spec: { registry: 'my-reg' } }]);

    expect(trimIntervalSuffix).toHaveBeenCalledWith('5m');
    expect(wrapper.vm.registryMetadata.namespace.value).toBe('ns1');
    expect(wrapper.vm.registryMetadata.uri.value).toBe('http://test.registry');
    expect(wrapper.vm.registryMetadata.repositories.value).toBe(2);
  });

  it('renders ActionMenu only when registry is set', async () => {
    const wrapper = factory();

    expect(wrapper.findComponent(ActionMenu).exists()).toBe(false);

    await wrapper.vm.loadData();
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(ActionMenu).exists()).toBe(true);
  });

  it('renders child components', async () => {
    const wrapper = factory();
    await wrapper.vm.loadData();

    expect(wrapper.findComponent(RegistryDetailsMeta).exists()).toBe(true);
    expect(wrapper.findComponent(StatusBadge).exists()).toBe(true);
    expect(wrapper.findComponent(RegistryDetailScanTable).exists()).toBe(true);
    expect(wrapper.findComponent(ScanButton).exists()).toBe(true);
  });

  it('handles empty repositories & scanInterval gracefully', async () => {
    const wrapper = factory();

    registryMock.spec.repositories = undefined;
    registryMock.spec.scanInterval = undefined;
    trimIntervalSuffix.mockReturnValueOnce('');

    await wrapper.vm.loadData();

    expect(wrapper.vm.registryMetadata.repositories.value).toBe(0);
    expect(wrapper.vm.registryMetadata.schedule.value).toBe('');
  });

});
