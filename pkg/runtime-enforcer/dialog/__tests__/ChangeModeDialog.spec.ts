import { shallowMount } from '@vue/test-utils';
import ChangeModeDialog from '../ChangeModeDialog.vue';

const t = jest.fn((key, args, raw) => (raw ? `${ key }:${ JSON.stringify(args) }` : key));

const createResource = (mode: string, name = `policy-${ mode }`) => ({
  nameDisplay: name,
  spec:        { mode },
  save:        jest.fn(),
});

const mountDialog = (resources: any[]) => {
  return shallowMount(ChangeModeDialog as any, {
    props:  { resources },
    global: { mocks: { t } },
  });
};

describe('ChangeModeDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBulk / modeOptions / title / bannerText / confirmText', () => {
    it('uses single-mode copy for one resource', () => {
      const wrapper = mountDialog([createResource('monitor', 'nginx-policy')]);

      expect((wrapper.vm as any).isBulk).toBe(false);
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.activePolicies.changeModeDialog.title.single');
      expect((wrapper.vm as any).bannerText).toBe('runtimeEnforcer.activePolicies.changeModeDialog.banner.single');
      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.activePolicies.changeModeDialog.confirm.single:{"name":"nginx-policy"}'
      );
    });

    it('uses bulk copy and count interpolation for multiple resources', () => {
      const wrapper = mountDialog([
        createResource('monitor', 'a'),
        createResource('protect', 'b'),
        createResource('monitor', 'c'),
      ]);

      expect((wrapper.vm as any).isBulk).toBe(true);
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.activePolicies.changeModeDialog.title.bulk');
      expect((wrapper.vm as any).bannerText).toBe('runtimeEnforcer.activePolicies.changeModeDialog.banner.bulk');
      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.activePolicies.changeModeDialog.confirm.bulk:{"count":3}'
      );
    });

    it('builds monitor/protect mode options', () => {
      const wrapper = mountDialog([createResource('monitor')]);

      expect((wrapper.vm as any).modeOptions).toEqual([
        { value: 'monitor', label: 'runtimeEnforcer.policyProposal.exportDialog.mode.monitor' },
        { value: 'protect', label: 'runtimeEnforcer.policyProposal.exportDialog.mode.protect' },
      ]);
    });
  });

  describe('transitionDirection', () => {
    it('switches from monitor to protect for single monitor policy', () => {
      const wrapper = mountDialog([createResource('monitor')]);

      expect((wrapper.vm as any).transitionDirection).toEqual({ from: 'monitor', to: 'protect' });
    });

    it('switches from protect to monitor for single protect policy', () => {
      const wrapper = mountDialog([createResource('protect')]);

      expect((wrapper.vm as any).transitionDirection).toEqual({ from: 'protect', to: 'monitor' });
    });
  });

  describe('close', () => {
    it('emits close', () => {
      const wrapper = mountDialog([createResource('monitor')]);

      (wrapper.vm as any).close();

      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });

  describe('image + text helpers', () => {
    it('returns monitor/protect icon path and null for enforce', () => {
      const wrapper = mountDialog([createResource('monitor')]);

      expect((wrapper.vm as any).modeIconImgSrc('monitor')).toBeTruthy();
      expect((wrapper.vm as any).modeIconImgSrc('protect')).toBeTruthy();
      expect((wrapper.vm as any).modeIconImgSrc('enforce')).toBeNull();
    });

    it('localizes mode text by lowercasing the mode key', () => {
      const wrapper = mountDialog([createResource('monitor')]);

      expect((wrapper.vm as any).modetext('PROTECT')).toBe('runtimeEnforcer.activePolicies.mode.protect');
      expect(t).toHaveBeenCalledWith('runtimeEnforcer.activePolicies.mode.protect');
    });
  });

  describe('changeMode', () => {
    it('toggles single resource from monitor to protect using transitionDirection', () => {
      const resource = createResource('monitor');
      const wrapper = mountDialog([resource]);

      (wrapper.vm as any).changeMode();

      expect(resource.spec.mode).toBe('protect');
      expect(resource.save).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('toggles single resource from protect to monitor using transitionDirection', () => {
      const resource = createResource('protect');
      const wrapper = mountDialog([resource]);

      (wrapper.vm as any).changeMode();

      expect(resource.spec.mode).toBe('monitor');
      expect(resource.save).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('applies selected targetMode to all resources in bulk mode', () => {
      const resources = [createResource('monitor', 'a'), createResource('protect', 'b')];
      const wrapper = mountDialog(resources);

      (wrapper.vm as any).targetMode = 'protect';
      (wrapper.vm as any).changeMode();

      resources.forEach((resource) => {
        expect(resource.spec.mode).toBe('protect');
        expect(resource.save).toHaveBeenCalledTimes(1);
      });
      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });
});
