<script>
import { Banner } from '@components/Banner';
import { workloadsVulnerabilityreports } from '@sbomscanner-ui-ext/tmp/workloads';
import { constructImageName } from '@sbomscanner-ui-ext/utils/image';
import { getHighestScore, getPackagePath, getScoreNum, getSeverityNum } from '@sbomscanner-ui-ext/utils/report';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import day from 'dayjs';
import { workloadVulnerabilities } from '../tmp/workloadVulnerabilities';
import DownloadFullReportBtn from './common/DownloadFullReportBtn.vue';
import ImageTableSet from './common/ImageTableSet.vue';
import VulnerabilityTableSet from './common/VulnerabilityTableSet.vue';

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
      imagesReport:                  [],
      workloadDetailReport:          [],
      vulnerabilityJsonReport:       {},
      workloadsVulnerabilityreports: workloadsVulnerabilityreports,
      containerSpec:                 null,
      activeTab:                     'images',
      workloadType:                  '',
      workloadName:                  '',
      containerMap:                  new Map(),
      filters:                       {
        severity: null, // Consume this filter in the table components to filter based on severity
      },
    };
  },
  // Make up mock data for container name in imageMetadata
  fetch() {
    const matchedContainers = this.workloadsVulnerabilityreports.containers;

    this.workloadName = this.workloadsVulnerabilityreports.metadata.name;
    this.containerSpec = this.workloadsVulnerabilityreports.spec.containers;
    this.workloadType = this.workloadsVulnerabilityreports.metadata.ownerReferences[0]?.kind || '';
    this.imagesReportFileName = `workload-images-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.csv`;
    this.affactingCvesReportFileName = `workload-affecting-cves-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.csv`;
    this.workloadVulnerabilityReportFileName = `${ this.workloadName }-vulnerability-report_${ day(new Date().getTime()).format('MMDDYYYY_HHmmss') }.json`;
    this.parseImagesData(matchedContainers);
    this.parseVulnerabilitiesData(matchedContainers);
    this.vulnerabilityJsonReport = this.getVulnerabilityJsonReport(matchedContainers);
    this.imagesReport = this.getImagesReport(this.images, this.workloadType);
    this.workloadDetailReport = this.getWorkloadDetailReport(matchedContainers);
  },
  methods: {
    parseImagesData(containers) {

      this.containerSpec.forEach((container) => {
        this.containerMap.set(container.name, container.imageRef);
      });

      containers.forEach((container) => {
        container.vulnerabilityReports.forEach((report) => {
          this.images.push({
            metadata: {
              container: container.name,
              namespace: this.containerMap.get(container.name)?.namespace || this.t('imageScanner.general.unknown'),
            },
            ...report
          });
        });
      });
    },
    parseVulnerabilitiesData(containers) {
      this.vulnerabilityMap = new Map();
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
                  images:      imageRefs
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
    },
    getImagesReport(images, workloadType) {
      const headers = [
        'IMAGE REFERENCE',
        'REGISTRY',
        'REPOSITORY',
        'PLATFORM',
        'DIGEST',
        'WORKLOAD NAME',
        'TYPE',
        'NAMESPACE',
        'IMAGES USED',
        'AFFECTING CVEs',
        'CVEs(Critical)',
        'CVEs(High)',
        'CVEs(Medium)',
        'CVEs(Low)',
        'CVEs(None)'
      ];

      const csvRows = [headers.join(',')];

      images.forEach((image) => {
        const row = [
          `"${ constructImageName(image.imageMetadata) || '' }"`,
          `"${ image.imageMetadata?.registryURI || '' }"`,
          `"${ image.imageMetadata?.repository || '' }"`,
          `"${ image.imageMetadata?.platform || '' }"`,
          `"${ image.imageMetadata?.digest || '' }"`,
          `"${ image.metadata?.container || '' }"`,
          `"${ workloadType }"`,
          `"${ image.metadata?.namespace || '' }"`,
          `"${ (image.metadata?.images || []).join(';') }"`,
          `"${ (image.report?.summary?.critical + image.report?.summary?.high + image.report?.summary?.medium + image.report?.summary?.low + image.report?.summary?.unknown) || 0 }"`,
          `"${ (image.report?.summary?.critical) || 0 }"`,
          `"${ (image.report?.summary?.high) || 0 }"`,
          `"${ (image.report?.summary?.medium) || 0 }"`,
          `"${ (image.report?.summary?.low) || 0 }"`,
          `"${ (image.report?.summary?.unknown) || 0 }"`,
        ];

        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    },
    getWorkloadDetailReport(containers) {
      const flattenWorkloadDetails = this.flattenWorkloadDetails(containers);
      const headers = [
        'WORKLOAD NAME',
        'NAMESPACE',
        'KIND',
        'CONTAINER',
        'IMAGE REFERENCE',
        'PLATFORM',
        'DIGEST',
        'CVE_ID',
        'SCORE',
        'SEVERITY',
        'PACKAGE',
        'FIX AVAILABLE',
        'FIXED VERSION',
        'PACKAGE VERSION',
        'PACKAGE PATH',
        'DESCRIPTION'
      ];
      const csvRows = [headers.join(',')];

      flattenWorkloadDetails.forEach((item) => {
        const row = [
          `"${ item.workloadName || '' }"`,
          `"${ item.namespace || '' }"`,
          `"${ item.kind || '' }"`,
          `"${ item.container || '' }"`,
          `"${ item.imageReference || '' }"`,
          `"${ item.platform || '' }"`,
          `"${ item.digest || '' }"`,
          `"${ item.cveId || '' }"`,
          `"${ item.score || '' }"`,
          `"${ item.severity || '' }"`,
          `"${ item.package || '' }"`,
          `"${ item.fixAvailable || '' }"`,
          `"${ item.fixedVersion || '' }"`,
          `"${ item.packageVersion || '' }"`,
          `"${ item.packagePath || '' }"`,
          `"${ (item.description || '').replace(/"/g, '""') }"` // Escape double quotes in description
        ];

        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    },
    flattenWorkloadDetails(containers) {
      const rec = [];

      containers.forEach((container) => {

        container.vulnerabilityReports.forEach((report) => {
          const imageRef = `${report.imageMetadata.registryURI}/${report.imageMetadata.repository}:${report.imageMetadata.tag}`;

          report.report.results.forEach((result) => {
            result.vulnerabilities.forEach((vul) => {
              rec.push({
                workloadName:   this.workloadName,
                namespace:      this.containerMap.get(container.name)?.namespace || this.t('imageScanner.general.unknown'),
                kind:           this.workloadType,
                container:      container.name,
                imageReference: imageRef,
                platform:       report.imageMetadata.platform || '',
                digest:         report.imageMetadata.digest || '',
                cveId:          vul.cve,
                score:          getHighestScore(vul.cvss),
                severity:       vul.severity?.toLowerCase() || this.t('imageScanner.general.unknown'),
                package:        vul.packageName,
                fixAvailable:   vul.fixedVersions && vul.fixedVersions.length > 0 ? 'Yes' : 'No',
                fixedVersion:   vul.fixedVersions ? vul.fixedVersions.join(', ') : '',
                packageVersion: vul.installedVersion,
                packagePath:    getPackagePath(vul.purl),
                description:    vul.description,
              });
            });
          });
        });
      });

      return rec;
    },
    getVulnerabilityJsonReport(containers) {
      return containers.map((container) => {
        return container.vulnerabilityReports;
      });
    }
  },
  watch: {
    '$route.query.severity': {
      immediate: true,
      handler(severity) {
        if (severity) {
          // Apply the filter
          this.filters.severity = severity;
          
          // Clear the query param
          this.$router.replace({
            path: this.$route.path,
            hash: this.$route.hash,
            query: {}
          });
        }
      }
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
      :report-meta="{
        mainResourceIndex: 1,
        csvReportFileName1: activeTab === 'images' ? imagesReportFileName : affactingCvesReportFileName,
        jsonReportFileName: workloadVulnerabilityReportFileName,
        csvReportBtnName1: activeTab === 'images' ? t('imageScanner.workloads.buttons.downloadImagesCsv') : t('imageScanner.workloads.buttons.downloadWorkloadDetailCsv'),
        jsonReportBtnName: t('imageScanner.workloads.buttons.downloadVulnerabilityJson'),
      }"
      :csv-report-data1="activeTab === 'images' ? imagesReport : workloadDetailReport"
      :json-report-data="vulnerabilityJsonReport"
    />
  </div>
  <div>
      <Tabbed
        :showExtensionTabs="false"
        :use-hash="false"
        class="workload-tabs"
        @changed="({selectedName}) => {activeTab = selectedName;}"
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