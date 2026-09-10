import { shallowMount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import { nextTick } from 'vue';
import { jest } from '@jest/globals';
import {
  REPO_TYPE, REPO, CHART, VERSION, NAMESPACE
} from '@shell/config/query-params';

import InstallView from '../InstallView.vue';
import { handleGrowl } from '../../utils/handle-growl';
import { refreshCharts, getLatestVersion } from '../../utils/chart';
import {
  PRODUCT_NAME,
  RUNTIME_ENFORCER,
  RUNTIME_ENFORCER_REPOS,
  CERT_MANAGER_CSI_DRIVER,
  CERT_MANAGER_CSI_DRIVER_REPOS,
  CERT_MANAGER,
  CERT_MANAGER_REPOS,
} from '../../types';
import { CATALOG, SECRET, NAMESPACE as NAMESPACE_TYPE } from '@shell/config/types';

jest.mock('lodash/debounce', () => ({
  __esModule: true,
  default:    jest.fn((fn) => fn),
}));
jest.mock('../../utils/handle-growl', () => ({ handleGrowl: jest.fn() }));
jest.mock('../../utils/chart', () => ({
  refreshCharts:    jest.fn(),
  getLatestVersion: jest.fn(() => '1.2.3'),
}));

const InstallWizardStub = {
  name:     'InstallWizard',
  template: `
    <div>
      <slot name="globalRepoAuth" />
      <slot name="repositories" />
      <slot name="install" />
    </div>
  `,
  methods: {
    goToStep() {
    },
  },
};

const createRepo = (name: string, url: string) => ({
  id:       `cluster:${ name }`,
  metadata: { name },
  spec:     { url },
});

type WrapperOptions = {
  repos?: any[];
  charts?: any[];
  installedApps?: any[];
  secrets?: any[];
  schemaMap?: Record<string, boolean>;
  existingNamespaces?: string[];
  install?: boolean;
};

const createWrapper = async(options: WrapperOptions = {}) => {
  const {
    repos = [],
    charts = [],
    installedApps = [],
    secrets = [],
    schemaMap = {},
    existingNamespaces = [],
    install = false,
  } = options;

  const chartSelector = jest.fn(({ repoName, chartName }) => ({
    repoType: 'cluster',
    repoName,
    chartName,
    versions: ['1.2.3'],
  }));
  const router = { push: jest.fn() };
  const fetchType = jest.fn().mockResolvedValue(undefined);

  const store = createStore({
    getters: {
      currentCluster: () => ({ id: 'cluster-1' }),
      currentProduct: () => ({ inStore: 'cluster' }),
      'i18n/t':       () => (key: string) => key,
    },
    modules: {
      catalog: {
        namespaced: true,
        getters:    {
          charts: () => charts,
          repos:  () => repos,
          chart:  () => chartSelector,
        },
      },
      cluster: {
        namespaced: true,
        getters:    {
          schemaFor: () => (schema: string) => !!schemaMap[schema],
          canList:   () => true,
          byId:      () => (_ignoredType: string, id: string) => existingNamespaces.includes(id) ? { metadata: { name: id } } : null,
          all:       () => (type: string) => {
            if (type === SECRET) {
              return secrets;
            }

            if (type === CATALOG.APP) {
              return installedApps;
            }

            return [];
          },
        },
      },
    },
  });

  const dispatch = jest.fn((action: string, payload?: any) => {
    if (action === 'cluster/create') {
      return {
        save: jest.fn().mockResolvedValue(undefined),
        payload,
      };
    }

    if (action === 'cluster/findAll') {
      if (payload?.type === SECRET) {
        return Promise.resolve(secrets);
      }

      if (payload?.type === CATALOG.APP) {
        return Promise.resolve(installedApps);
      }

      return Promise.resolve([]);
    }

    if (action === `${ PRODUCT_NAME }/updateAppcoSecretName` || action === `${ PRODUCT_NAME }/updateNamespaceInputs`) {
      return Promise.resolve();
    }

    return Promise.resolve([]);
  });

  store.dispatch = dispatch as typeof store.dispatch;

  const wrapper = shallowMount(InstallView, {
    global: {
      plugins: [store],
      mocks:   {
        $fetchType: fetchType,
        $route:     { params: {}, query: {} },
        $router:    router,
        $store:     store,
      },
      stubs: {
        InstallWizard:            InstallWizardStub,
        AsyncButton:              true,
        Loading:                  true,
        LabeledInput:             true,
        Checkbox:                 true,
        FileSelector:             true,
        SelectOrCreateAuthSecret: true,
      },
    },
  });

  await flushPromises();
  wrapper.vm.debouncedRefreshCharts = jest.fn().mockResolvedValue(undefined);
  wrapper.vm.install = install;
  await nextTick();

  return {
    wrapper,
    store,
    dispatch,
    router,
    fetchType,
    chartSelector,
  };
};

describe('runtime-enforcer InstallView.vue', () => {
  const mockedGetLatestVersion = getLatestVersion as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('findRepoByChartOrFallback returns chart repo when chart matches', async() => {
    const repo = createRepo(CERT_MANAGER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_REPOS.CHARTS_REPO);
    const { wrapper } = await createWrapper({
      repos:  [repo],
      charts: [{ chartName: CERT_MANAGER.CONTROLLER, repoName: repo.id }],
    });

    expect(wrapper.vm.findRepoByChartOrFallback(CERT_MANAGER.CONTROLLER, 'other', 'oci://missing')).toEqual(repo);
  });

  it('findRepoByChartOrFallback falls back to repo URL, name, or id suffix', async() => {
    const repo = createRepo(CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO);
    const { wrapper } = await createWrapper({ repos: [repo] });

    expect(wrapper.vm.findRepoByChartOrFallback('missing-chart', CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO)).toEqual(repo);
  });

  it('buildDockerConfigJson preserves existing docker config data payload', async() => {
    const { wrapper } = await createWrapper();

    const result = wrapper.vm.buildDockerConfigJson({ data: { '.dockerconfigjson': 'encoded-json' } });

    expect(result).toEqual({ data: { '.dockerconfigjson': 'encoded-json' } });
  });

  it('buildDockerConfigJson preserves existing docker config stringData payload', async() => {
    const { wrapper } = await createWrapper();

    const result = wrapper.vm.buildDockerConfigJson({ stringData: { '.dockerconfigjson': 'plain-json' } });

    expect(result).toEqual({ stringData: { '.dockerconfigjson': 'plain-json' } });
  });

  it('buildDockerConfigJson generates encoded docker auth config from username and password', async() => {
    const { wrapper } = await createWrapper();

    const result = wrapper.vm.buildDockerConfigJson({
      data: {
        username: btoa('user'),
        password: btoa('pass'),
      },
    });

    expect(result.data['.dockerconfigjson']).toBeTruthy();
  });

  it('ensureAuthSecret returns null when there is no selected secret and no hook', async() => {
    const { wrapper } = await createWrapper();

    wrapper.vm.auth.authSecret = '';
    wrapper.vm.secretCreateHook = null;

    await expect(wrapper.vm.ensureAuthSecret()).resolves.toBeNull();
  });

  it('ensureNamespaceExists skips create when namespace already exists', async() => {
    const { wrapper, dispatch } = await createWrapper({ existingNamespaces: ['cert-manager'] });

    await wrapper.vm.ensureNamespaceExists('cert-manager');

    expect(dispatch).not.toHaveBeenCalledWith('cluster/create', expect.objectContaining({ type: NAMESPACE_TYPE }));
  });

  it('ensureNamespaceExists ignores already exists save errors', async() => {
    const { wrapper, store } = await createWrapper();

    store.dispatch = jest.fn(() => ({ save: jest.fn().mockRejectedValue(new Error('already exists')) })) as typeof store.dispatch;

    await expect(wrapper.vm.ensureNamespaceExists('cert-manager')).resolves.toBeUndefined();
    expect(handleGrowl).not.toHaveBeenCalled();
  });

  it('ensureNamespaceExists calls handleGrowl for non-conflict save errors', async() => {
    const { wrapper, store } = await createWrapper();

    store.dispatch = jest.fn(() => ({ save: jest.fn().mockRejectedValue(new Error('boom')) })) as typeof store.dispatch;

    await wrapper.vm.ensureNamespaceExists('cert-manager');

    expect(handleGrowl).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.any(Error),
      store,
    }));
  });

  it('load moves to install step when all required repos already exist', async() => {
    jest.useFakeTimers();
    const { wrapper } = await createWrapper({
      repos: [
        createRepo(CERT_MANAGER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_REPOS.CHARTS_REPO),
        createRepo(CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO),
        createRepo(RUNTIME_ENFORCER_REPOS.CHARTS_REPO_NAME, RUNTIME_ENFORCER_REPOS.CHARTS_REPO),
      ],
    });
    const goToStep = jest.fn();

    wrapper.vm.wizard = { goToStep };
    await wrapper.vm.load();
    jest.runAllTimers();

    expect(wrapper.vm.installSteps[1].ready).toBe(true);
    expect(wrapper.vm.installSteps[2].ready).toBe(true);
    expect(goToStep).toHaveBeenCalledWith(3, true);
    jest.useRealTimers();
  });

  it('load refreshes cert-manager charts first when cert-manager repo is missing', async() => {
    const { wrapper } = await createWrapper();

    wrapper.vm.debouncedRefreshCharts = jest.fn().mockResolvedValue(undefined);
    await wrapper.vm.load();

    expect(wrapper.vm.debouncedRefreshCharts).toHaveBeenCalledWith(true, CERT_MANAGER_REPOS.CHARTS_REPO_NAME);
  });

  it('continueWithGlobalRepoAuth returns early when auth secret is empty and no hook exists', async() => {
    const { wrapper } = await createWrapper();
    const goToStep = jest.fn();

    wrapper.vm.wizard = { goToStep };
    wrapper.vm.auth.authSecret = '';
    wrapper.vm.secretCreateHook = null;

    await wrapper.vm.continueWithGlobalRepoAuth();

    expect(wrapper.vm.installSteps[0].ready).toBe(false);
    expect(goToStep).not.toHaveBeenCalled();
  });

  it('addRepository4CertManager returns false and reports error when repo save fails', async() => {
    const { wrapper, store } = await createWrapper();
    const btnCb = jest.fn();

    store.dispatch = jest.fn((action: string) => {
      if (action === 'cluster/create') {
        return { save: jest.fn().mockRejectedValue(new Error('save failed')) };
      }

      return Promise.resolve([]);
    }) as typeof store.dispatch;

    await expect(wrapper.vm.addRepository4CertManager(btnCb)).resolves.toBe(false);
    expect(handleGrowl).toHaveBeenCalled();
    expect(btnCb).toHaveBeenCalledWith(false);
  });

  it('addRepository4CsiDriver short-circuits when target repo already exists', async() => {
    const { wrapper } = await createWrapper({ repos: [createRepo(CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO)] });

    await expect(wrapper.vm.addRepository4CsiDriver()).resolves.toBe(true);
  });

  it('refreshCsiDriverInstallState falls back to false when app listing fails', async() => {
    const { wrapper, store } = await createWrapper();

    store.dispatch = jest.fn().mockRejectedValue(new Error('fetch failed')) as typeof store.dispatch;

    await wrapper.vm.refreshCsiDriverInstallState();

    expect(wrapper.vm.hasCsiDriverInstalled).toBe(false);
  });

  it('chartRoute reports version error when cert-manager chart version is unavailable', async() => {
    mockedGetLatestVersion.mockReturnValueOnce(undefined);
    const { wrapper, store } = await createWrapper({
      repos:     [createRepo(CERT_MANAGER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_REPOS.CHARTS_REPO)],
      schemaMap: { [CERT_MANAGER.SCHEMA]: false },
      install:   true,
    });

    await wrapper.vm.chartRoute();

    expect(handleGrowl).toHaveBeenCalledWith(expect.objectContaining({ store }));
  });

  it('chartRoute moves back to step 1 when cert-manager install routing throws', async() => {
    const { wrapper, router } = await createWrapper({
      repos:     [createRepo(CERT_MANAGER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_REPOS.CHARTS_REPO)],
      schemaMap: { [CERT_MANAGER.SCHEMA]: false },
      install:   true,
    });
    const goToStep = jest.fn();

    wrapper.vm.wizard = { goToStep };
    router.push.mockImplementation(() => {
      throw new Error('route failed');
    });

    await wrapper.vm.chartRoute();

    expect(wrapper.vm.installSteps[0].ready).toBe(false);
    expect(goToStep).toHaveBeenCalledWith(1);
  });

  it('onFileSelected, registerSecretHook, and onAuthInputChange update local state', async() => {
    const { wrapper } = await createWrapper();
    const hook = jest.fn();

    wrapper.vm.onFileSelected('pem-data');
    wrapper.vm.registerSecretHook(hook);
    wrapper.vm.onAuthInputChange({ publicKey: 'user', privateKey: 'pass' });

    expect(wrapper.vm.auth.caBundle).toBe('pem-data');
    expect(wrapper.vm.secretCreateHook).toBe(hook);
    expect(wrapper.vm.auth.username).toBe('user');
    expect(wrapper.vm.auth.password).toBe('pass');
  });

  it('marks CSI driver installed when installed app matches chart name', async() => {
    const { wrapper } = await createWrapper({
      installedApps: [{
        metadata: { name: 'release-1' },
        spec:     { chart: { metadata: { name: CERT_MANAGER_CSI_DRIVER.CHART_NAME } } },
      }],
    });

    await wrapper.vm.refreshCsiDriverInstallState();

    expect(wrapper.vm.hasCsiDriverInstalled).toBe(true);
  });

  it('goes to step 3 when all required repos are present', async() => {
    const { wrapper } = await createWrapper();
    const goToStep = jest.fn();

    wrapper.vm.wizard = { goToStep };
    await wrapper.vm.onCombinedWatchedChange(
      [{ id: 'cert' }, { id: 'csi' }, { id: 'runtime' }],
      [null, null, null]
    );
    await nextTick();

    expect(wrapper.vm.maxStepNum).toBe(3);
    expect(goToStep).toHaveBeenCalledWith(3, true);
  });

  it('goes to step 1 when any required repo is missing', async() => {
    const { wrapper } = await createWrapper();
    const goToStep = jest.fn();

    wrapper.vm.wizard = { goToStep };
    await wrapper.vm.onCombinedWatchedChange(
      [{ id: 'cert' }, null, { id: 'runtime' }],
      [null, null, null]
    );
    await nextTick();

    expect(wrapper.vm.maxStepNum).toBe(1);
    expect(goToStep).toHaveBeenCalledWith(1, true);
  });

  it('continues from global auth after invoking secret hook', async() => {
    const { wrapper } = await createWrapper();
    const goToStep = jest.fn();

    wrapper.vm.wizard = { goToStep };
    wrapper.vm.auth.authSecret = '';
    wrapper.vm.secretCreateHook = jest.fn().mockResolvedValue({ metadata: { name: 'generated-secret', namespace: 'default' } });

    await wrapper.vm.continueWithGlobalRepoAuth();

    expect(wrapper.vm.secretCreateHook).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.installSteps[0].ready).toBe(true);
    expect(goToStep).toHaveBeenCalledWith(2);
  });

  it('addAllRepositories only adds missing repos', async() => {
    const { wrapper, fetchType, dispatch } = await createWrapper({ repos: [createRepo(CERT_MANAGER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_REPOS.CHARTS_REPO)] });

    await wrapper.vm.addAllRepositories();

    const createdRepoNames = dispatch.mock.calls
      .filter(([action, payload]) => action === 'cluster/create' && payload?.type === CATALOG.CLUSTER_REPO)
      .map(([, payload]) => payload.metadata.name);

    expect(createdRepoNames).not.toContain(CERT_MANAGER_REPOS.CHARTS_REPO_NAME);
    expect(createdRepoNames).toEqual(expect.arrayContaining([
      CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME,
      RUNTIME_ENFORCER_REPOS.CHARTS_REPO_NAME,
    ]));
    expect(fetchType).toHaveBeenCalledWith(CATALOG.CLUSTER_REPO);
  });

  it('pushes cert-manager-csi-driver install route when cert-manager exists but CSI driver is not installed', async() => {
    const { wrapper, router } = await createWrapper({
      repos: [
        createRepo(CERT_MANAGER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_REPOS.CHARTS_REPO),
        createRepo(CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO),
      ],
      schemaMap: {
        [CERT_MANAGER.SCHEMA]:     true,
        [RUNTIME_ENFORCER.SCHEMA]: false,
      },
      installedApps: [],
      install:       true,
    });

    await wrapper.vm.chartRoute();

    expect(router.push).toHaveBeenCalledWith(expect.objectContaining({
      name:   'c-cluster-apps-charts-install',
      params: { cluster: 'cluster-1' },
      query:  expect.objectContaining({
        [REPO_TYPE]: 'cluster',
        [REPO]:      `cluster:${ CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME }`,
        [CHART]:     CERT_MANAGER_CSI_DRIVER.CHART_NAME,
        [VERSION]:   '1.2.3',
        [NAMESPACE]: CERT_MANAGER_CSI_DRIVER_REPOS.NAMESPACE,
      }),
    }));
  });

  it('pushes runtime-enforcer install route when CSI driver is already installed', async() => {
    const { wrapper, router } = await createWrapper({
      repos: [
        createRepo(CERT_MANAGER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_REPOS.CHARTS_REPO),
        createRepo(CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO),
        createRepo(RUNTIME_ENFORCER_REPOS.CHARTS_REPO_NAME, RUNTIME_ENFORCER_REPOS.CHARTS_REPO),
      ],
      schemaMap: {
        [CERT_MANAGER.SCHEMA]:     true,
        [RUNTIME_ENFORCER.SCHEMA]: false,
      },
      installedApps: [{
        metadata: { name: CERT_MANAGER_CSI_DRIVER.CHART_NAME },
        spec:     { chart: { metadata: { name: CERT_MANAGER_CSI_DRIVER.CHART_NAME } } },
      }],
      install: true,
    });

    await wrapper.vm.chartRoute();

    expect(router.push).toHaveBeenCalledWith(expect.objectContaining({
      name:   'c-cluster-apps-charts-install',
      params: { cluster: 'cluster-1' },
      query:  expect.objectContaining({
        [REPO_TYPE]: 'cluster',
        [REPO]:      `cluster:${ RUNTIME_ENFORCER_REPOS.CHARTS_REPO_NAME }`,
        [CHART]:     RUNTIME_ENFORCER_REPOS.CHARTS_REPO_NAME,
        [VERSION]:   '1.2.3',
        [NAMESPACE]: RUNTIME_ENFORCER_REPOS.NAMESPACE,
        name:        RUNTIME_ENFORCER_REPOS.INSTALLATION_NAME,
      }),
    }));
  });

  it('renders install descriptions through l10n keys in the install section', async() => {
    const { wrapper } = await createWrapper({ install: true });

    expect(wrapper.text()).toContain('runtimeEnforcer.installationWizard.install.certManagerDescription');
  });

  it('calls handleGrowl when namespace input persistence fails', async() => {
    const { wrapper, store } = await createWrapper();

    store.dispatch = jest.fn().mockRejectedValueOnce(new Error('persist failed')) as typeof store.dispatch;

    await wrapper.vm.onNamespaceInputsChanged();

    expect(handleGrowl).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.any(Error),
      store,
    }));
  });

  it('initializes debounced chart refresh on mount', async() => {
    await createWrapper();

    expect(refreshCharts).toHaveBeenCalled();
  });
});