import { jest } from '@jest/globals';
import { shallowMount } from '@vue/test-utils';
import ScoreBadge from '../ScoreBadge.vue';
import { SEVERITY } from '@pkg/types/image';

jest.mock('@pkg/types/image', () => ({
  SEVERITY: {
    CRITICAL: 'critical',
    HIGH:     'high',
    MEDIUM:   'medium',
    LOW:      'low',
  }
}));

describe('ScoreBadge.vue', () => {
  describe('Display Text', () => {
    it('should display "n/a" when score and scoreType are not provided', () => {
      const wrapper = shallowMount(ScoreBadge);

      expect(wrapper.find('.text.na').exists()).toBe(true);
      expect(wrapper.text()).toBe('n/a');
    });

    it('should display "n/a" when only score is provided', () => {
      const wrapper = shallowMount(ScoreBadge, { propsData: { score: '7.5' } });

      expect(wrapper.find('.text.na').exists()).toBe(true);
      expect(wrapper.text()).toBe('n/a');
    });

    it('should display "n/a" when only scoreType is provided', () => {
      const wrapper = shallowMount(ScoreBadge, { propsData: { scoreType: 'CVSS' } });

      expect(wrapper.find('.text.na').exists()).toBe(true);
      expect(wrapper.text()).toBe('n/a');
    });

    it('should display the formatted score and type when both are provided', () => {
      const wrapper = shallowMount(ScoreBadge, {
        propsData: {
          score:     '8.1',
          scoreType: 'CVSSv3'
        }
      });

      expect(wrapper.find('.text.na').exists()).toBe(false);
      expect(wrapper.text()).toBe('8.1 (CVSSv3)');
    });
  });

  describe('Severity Classes (computedSeverity)', () => {
    it('should apply class "na" when severity is not provided', () => {
      const wrapper = shallowMount(ScoreBadge);

      expect(wrapper.classes()).toContain('na');
    });

    it('should apply class "critical" for CRITICAL severity', () => {
      const wrapper = shallowMount(ScoreBadge, { propsData: { severity: 'critical' } });

      expect(wrapper.classes()).toContain(SEVERITY.CRITICAL);
    });

    it('should apply class "critical" for case-insensitive "Critical"', () => {
      const wrapper = shallowMount(ScoreBadge, { propsData: { severity: 'Critical' } });

      expect(wrapper.classes()).toContain(SEVERITY.CRITICAL);
    });

    it('should apply class "high" for HIGH severity', () => {
      const wrapper = shallowMount(ScoreBadge, { propsData: { severity: 'high' } });

      expect(wrapper.classes()).toContain(SEVERITY.HIGH);
    });

    it('should apply class "medium" for MEDIUM severity', () => {
      const wrapper = shallowMount(ScoreBadge, { propsData: { severity: 'medium' } });

      expect(wrapper.classes()).toContain(SEVERITY.MEDIUM);
    });

    it('should apply class "low" for LOW severity', () => {
      const wrapper = shallowMount(ScoreBadge, { propsData: { severity: 'low' } });

      expect(wrapper.classes()).toContain(SEVERITY.LOW);
    });

    it('should apply class "low" for any other severity (e.g., "unknown")', () => {
      const wrapper = shallowMount(ScoreBadge, { propsData: { severity: 'unknown' } });

      expect(wrapper.classes()).toContain(SEVERITY.LOW);
    });
  });
});
