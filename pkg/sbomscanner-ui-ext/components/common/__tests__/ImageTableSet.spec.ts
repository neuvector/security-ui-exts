import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ImageTableSet from '../ImageTableSet.vue';

jest.mock('@sbomscanner-ui-ext/utils/image', () => ({
  constructImageName: jest.fn((m) =>
    `${m.registry}/${m.repository}:${m.tag || 'latest'}`
  ),
}));

jest.mock('file-saver', () => ({ saveAs: jest.fn() }));

jest.mock('papaparse', () => ({ unparse: jest.fn(() => 'csv-content') }));

jest.mock('@sbomscanner-ui-ext/utils/report', () => ({ imageDetailsToCSV: jest.fn(() => [{ a: 1 }]) }));

jest.mock('@sbomscanner-ui-ext/config/table-headers', () => ({
  IMAGE_LIST_TABLE:            [{ name: 'img' }],
  REPO_BASED_TABLE:            [{ name: 'repo' }],
  REPO_BASED_IMAGE_LIST_TABLE: [{ name: 'sub' }],
}));

const SortableTableStub = {
  props:    ['rows'],
  template: `
    <table>
      <slot name="header-left" />
      <slot name="header-right" />
      <slot
        v-if="rows && rows[0]"
        name="sub-row"
        :row="rows?.[0]"
        :fullColspan="3"
      />
      <slot v-if="rows && rows[0]" name="row-actions" :row="rows?.[0]" />
    </table>
  `,
};

const CheckboxStub = {
  props:    ['value'],
  emits:    ['update:value'],
  template: `<input type="checkbox" @change="$emtest('update:value', !value)" />`,
};

const LabeledSelectStub = {
  props:    ['value'],
  emits:    ['update:value'],
  template: `<div></div>`,
};

const factory = (props = {}, storeOverrides = {}, routeOverrides = {}) => {
  const dispatch = jest.fn();

  const $route = {
    path: '/c/local/explorer',
    ...routeOverrides
  };

  return shallowMount(ImageTableSet, {
    props: {
      rows:       [],
      ...props,
    },
    global: {
      mocks: {
        $store:      { dispatch },
        $fetchState: { pending: false },
        $route,
        t:           (k) => k,
      },
      stubs: {
        SortableTable: SortableTableStub,
        Checkbox:      CheckboxStub,
        LabeledSelect: LabeledSelectStub,
        ActionMenu:    true,
      },
    },
  });
};

describe('ImageOverview.vue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  test('disables download button when no selection', () => {
    const wrapper = factory();

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });

  test('enables download button when rows selected', async() => {
    const wrapper = factory();

    wrapper.vm.onSelectionChange([{}]);
    await nextTick();

    expect(wrapper.find('button').attributes('disabled')).toBeUndefined();
  });

  test('renders sub-row when grouped', async() => {
    const wrapper = factory({
      rows: [{
        id:            '1',
        imageMetadata: { registry: 'r', repository: 'repo'  },
        metadata:      { namespace: 'ns' },
        report:        {
          summary: {
            critical: 1, high: 0, medium: 0, low: 0, unknown: 0
          }
        },
      }],
    });

    wrapper.vm.isGrouped = true;
    await nextTick();

    expect(wrapper.find('.sub-row').exists()).toBe(true);
  });

  test('debounces filter updates', async() => {
    const wrapper = factory();

    // 1️⃣ trigger reactive change
    wrapper.vm.filters.imageSearch = 'nginx';

    // 2️⃣ allow Vue watcher to run
    await nextTick();

    // 3️⃣ advance debounce delay
    jest.advanceTimersByTime(500);

    // 4️⃣ allow debounced handler to apply state
    await nextTick();

    expect(wrapper.vm.debouncedFilters.imageSearch).toBe('nginx');
  });


  test('filters rows by all filter fields', async() => {
    const rows = [{
      id:            '1',
      imageMetadata: {
        registry:   'reg',
        repository: 'repo' ,
        platform:   'linux',
      },
      metadata: { namespace: 'ns' },
      report:   {
        summary: {
          critical: 1, high: 0, medium: 0, low: 0, unknown: 0
        }
      },
    }];

    const wrapper = factory({ rows });

    wrapper.vm.debouncedFilters = {
      imageSearch:      'repo',
      severitySearch:   'critical',
      repositorySearch: 'repo',
      registrySearch:   'ns/reg',
      platformSearch:   'linux',
    };

    expect(wrapper.vm.filteredRows.rows.length).toBe(1);
  });

  test('filters rows by all filter fields - other', async() => {
    const rows = [{
      id:            '1',
      imageMetadata: {
        registry:   'reg',
        repository: 'repo' ,
        platform:   'linux',
      },
      metadata: { namespace: 'ns' },
      report:   {
        summary: {
          critical: 0, high: 0, medium: 1, low: 1, unknown: 0
        }
      },
    }];

    const wrapper = factory({ rows });

    wrapper.vm.debouncedFilters = {
      imageSearch:      'repo',
      severitySearch:   'medium',
      repositorySearch: 'repo',
      registrySearch:   'ns/reg',
      platformSearch:   'linux',
    };

    expect(wrapper.vm.filteredRows.rows.length).toBe(1);
  });

  test('custom actions invoke correct methods', () => {
    const wrapper = factory();

    const actions = wrapper.vm.customActions;

    actions[0].invoke(null, [{}]);

    expect(wrapper.vm.downloadSbom).toBeDefined();
  });

  test('builds repository and registry options', async() => {
    const wrapper = factory();

    wrapper.vm.registryCrds = [{
      metadata: { namespace: 'ns', name: 'reg1' },
      spec:     { repositories: [{ 'name': 'repo1' }] },
    }];

    expect(wrapper.vm.repositoryOptions).toEqual(['Any', 'repo1']);
    expect(wrapper.vm.registryOptions).toEqual(['Any', 'ns/reg1']);
  });

  test('downloads CSV (non-grouped)', async() => {
    const wrapper = factory();

    await wrapper.vm.downloadCSVReport([{
      imageReference: 'img',
      imageMetadata:  {
        digest: 'd', registry: 'r', repository: 'repo'
      },
      report: {
        summary: {
          critical: 1, high: 0, medium: 0, low: 0, unknown: 0
        }
      },
    }], false);

    expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith(
      'growl/success',
      expect.any(Object),
      { root: true }
    );
  });

  test('handles CSV download error', async() => {
    require('file-saver').saveAs.mockRejectedValueOnce(new Error());

    const wrapper = factory();

    await wrapper.vm.downloadCSVReport([], false);

    expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith(
      'growl/error',
      expect.any(Object),
      { root: true }
    );
  });

  describe('preprocessData', () => {
    const mockReports = [
      {
        id:            '1',
        imageMetadata: { repository: 'repo' , registry: 'reg' },
        metadata:      { namespace: 'ns', name: 'img1' },
        report:        {
          summary: {
            critical: 1, high: 0, medium: 2, low: 0, unknown: 0
          }
        },
      },
      {
        id:            '2',
        imageMetadata: { repository: 'repo' , registry: 'reg' }, // Same repo
        metadata:      { namespace: 'ns', name: 'img2' },
        report:        {
          summary: {
            critical: 2, high: 0, medium: 0, low: 1, unknown: 0
          }
        },
      },
    ];

    test('aggregates reports by repo', () => {
    const wrapper = factory({ isInWorkloadContext: false });

    const result = wrapper.vm.preprocessData(mockReports);

    expect(result.length).toBe(1);

    const repo = result[0];

    expect(repo.images.length).toBe(2);

    expect(repo.cveCntByRepo.critical).toBe(3);
    expect(repo.cveCntByRepo.medium).toBe(2);
    expect(repo.cveCntByRepo.low).toBe(1);

    expect(repo.cveSummary).toBeDefined();
    expect(repo.cveSummary.total).toBe(6);
    expect(repo.cveSummary.cveAmount.critical).toBe(3);
    expect(repo.cveSummary.link).toBe('#');
  });

    test('generates dynamic link in cveSummary when isInWorkloadContext is true', () => {
      const mockRoutePath = '/c/local/explorer/workload/my-deployment';
      const wrapper = factory(
        { isInWorkloadContext: true },
        {},
        { path: mockRoutePath } // Pass mock route
      );

      const result = wrapper.vm.preprocessData([mockReports[0]]);
      const repo = result[0];

      expect(repo.cveSummary.link).toBe(`${mockRoutePath}#affectingCVEs`);
    });
  });

  test('repositoryOptions returns "Any" when registryCrds is empty', () => {
    const wrapper = factory();

    wrapper.vm.registryCrds = [];
    expect(wrapper.vm.repositoryOptions).toEqual(['Any']);
  });

  test('repositoryOptions returns all repositories from registryCrds', () => {
    const wrapper = factory();

    wrapper.vm.registryCrds = [
      { spec: { repositories: [{ 'name': 'repo1' }, { 'name': 'repo2' }] }, metadata: { namespace: 'ns1', name: 'reg1' } },
      { spec: { repositories: [{ 'name': 'repo3' }] }, metadata: { namespace: 'ns2', name: 'reg2' } },
    ];

    const expected = ['Any', 'repo1', 'repo2', 'repo3'];

    expect(wrapper.vm.repositoryOptions.sort()).toEqual(expected.sort());
  });

  test('repositoryOptions handles registryCrds with missing repositories', () => {
    const wrapper = factory();

    wrapper.vm.registryCrds = [
      { spec: {}, metadata: { namespace: 'ns1', name: 'reg1' } },
      { spec: { repositories: [] }, metadata: { namespace: 'ns2', name: 'reg2' } },
    ];
    expect(wrapper.vm.repositoryOptions).toEqual(['Any']);
  });

  test('registryOptions returns "Any" when registryCrds is empty', () => {
    const wrapper = factory();

    wrapper.vm.registryCrds = [];
    expect(wrapper.vm.registryOptions).toEqual(['Any']);
  });

  test('registryOptions returns namespace/name strings from registryCrds', () => {
    const wrapper = factory();

    wrapper.vm.registryCrds = [
      { metadata: { namespace: 'ns1', name: 'reg1' } },
      { metadata: { namespace: 'ns2', name: 'reg2' } },
    ];

    expect(wrapper.vm.registryOptions.sort()).toEqual(['Any', 'ns1/reg1', 'ns2/reg2'].sort());
  });

  test('handles registryCrds being undefined', () => {
    const wrapper = factory();

    wrapper.vm.registryCrds = undefined;

    expect(wrapper.vm.repositoryOptions).toEqual(['Any']);
    expect(wrapper.vm.registryOptions).toEqual(['Any']);
  });

  test('successfully dispatches growl/success after download', async() => {
    const wrapper = factory();

    // Mock SBOM return value from cluster/find
    const sbom = { metadata: { name: 'my-sbom' }, spdx: { foo: 'bar' } };

    (wrapper.vm as any).$store.dispatch = jest.fn().mockImplementation((action) => {
      if (action === 'cluster/find') return Promise.resolve(sbom);

      return Promise.resolve();
    });

    const rows = [{ id: 'sb1' }];

    await (wrapper.vm as any).downloadSbom(rows);

    // saveAs should be called
    expect(require('file-saver').saveAs).toHaveBeenCalled();
    // growl/success is called
    expect((wrapper.vm as any).$store.dispatch).toHaveBeenCalledWith(
      'growl/success',
      expect.objectContaining({
        title:   'Success',
        message: 'SBOM downloaded successfully',
      }),
      { root: true }
    );
  });

  test('dispatches growl/error if cluster/find throws', async() => {
    const wrapper = factory();

    (wrapper.vm as any).$store.dispatch = jest.fn().mockImplementation((action) => {
      if (action === 'cluster/find') throw new Error('boom');

      return Promise.resolve();
    });

    const rows = [{ id: 'sb2' }];

    await (wrapper.vm as any).downloadSbom(rows);

    expect((wrapper.vm as any).$store.dispatch).toHaveBeenCalledWith(
      'growl/error',
      expect.objectContaining({
        title:   'Error',
        message: 'Failed to download SBOM',
      }),
      { root: true }
    );
  });

  test('successfully dispatches growl/success after downloadJson', async() => {
    const wrapper = factory();

    const vulReport = { report: { results: [{ vulnerabilities: [] }] } };

    // Mock $store.dispatch to return a valid vulnerability report
    (wrapper.vm as any).$store.dispatch = jest.fn().mockImplementation((action) => {
      if (action === 'cluster/find') return Promise.resolve(vulReport);

      return Promise.resolve();
    });

    const rows = [{ id: 'v1' }];

    // Call the method
    await (wrapper.vm as any).downloadJson(rows);

    // saveAs should be called
    expect(require('file-saver').saveAs).toHaveBeenCalled();
    // growl/success should be called
    expect((wrapper.vm as any).$store.dispatch).toHaveBeenCalledWith(
      'growl/success',
      expect.objectContaining({
        title:   'Success',
        message: 'Vulnerability report downloaded successfully',
      }),
      { root: true }
    );
  });

  test('dispatches growl/error if cluster/find throws', async() => {
    const wrapper = factory();

    (wrapper.vm as any).$store.dispatch = jest.fn().mockImplementation((action) => {
      if (action === 'cluster/find') throw new Error('boom');

      return Promise.resolve();
    });

    const rows = [{ id: 'v2' }];

    await (wrapper.vm as any).downloadJson(rows);

    expect((wrapper.vm as any).$store.dispatch).toHaveBeenCalledWith(
      'growl/error',
      expect.objectContaining({
        title:   'Error',
        message: 'Failed to download vulnerability report',
      }),
      { root: true }
    );
  });

  test('successfully dispatches growl/success after downloadCsv', async() => {
    const wrapper = factory();

    const vulReport = { report: { results: [{ vulnerabilities: [{ id: 'v1' }] }] } };

    // Mock $store.dispatch to return a valid vulnerability report
    (wrapper.vm as any).$store.dispatch = jest.fn().mockImplementation((action) => {
      if (action === 'cluster/find') return Promise.resolve(vulReport);

      return Promise.resolve();
    });

    const rows = [{ id: 'v1' }];

    // Call the method
    await (wrapper.vm as any).downloadCsv(rows);

    // saveAs should be called
    expect(require('file-saver').saveAs).toHaveBeenCalled();

    // growl/success should be called
    expect((wrapper.vm as any).$store.dispatch).toHaveBeenCalledWith(
      'growl/success',
      expect.objectContaining({
        title:   'Success',
        message: 'Image detail report downloaded successfully',
      }),
      { root: true }
    );
  });

  test('dispatches growl/error if cluster/find throws', async() => {
    const wrapper = factory();

    (wrapper.vm as any).$store.dispatch = jest.fn().mockImplementation((action) => {
      if (action === 'cluster/find') throw new Error('boom');

      return Promise.resolve();
    });

    const rows = [{ id: 'v2' }];

    await (wrapper.vm as any).downloadCsv(rows);

    expect((wrapper.vm as any).$store.dispatch).toHaveBeenCalledWith(
      'growl/error',
      expect.objectContaining({
        title:   'Error',
        message: 'Failed to download image detail report',
      }),
      { root: true }
    );
  });
});

describe('ImageOverview.vue - fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('fetch populates registryCRDs', async() => {
    const registryCrds = [ { metadata: { namespace: 'ns', name: 'reg' }, spec: { repositories: ['repo'] } } ];

    const store: any = {
      dispatch: jest.fn((action: string) => {
        if (action === 'cluster/findAll') {
          return Promise.resolve(registryCrds);
        }
        return Promise.resolve();
      }),
      getters: {},
    };

    const wrapper = factory({}, store);

    await (wrapper.vm as any).$options.fetch.call(wrapper.vm);
    await nextTick();
  });
});


