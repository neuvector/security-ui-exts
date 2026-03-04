import { shallowMount, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ImageOverview from '../ImageOverview.vue';

// Mock external modules used by the component
jest.mock('file-saver', () => ({ saveAs: jest.fn(() => Promise.resolve()) }));
jest.mock('papaparse', () => ({ unparse: jest.fn(() => 'col1,col2\\n1,2') }));

const fileSaver = jest.requireMock('file-saver') as any;
const Papa = jest.requireMock('papaparse') as any;

describe('ImageOverview.vue', () => {
  const t = (k: string) => k;

  const mountComponent = (overrides: any = {}) => {
    const store = {
      dispatch: jest.fn(() => Promise.resolve()),
      getters:  {},
    };

    const mocks: any = {
      $t:           t,
      t,
      $store:       store,
      $fetchState:  { pending: false },
      $rootGetters: {},
    };

    const stubs = {
      // default shallow stub; tests that need slots will mount with a slot-rendering stub
      SortableTable: { template: '<div />' },
      LabeledSelect: { template: '<div />' },
      Checkbox:      { template: '<div />' },
      ActionMenu:    { template: '<div />' },
    };

    return shallowMount(ImageOverview as any, {
      global: {
        mocks,
        stubs,
      },
      ...overrides,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('downloadCSVReport handles papaparse throwing and dispatches error', async() => {

    // prepare a sample row matching expected shape
    const rows = [ {
      id:             'r2',
      imageReference: 'reg2/repo2:tag2',
      imageMetadata:  {
        registryURI: 'reg2', repository: 'repo2', tag: 'tag2', digest: 'sha256:ddd', registry: 'reg2', platform: 'linux/amd64'
      },
      report: {
        summary: {
          critical: 0, high: 0, medium: 0, low: 0, unknown: 0
        }
      },
      scanResult: {
        critical: 0, high: 0, medium: 0, low: 0, unknown: 0
      },
      metadata: { name: 'img2' }
    } ];

    // make papaparse throw to exercise catch path
    Papa.unparse.mockImplementationOnce(() => {
      throw new Error('parse-failed');
    });

    const storeErr = { dispatch: jest.fn(() => Promise.resolve()), getters: {} };
    const wrapperErr = mountComponent({
      global: {
        mocks: {
          $store: storeErr, $t: t, t, $rootGetters: {}, $fetchState: { pending: false }
        }
      }
    });

    await (wrapperErr.vm as any).downloadCSVFullReport(rows);

    expect(storeErr.dispatch).toHaveBeenCalledWith('growl/error', expect.any(Object), { root: true });
  });

  test('fetch populates rows', async() => {
    const rows = [ {
      id:            'r1',
      imageMetadata: {
        registryURI: 'r1', repository: 'repo1', tag: 't1', registry: 'reg1'
      },
      report: {
        summary: {
          critical: 0, high: 0, medium: 0, low: 0, unknown: 0
        }
      },
      metadata: { namespace: 'ns', name: 'img1' }
    } ];
    const regs = [ { metadata: { namespace: 'ns', name: 'reg' }, spec: { repositories: ['repo'] } } ];

    const store: any = {
      _called:  false,
      dispatch: jest.fn((action: string) => {
        if (action === 'cluster/findAll') {
          // mimic first call for vulnerability reports and second call for registry
          if (!store._called) {
            store._called = true;

            return Promise.resolve(rows);
          }

          return Promise.resolve(regs);
        }

        return Promise.resolve();
      }),
      getters: {},
    };

    const wrapper = mountComponent({
      global: {
        mocks: {
          $store: store, $t: t, t, $fetchState: { pending: false }
        }
      }
    });

    // `fetch` is a component hook and not exposed directly on `vm` in the test harness.
    // Call it via the component options with the vm as context.
    await (wrapper.vm as any).$options.fetch.call(wrapper.vm);

    expect((wrapper.vm as any).rows).toStrictEqual(rows.map((r) => ({ ...r, workloadCount: 0 })));
  });
});
