import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import VexManagement from '../VexManagement.vue';


jest.mock('@sbomscanner-ui-ext/utils/permissions', () => ({ getPermissions: jest.fn(() => ({ canEdit: true, canDelete: true })) }));
// Define RESOURCE constants locally to avoid import issues
const RESOURCE = { VEX_HUB: 'sbomscanner.kubewarden.io.vexhub' };

describe('VexManagement', () => {
  let store: any;
  let wrapper: any;

  const mockVexHubs = [
    {
      id:       'vexhub-1',
      metadata: {
        name:              'vexhub-1',
        creationTimestamp: '2024-01-15T10:30:00Z'
      },
      spec: {
        url:     'https://vex.example.com',
        enabled: true
      }
    },
    {
      id:       'vexhub-2',
      metadata: {
        name:              'vexhub-2',
        creationTimestamp: '2024-01-16T14:20:00Z'
      },
      spec: {
        url:     'https://vex2.example.com',
        enabled: false
      }
    }
  ];

  const mockSchema = {
    id:    'sbomscanner.kubewarden.io.vexhub',
    type:  'schema',
    links: {
      collection: '/v1/sbomscanner.kubewarden.io.vexhubs',
      self:       '/v1/schemas/sbomscanner.kubewarden.io.vexhub'
    },
    resourceMethods:   ['GET', 'DELETE', 'PUT', 'PATCH'],
    collectionMethods: ['GET', 'POST'],
    attributes:        {
      group:      'sbomscanner.kubewarden.io',
      kind:       'VEXHub',
      namespaced: false,
      resource:   'vexhubs',
      verbs:      ['delete', 'deletecollection', 'get', 'list', 'patch', 'create', 'update', 'watch'],
      version:    'v1alpha1'
    }
  };

  beforeEach(() => {
    store = createStore({
      modules: {
        cluster: {
          namespaced: true,
          getters:    {
            'all': () => (type: string) => {
              if (type === RESOURCE.VEX_HUB) return mockVexHubs;

              return [];
            },
            'schemaFor': () => (type: string) => {
              if (type === RESOURCE.VEX_HUB) return mockSchema;

              return null;
            }
          },
          actions: { 'findAll': jest.fn() }
        }
      }
    });

    wrapper = mount(VexManagement, {
      global: {
        plugins: [store],
        mocks:   {
          $route:  { params: { cluster: 'test-cluster' } },
          $router: { push: jest.fn() },
          $t:      (key: string) => key,
          $store:  store
        },
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
            props:    ['to']
          },
          VexHubList: {
            template: '<div class="vex-hub-list">VexHubList Component</div>',
            name:     'VexHubList'
          }
        }
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  describe('Component Initialization', () => {

    it('should display the correct description', () => {
      expect(wrapper.find('.description').text()).toContain('imageScanner.vexManagement.description');
    });
  });
});