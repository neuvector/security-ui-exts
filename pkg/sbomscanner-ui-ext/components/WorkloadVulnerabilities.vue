<script>
import { workloadVulnerabilities } from '../tmp/workloadVulnerabilities';
import VulnerabilityTableSet from './common/VulnerabilityTableSet.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import { Banner } from '@components/Banner';
import ImageTableSet from './common/ImageTableSet.vue';
import { images } from '@sbomscanner-ui-ext/tmp/images';
import { imagesByRepository } from '@sbomscanner-ui-ext/tmp/imagesByRepository';

export default {
  name:       'WorkloadVulnerabilitiesGrid',
  components: {
    VulnerabilityTableSet,
    ImageTableSet,
    Tab,
    Tabbed,
    Banner,
  },
  data() {
    return {
      mockdataVul:        workloadVulnerabilities,
      images:             images,
      imagesByRepository: imagesByRepository
    };
  },
  // Make up mock data for container name in imageMetadata
  fetch() {
    this.images = this.images.map((img) => {
      img.imageMetadata.container = 'example-container';

      return img;
    });
  }
};

</script>

<template>
  <Banner color="info" class="mt-0">
    <span>Data provided by</span>
    <span class="text-underline">SBOMScanner</span>
    <span>, Want to learn more about this extension? Read our</span>
    <a
      href="https://docs.rancher.com/security/sbom-scanner-extension"
      class="text-underline"
      target="_blank">
      documentation
      <i class="icon icon-external-link icon-underline"></i>
    </a>
  </Banner>
  <div>
      <Tabbed
        :showExtensionTabs="false"
        class="workload-tabs"

      >
        <Tab :weight="2" :label="t('imageScanner.workloads.tabs.images')" name="images">
          <ImageTableSet
            :rows="images"
            :rowsByRepo="imagesByRepository"
            :isInWorkloadContext="true"
          />
        </Tab>
        <Tab :weight="1" :label="t('imageScanner.workloads.tabs.affectingCVEs')" name="affectingCVEs">
          <VulnerabilityTableSet
            :vulnerabilityDetails="mockdataVul"
            :isInWorkloadContext="true"
          />
        </Tab>
      </Tabbed>
  </div>
</template>


<style lang="scss" scoped>
.text-underline {
  color: var(--body-text);
  border-bottom: 0.65px solid var(--body-text);
  &:hover {
    text-decoration: none;
  }
}
.icon-underline {
  font-size: 10px;
}
</style>