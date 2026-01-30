import { mount } from '@vue/test-utils';
import { shallowMount } from '@vue/test-utils';
import RegistryDetailsMeta from '../RegistryDetailsMeta.vue';
import * as jsyaml from 'js-yaml';

jest.mock('../../rancher-rewritten/shell/components/KeyValue.vue', () => ({
  name:     'KeyValue',
  props:    ['propertyName', 'rows'],
  template: '<div class="key-value-mock">{{ propertyName }} {{ rows.length }}</div><div class="rows-mock">{{ rows }}</div>',
}));

describe('RegistryDetailsMeta.vue', () => {
  const baseProps = {
    namespace: {
      label: 'Namespace',
      value: 'default',
    },
    uri: {
      label: 'URI',
      value: 'docker.io',
    },
    schedule: {
      label: 'Schedule',
      value: '5m',
    },
    repositories: {
      label: 'Repositories',
      value: 2,
      list:  [
        { name: 'library/alpine' },
        { name: 'nginx' },
      ],
    },
    platforms: {
      label: 'Platforms',
      value: 2,
      list:  [
        { os: 'linux', arch: 'amd64' },                          // no variant
        {
          os: 'linux', arch: 'arm64', variant: 'v8'
        },          // with variant
      ],
    },
  };

  it('renders namespace, uri, and schedule correctly', () => {
    const wrapper = mount(RegistryDetailsMeta, { propsData: { properties: baseProps } });

    expect(wrapper.text()).toContain('Namespace');
    expect(wrapper.text()).toContain('default');

    expect(wrapper.text()).toContain('URI');
    expect(wrapper.text()).toContain('docker.io');

    expect(wrapper.text()).toContain('Schedule');
    expect(wrapper.text()).toContain('5m');
  });

  it('renders repository count and list with PreviewableButton', () => {
    const wrapper = mount(RegistryDetailsMeta, { propsData: { properties: baseProps } });

    // list
    const repoButtons = wrapper.findAll('.key-value-mock');

    expect(repoButtons.at(0).text()).toBe('Repositories 2');

    const rows = wrapper.findAll('.rows-mock');
    const expectedRows = [
      {
        'key':   'library/alpine',
        'value': 'name: library/alpine\n'
      },
      {
        'key':   'nginx',
        'value': 'name: nginx\n'
      }
    ];
    const actualRows = JSON.parse(rows.at(0).text());

    expect(actualRows[0].key).toBe(expectedRows[0].key);
    expect(actualRows[0].value).toBe(expectedRows[0].value);
    expect(actualRows[1].key).toBe(expectedRows[1].key);
    expect(actualRows[1].value).toBe(expectedRows[1].value);
  });

  it('does not render platform tags when value=0', () => {
    const propsNoPlatforms = JSON.parse(JSON.stringify(baseProps));

    propsNoPlatforms.platforms.value = 0;
    propsNoPlatforms.platforms.list = [];

    const wrapper = mount(RegistryDetailsMeta, { propsData: { properties: propsNoPlatforms } });

    const platformWrapper = wrapper.find('[test-id="platforms"]');

    expect(platformWrapper.exists()).toBe(false);
  });

  it('renders platform tags when value > 0', () => {
    const wrapper = mount(RegistryDetailsMeta, { propsData: { properties: baseProps } });

    const platformTags = wrapper.findAll('.vendor-tag.active');

    expect(platformTags.length).toBe(2);

    expect(platformTags.at(0).text()).toBe('linux / amd64');
    expect(platformTags.at(1).text()).toBe('linux / arm64 / v8');
  });

  it('getPlatformTag returns correct format (variant missing)', () => {
    const wrapper = mount(RegistryDetailsMeta, { propsData: { properties: baseProps } });

    const tag = wrapper.vm.getPlatformTag({
      os:   'linux',
      arch: 'amd64'
      // no variant
    });

    expect(tag).toBe('linux / amd64');
  });

  it('getPlatformTag returns correct format (variant present)', () => {
    const wrapper = mount(RegistryDetailsMeta, { propsData: { properties: baseProps } });

    const tag = wrapper.vm.getPlatformTag({
      os:      'linux',
      arch:    'arm64',
      variant: 'v7'
    });

    expect(tag).toBe('linux / arm64 / v7');
  });
});

describe('RegistryDetailsMeta - repositories computed', () => {

  it('returns mapped repositories with key and YAML value', () => {
    const wrapper = shallowMount(RegistryDetailsMeta, {
      propsData: {
        properties: {
          repositories: {
            list: [
              { name: 'repo1', test: 1 },
              { name: 'repo2', test: 2 }
            ]
          },
          namespace: { label: '', value: '' },
          uri:       { label: '', value: '' },
          schedule:  { label: '', value: '' },
          platforms: {
            label: '', value: 0, list: []
          }
        }
      },
      global: { stubs: { KeyValue: true } }
    });

    expect(wrapper.vm.repositories).toEqual([
      { key: 'repo1', value: 'name: repo1\ntest: 1\n' },
      { key: 'repo2', value: 'name: repo2\ntest: 2\n' }
    ]);
  });

  it('returns empty array when list is empty', () => {
    const wrapper = shallowMount(RegistryDetailsMeta, {
      propsData: {
        properties: {
          repositories: { list: [] },
          namespace:    { label: '', value: '' },
          uri:          { label: '', value: '' },
          schedule:     { label: '', value: '' },
          platforms:    {
            label: '', value: 0, list: []
          }
        }
      },
      global: { stubs: { KeyValue: true } }
    });

    expect(wrapper.vm.repositories).toEqual([]);
  });

  it('throws if repositories.list is undefined', () => {
    const wrapper = shallowMount(RegistryDetailsMeta, {
      propsData: {
        properties: {
          repositories: { list: undefined },
          namespace:    { label: '', value: '' },
          uri:          { label: '', value: '' },
          schedule:     { label: '', value: '' },
          platforms:    {
            label: '', value: 0, list: []
          }
        }
      },
      global: { stubs: { KeyValue: true } }
    });

    expect(wrapper.vm.repositories).toEqual([]);
  });
});