import { shallowMount } from '@vue/test-utils';
import WorkloadTable from '../WorkloadTable.vue';

/* ------------------------------------
   Mock external dependencies
------------------------------------- */

jest.mock('@sbomscanner-ui-ext/utils/report', () => ({
  downloadCSV: jest.fn(),
}))

jest.mock('@sbomscanner-ui-ext/config/table-headers', () => ({
  WORKLOADS_TABLE: []
}))

const { downloadCSV } = require('@sbomscanner-ui-ext/utils/report');

describe('WorkloadTable.vue (Vue 3)', () => {
  let dispatchMock: jest.Mock;

  const factory = (props = {}) => {
    dispatchMock = jest.fn();

    return shallowMount(WorkloadTable, {
      props: {
        workloads: [],
        isInWorkloadContext: false,
        ...props,
      },
      global: {
        mocks: {
          $store: {
            dispatch: dispatchMock,
          },
          t: (key: string) => key,
          imageName: 'test-image',
        },
        stubs: {
          SortableTable: true,
        },
      },
    })
  }

  beforeEach(() => {
    jest.clearAllMocks();

    // mock global day()
    ;(global as any).day = () => ({
      format: () => '01012024_120000',
    })
  })

  /* ------------------------------------
     Mounting
  ------------------------------------- */

  it('mounts successfully', () => {
    const wrapper = factory();

    expect(wrapper.exists()).toBe(true);
  })

  /* ------------------------------------
     Selection logic
  ------------------------------------- */

  it('updates selection correctly', async () => {
    const wrapper = factory();

    await wrapper.vm.onSelectionChange([{ name: 'w1' }]);

    expect(wrapper.vm.selectedWorkloadCount).toBe(1);
    expect(wrapper.vm.selectedRows.length).toBe(1);
  })

  it('handles null selection safely', async () => {
    const wrapper = factory();

    await wrapper.vm.onSelectionChange(null);

    expect(wrapper.vm.selectedWorkloadCount).toBe(0);
    expect(wrapper.vm.selectedRows).toEqual([]);
  })

  /* ------------------------------------
     CSV generation
  ------------------------------------- */

  it('generates CSV from selected rows', async () => {
    const wrapper = factory();

    await wrapper.setData({
      selectedRows: [
        {
          workloadName: 'w1',
          type: 'Deployment',
          namespace: 'default',
          imageUsed: 'nginx',
          affectingCves: 5,
          severity: {
            critical: 1,
            high: 2,
            medium: 3,
            low: 4,
            unknown: 5,
          },
        },
      ],
    });

    const csv = wrapper.vm.generateCSVFromFilteredWorkloads();

    expect(csv).toContain('WORKLOAD_NAME');
    expect(csv).toContain('"w1"');
    expect(csv).toContain('"Deployment"');
    expect(csv).toContain('"5"');
  })

  it('falls back to workloads prop when no selection', () => {
    const workloads = [
      {
        workloadName: 'fallback',
        type: '',
        namespace: '',
        imageUsed: '',
        affectingCves: 0,
        severity: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          unknown: 0,
        },
      },
    ]

    const wrapper = factory({ workloads });

    const csv = wrapper.vm.generateCSVFromFilteredWorkloads();

    expect(csv).toContain('"fallback"');
  })

  /* ------------------------------------
     Download logic
  ------------------------------------- */

  it('shows error when downloading with no selection', () => {
    const wrapper = factory();

    wrapper.vm.downloadCustomReport();

    expect(dispatchMock).toHaveBeenCalledWith(
      'growl/error',
      {
        title: 'Error',
        message: 'No workload report data available for download',
      },
      { root: true }
    );

    expect(downloadCSV).not.toHaveBeenCalled();
  })

  it('downloads CSV and shows success message', async () => {
    const wrapper = factory();

    await wrapper.setData({
      selectedRows: [
        {
          workloadName: 'w1',
          severity: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            unknown: 0,
          },
        },
      ],
      selectedWorkloadCount: 1,
    });

    wrapper.vm.downloadCustomReport();

    expect(downloadCSV).toHaveBeenCalled();

    expect(dispatchMock).toHaveBeenCalledWith(
      'growl/success',
      {
        title: 'Success',
        message: 'Custom report downloaded successfully',
      },
      { root: true }
    );
  });

  it('handles download exception gracefully', async () => {
    downloadCSV.mockImplementation(() => {
      throw new Error('Download failed');
    })

    const wrapper = factory();

    await wrapper.setData({
      selectedRows: [
        {
          workloadName: 'w1',
          severity: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            unknown: 0,
          },
        },
      ],
      selectedWorkloadCount: 1,
    });

    wrapper.vm.downloadCustomReport();

    expect(dispatchMock).toHaveBeenCalledWith(
      'growl/error',
      expect.objectContaining({
        title: 'Error',
      }),
      { root: true }
    );
  });
});
