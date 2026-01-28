<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="page">
    <!-- Header Section -->
    <div class="header-meta">
      <div class="header-section">
        <h1 class="title">
          <RouterLink
            class="resource-link"
            :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${PAGE.IMAGES}`"
          >
            {{ t('imageScanner.images.title') }}:
          </RouterLink>
          <span class="resource-header-name">
            {{ displayImageName }}
          </span>
          <BadgeState
            :color="overallSeverity"
            :label="t(`imageScanner.enum.cve.${overallSeverity}`)"
            class="severity-badge"
          />
        </h1>
        <div class="header-actions">
          <!-- Download SBOM Button -->
          <DownloadSBOMBtn
            :sbom="sbom"
            :image-name="imageName"
          />
          <!-- Download Full Report Dropdown -->
          <DownloadFullReportBtn
            :image-name="imageName"
            :vulnerability-details="vulnerabilityDetails"
            :vulnerability-report="vulnerabilityReport"
          />
        </div>
      </div>
      <!-- Image Information Section -->
      <RancherMeta :properties="imageDetails" />
    </div>

    <!-- Summary Section -->
    <div
      v-if="vulnerabilityDetails.length > 0"
      class="summary-section"
    >
      <!-- Most Severe Vulnerabilities Section -->
      <MostSevereVulnerabilities :vulnerability-report="loadedVulnerabilityReport" />

      <!-- Severity Distribution Section -->
      <DistributionChart
        v-if="severityDistribution"
        :title="t('imageScanner.imageDetails.severityDistribution.title')"
        :chart-data="severityDistribution"
        color-prefix="cve"
        :description="t('imageScanner.imageDetails.severityDistribution.subTitle')"
        :filter-fn="filterBySeverity"
        :tooltip="t('imageScanner.imageDetails.severityDistribution.tooltip')"
      />
    </div>

    <!-- Vulnerability table with column based filters -->
    <VulnerabilityTableSet
      :vulnerabilityDetails="vulnerabilityDetails"
      :severity="severity"
    />

  </div>
</template>

<script>
import { BadgeState } from '@components/BadgeState';
import { PRODUCT_NAME, RESOURCE, PAGE } from '@sbomscanner-ui-ext/types';
import day from 'dayjs';
import Loading from '@shell/components/Loading';
import DistributionChart from '@sbomscanner-ui-ext/components/DistributionChart';
import RancherMeta from './common/RancherMeta.vue';
import MostSevereVulnerabilities from './common/MostSevereVulnerabilities.vue';
import DownloadSBOMBtn from './common/DownloadSBOMBtn';
import DownloadFullReportBtn from './common/DownloadFullReportBtn.vue';
import { getHighestScore, getSeverityNum, getScoreNum } from '../utils/report';
import { constructImageName } from '@sbomscanner-ui-ext/utils/image';
import VulnerabilityTableSet from './common/VulnerabilityTableSet.vue';

export default {
  name:       'ImageDetails',
  components: {
    BadgeState,
    DistributionChart,
    RancherMeta,
    MostSevereVulnerabilities,
    DownloadSBOMBtn,
    DownloadFullReportBtn,
    Loading,
    VulnerabilityTableSet,
  },
  data() {
    return {
      imageName:                     '',
      severity:                      '',
      loadedVulnerabilityReport:     null,
      loadedSbom:                    null,
      // Cache filtered results to prevent selection issues
      cachedFilteredVulnerabilities: [],
      // Download dropdown state
      showDownloadDropdown:          false,
      PRODUCT_NAME,
      RESOURCE,
      PAGE,
    };
  },

  async fetch() {
    // Get image name from route params
    this.imageName = this.$route.params.id;

    if (!this.imageName) {
      return;
    }

    // Load the image resource and its associated data
    await this.loadImageData();
  },

  computed: {
    // Get the current image resource from Steve API
    currentImage() {
      if (!this.imageName) return null;

      // Get all images and find the one with matching name
      const allImages = this.$store.getters['cluster/all'](RESOURCE.IMAGE) || [];

      return allImages.find((img) => img.metadata.name === this.imageName);
    },

    // Display human-readable image name
    displayImageName() {
      if (!this.currentImage) return this.imageName;

      return constructImageName(this.currentImage.imageMetadata) || this.imageName;
    },

    // Get the vulnerability report for this image
    vulnerabilityReport() {
      return this.loadedVulnerabilityReport;
    },

    // Get the SBOM for this image
    sbom() {
      return this.loadedSbom;
    },

    // Get image details from the current image resource
    imageDetails() {
      if (!this.currentImage) return [];

      return [
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.vulnerabilities'),
          value: this.totalVulnerabilities
        },
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.repository'),
          value: this.currentImage.imageMetadata?.repository || this.t('imageScanner.general.unknown'),
        },
        {
          type:  'route',
          label: this.t('imageScanner.imageDetails.registry'),
          value: this.currentImage.imageMetadata?.registry && this.currentImage.metadata?.namespace ? `${this.currentImage.metadata.namespace}/${this.currentImage.imageMetadata.registry}` : this.t('imageScanner.general.unknown'),
          route: this.currentImage.imageMetadata?.registry && this.currentImage.metadata?.namespace ? this.registryDetailLink : null,
        },
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.architecture'),
          value: this.currentImage.imageMetadata?.platform?.split('/')[0] || this.t('imageScanner.general.unknown'),
        },
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.operatingSystem'),
          value: this.currentImage.imageMetadata?.platform?.split('/')[1] || this.t('imageScanner.general.unknown'),
        },
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.created'),
          value: this.currentImage.metadata ? `${ day(new Date(this.currentImage.metadata?.creationTimestamp).getTime()).format('MMM D, YYYY') } ${ day(new Date(this.currentImage.metadata?.creationTimestamp).getTime()).format('h:mm a') }` : this.t('imageScanner.general.unknown'),
        },
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.imageId'),
          value: this.currentImage.imageMetadata?.digest || this.t('imageScanner.general.unknown'),
        },
        {
          type:  'text',
          label: this.t('imageScanner.imageDetails.layers'),
          value: this.currentImage.layers?.length || this.currentImage.spec?.layers?.length || this.t('imageScanner.general.unknown'),
        }
      ];
    },

    // Get severity distribution from vulnerability report
    severityDistribution() {
      if (!this.vulnerabilityReport) {
        return {
          critical: 0, high: 0, medium: 0, low: 0, unknown: 0
        };
      }

      return {
        critical: this.vulnerabilityReport.report.summary.critical || 0,
        high:     this.vulnerabilityReport.report.summary.high || 0,
        medium:   this.vulnerabilityReport.report.summary.medium || 0,
        low:      this.vulnerabilityReport.report.summary.low || 0,
        unknown:  this.vulnerabilityReport.report.summary.unknown || 0,
      };
    },

    // Get vulnerability details from vulnerability report
    vulnerabilityDetails() {
      if (!this.vulnerabilityReport) {
        return [];
      }

      // Try to access vulnerabilities directly from the report data
      let vulnerabilities = [];

      if (this.vulnerabilityReport.report && this.vulnerabilityReport.report.results) {
        this.vulnerabilityReport.report.results.forEach((result) => {
          if (result && result.vulnerabilities) {
            vulnerabilities = vulnerabilities.concat(result.vulnerabilities);
          }
        });
      }

      // Fallback to model's computed property
      if (vulnerabilities.length === 0) {
        vulnerabilities = this.vulnerabilityReport.vulnerabilities || [];
      }

      // Transform the vulnerability data to match the expected format
      return vulnerabilities.map((vuln, index) => {
        const score = getHighestScore(vuln.cvss);

        return ({
          id:               `${ vuln.cve }-${ vuln.packageName }-${ index }`, // Create unique ID
          cveId:            vuln.cve,
          score,
          scoreNum:         getScoreNum(score),
          package:          vuln.packageName,
          packageVersion:   vuln.installedVersion,
          packagePath:      this.getPackagePath(vuln.purl),
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
          installedVersion: vuln.installedVersion
        });
      });
    },

    totalVulnerabilities() {
      if (!this.vulnerabilityReport) return 0;

      // Try to get vulnerabilities directly from the report data
      let vulnerabilities = [];

      if (this.vulnerabilityReport.report && this.vulnerabilityReport.report.results) {
        this.vulnerabilityReport.report.results.forEach((result) => {
          if (result && result.vulnerabilities) {
            vulnerabilities = vulnerabilities.concat(result.vulnerabilities);
          }
        });
      }

      // Fallback to model's computed property
      if (vulnerabilities.length === 0) {
        vulnerabilities = this.vulnerabilityReport.vulnerabilities || [];
      }

      return vulnerabilities.length;
    },

    overallSeverity() {
      if (!this.vulnerabilityReport) return 'none';

      const distribution = this.severityDistribution;
      const severities = ['critical', 'high', 'medium', 'low', 'none'];

      for (const severity of severities) {
        if (distribution[severity] > 0) {
          return severity;
        }
      }

      return 'none';
    },

    registryDetailLink() {
      return {
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          cluster:   this.$route.params.cluster,
          product:   PRODUCT_NAME,
          resource:  RESOURCE.REGISTRY,
          namespace: this.currentImage.metadata.namespace,
          id:        this.currentImage.imageMetadata?.registry,
        }
      };
    }
  },

  methods: {

    filterBySeverity(severity) {
      this.severity = severity;
    },

    async loadImageData() {
      try {
        // Try multiple approaches to load the image

        // Load all related resources from namespace
        await Promise.all([
          this.$store.dispatch('cluster/findAll', {
            type: RESOURCE.IMAGE,
            opt:  { namespace: 'sbomscanner' }
          }),
          this.$store.dispatch('cluster/findAll', {
            type: RESOURCE.VULNERABILITY_REPORT,
            opt:  { namespace: 'sbomscanner' }
          }),
          this.$store.dispatch('cluster/findAll', {
            type: RESOURCE.SBOM,
            opt:  { namespace: 'sbomscanner' }
          })
        ]);

        // Force component to re-render after data is loaded
        await this.$nextTick();

        // Find the specific image
        const allImages = this.$store.getters['cluster/all'](RESOURCE.IMAGE) || [];
        const foundImage = allImages.find((img) => img.metadata.name === this.imageName);

        if (foundImage) {
          // Find matching vulnerability report and SBOM
          const vulnReports = this.$store.getters['cluster/all'](RESOURCE.VULNERABILITY_REPORT) || [];
          const sboms = this.$store.getters['cluster/all'](RESOURCE.SBOM) || [];

          const matchingVulnReport = vulnReports.find((report) => report.metadata?.name === this.imageName
          );

          const matchingSbom = sboms.find((sbom) => sbom.metadata?.name === this.imageName
          );

          // Set the loaded resources directly
          this.loadedVulnerabilityReport = matchingVulnReport;
          this.loadedSbom = matchingSbom;

          // Force component to re-render after data properties are set
          await this.$nextTick();
          this.$forceUpdate();
        }
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: `Failed to load image data: ${ error.message }`
        }, { root: true });
      }
    },

    getPackagePath(purl) {
      const packagePaths = typeof purl === 'string' ? purl.match(/(?<=:)([^@]+?)(?=@)/) : [];

      return packagePaths && Array.isArray(packagePaths) ? packagePaths[0] : '';
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';

.page {
  display: flex;
  flex-direction: column;
  padding: 24px;
  min-height: 100%;
  gap: 24px;
}

.header-meta {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  gap: 16px;
}

.header-section {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  min-width: 740px;
}

.title {
  max-width: calc(100% - 425px);
  display: flex;
  align-items: center;
  flex-direction: row;
  .resource-header-name {
    display: inline-block;
    flex: 1;
    white-space: nowrap;
    overflow-x: hidden;
    overflow-y: clip;
    text-overflow: ellipsis;
    margin-left: 4px;
  }
}

.severity-badge {
  margin-left: 12px;
  font-size: 12px;
  font-weight: 400;
  &.critical {
      background: $critical-color;
      color: white !important;
    }

    &.high {
      background: $high-color;
      color: white !important;
    }

    &.medium {
      background: $medium-color;
      color: white !important;
    }

    &.low {
      background: $low-color;
      color: $low-na-text !important;
    }

    &.na{
      background: $na-color;
      color: $low-na-text !important;
    }

    &.none{
      background: $na-color;
      color: #717179 !important;
    }
}

.show-properties-link {
  margin-top: 0;
  padding-top: 0;
  justify-content: flex-start !important;
  grid-column: 3;
  grid-row: 4;
}

.show-properties-link a {
  color: #007cba;
  text-decoration: none;
  font-weight: 400;
  font-size: 14px;
}

.show-properties-link a:hover {
  text-decoration: underline;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #6C6C76;
}

.breadcrumb-item {
  color: #007cba;
  cursor: pointer;
}

.breadcrumb-item:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #6C6C76;
}

.summary-section {
  display: flex;
  align-items: flex-start;
  align-self: stretch;
  border-radius: 6px;
  border: solid var(--border-width) var(--input-border);
}

.severity-section {
  display: flex;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.cve-id {
  font-weight: 700;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
}

.cve-link {
  color: #007cba;
  text-decoration: none;
  font-weight: 700;
}

.cve-link:hover {
  text-decoration: underline;
}

.score-badge {
  display: flex;
  align-items: center;
}

.score {
  color: #6C6C76;
  font-size: 13px;
  font-weight: 400;
  background: #E9ECEF;
  padding: 4px 8px;
  border-radius: 4px;
}

.package {
  color: #141419;
  font-weight: 400;
}

.fix-status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-filters {
  margin-bottom: 0;
}

/* Download Dropdown Styles */
.header-actions {
  margin-left: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.dropdown-container {
  position: relative;
  display: flex;
}

.dropdown-main {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

.dropdown-toggle {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  padding: 8px 12px;
  min-width: auto;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  margin-top: 4px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  color: #141419;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-item:first-child {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.dropdown-item:last-child {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

/* Overflow handling for long content */
.info-item .value {
  word-break: break-all;
  overflow-wrap: break-word;
  max-width: 100%;
  display: block;
}
</style>
