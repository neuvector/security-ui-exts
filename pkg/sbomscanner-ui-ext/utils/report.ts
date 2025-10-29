import { ImageVulnerability } from "@pkg/types";

export function imageDetailsToCSV(vuls: ImageVulnerability[]): Object[] {
  if (!vuls) {
    return [];
  }

  return vuls.map((vul) => {
    return {
      CVE_ID: vul.cve,
      SCORE: vul.cvss?.nvd?.v3score ? `${ vul.cvss.nvd.v3score } (CVSS v3)` : vul.cvss?.redhat?.v3score ? `${ vul.cvss.redhat.v3score } (CVSS v3)` : vul.cvss?.ghsa?.v3score ? `${ vul.cvss.ghsa.v3score } (CVSS v3)` : '',
      PACKAGE: vul.packageName,
      "FIX AVAILABLE": vul.fixedVersions ? vul.fixedVersions.join(', ') : '',
      SEVERITY: vul.severity,
      EXPLOITABILITY: vul.suppressed ? 'Suppressed' : 'Affected',
      "PACKAGE VERSION": vul.installedVersion,
      "PACKAGE PATH": vul.purl,
      DESCRIPTION: vul.description.replace(/\"/g, "'").replace(/[\r\n]+/g, ' '),
    };
  });
}

export function downloadCSV(csvContent: any, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function downloadJSON(jsonContent: any, filename: string) {
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
