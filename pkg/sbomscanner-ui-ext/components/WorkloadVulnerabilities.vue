<script>
import { workloadVulnerabilities } from '../tmp/workloadVulnerabilities';
import VulnerabilityTableSet from './common/VulnerabilityTableSet.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import { Banner } from '@components/Banner';
import ImageTableSet from './common/ImageTableSet.vue';
import { workloadsVulnerabilityreports } from '@sbomscanner-ui-ext/tmp/workloads';
import { getHighestScore, getSeverityNum, getScoreNum, getPackagePath } from '@sbomscanner-ui-ext/utils/report';
import DownloadFullReportBtn from './common/DownloadFullReportBtn.vue';

export default {
  name:       'WorkloadVulnerabilitiesGrid',
  components: {
    VulnerabilityTableSet,
    ImageTableSet,
    Tab,
    Tabbed,
    Banner,
    DownloadFullReportBtn,
  },
  data() {
    return {
      mockdataVul:                   workloadVulnerabilities,
      vulnerabilities:               [],
      images:                        [],
      workloadsVulnerabilityreports: workloadsVulnerabilityreports
    };
  },
  // Make up mock data for container name in imageMetadata
  fetch() {
    const workloadName = this.$route.path.split('/').pop();
    const matchedContainers = this.workloadsVulnerabilityreports.containers.filter((container) => container.name === workloadName);

    this.parseImagesData(matchedContainers);
    this.parseVulnerabilitiesData(matchedContainers);
  },
  methods: {
    parseImagesData(containers) {

      containers.forEach((container) => {
        container.vulnerabilityReports.forEach((report) => {
          this.images.push({
            metadata: {
              container: container.name
            },
            ...report
          });
        });
      });
      console.log('Parsed images data: ', this.images);
    },
    parseVulnerabilitiesData(containers) {
      this.vulnerabilityMap = new Map();
      console.log('Parsing vulnerabilities data from containers: ', containers);

      containers.forEach((container) => {

        container.vulnerabilityReports.forEach((report) => {
          const imageRefs = [];

          report.report.results.forEach((result) => {
            const imageRef = `${report.imageMetadata.registryURI}/${report.imageMetadata.repository}:${report.imageMetadata.tag}`;

            imageRefs.push(imageRef);

            result.vulnerabilities.forEach((vul) => {
              if (this.vulnerabilityMap.has(vul.cve)) {
                const existingVul = this.vulnerabilityMap.get(vul.cve);

                existingVul.occurrences += 1;
                existingVul.images = Array.from(new Set([...(existingVul.images || []), imageRef]));
                this.vulnerabilityMap.set(vul.cve, existingVul);
              } else {
                this.vulnerabilityMap.set(vul.cve, {
                  ...vul,
                  occurrences: 1,
                  images:   imageRefs
                });
              }
            });
          });
        });
      });
      this.vulnerabilities = Array.from(this.vulnerabilityMap.values());

      this.vulnerabilities =  this.vulnerabilities.map((vuln, index) => {
        const score = getHighestScore(vuln.cvss);

        return ({
          id:               `${ vuln.cve }-${ vuln.packageName }-${ index }`, // Create unique ID
          cveId:            vuln.cve,
          score,
          scoreNum:         getScoreNum(score),
          package:          vuln.packageName,
          packageVersion:   vuln.installedVersion,
          packagePath:      getPackagePath(vuln.purl),
          fixAvailable:     vuln.fixedVersions && vuln.fixedVersions.length > 0,
          fixVersion:       vuln.fixedVersions ? vuln.fixedVersions.join(', ') : '',
          severity:         vuln.severity?.toLowerCase() || this.t('imageScanner.general.unknown'),
          severityNum:      getSeverityNum(vuln.severity),
          exploitability:   vuln.suppressed ? this.t('imageScanner.imageDetails.suppressed') : this.t('imageScanner.imageDetails.affected'),
          description:      vuln.description,
          title:            vuln.title,
          references:       vuln.references || [],
          // Add diffID for layer grouping
          diffID:           vuln.diffID,
          installedVersion: vuln.installedVersion,
          images:           vuln.images || [],
        });
      });
    }
  }
};

</script>

<template>
  <div class="vul-header">
    <Banner color="info" class="vul-banner">
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
    <!-- Download Full Report Dropdown -->
    <DownloadFullReportBtn
      class="vul-report-menu-btn"
      :image-name="''"
      :vulnerability-details="[]"
      :vulnerability-report="[]"
    />
  </div>
  <div>
      <Tabbed
        :showExtensionTabs="false"
        class="workload-tabs"

      >
        <Tab :weight="2" :label="t('imageScanner.workloads.tabs.images')" name="images">
          <ImageTableSet
            :rows="images"
            :isInWorkloadContext="true"
          />
        </Tab>
        <Tab :weight="1" :label="t('imageScanner.workloads.tabs.affectingCVEs')" name="affectingCVEs">
          <VulnerabilityTableSet
            :vulnerabilityDetails="vulnerabilities"
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
.vul-header {
  display: flex;
  height: 40px;
  justify-content: center;
  align-items: center;
  gap: -1px;
  .vul-banner {
    display: flex;
    padding: 10px 16px;
    align-items: center;
    gap: 4px;
    flex: 1 0 0;
    padding-left: 0;
  }
}
.workload-tabs {
  margin-top: 24px;
}
</style>