import { ImageVulnerability } from "@pkg/types";

export function imageDetailsToCSV(vuls: ImageVulnerability[]): Object[] {
  if (!vuls) {
    return [];
  }

  return vuls.map((vul) => {
    return {
      CVE_ID: vul.cve,
      SCORE: getScore(vul.cvss, vul.severity),
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

export function getScore(cvss: any, severity: string): string {
  if (!cvss || typeof cvss !== 'object' || !severity) return '';

  // Normalize severity for comparison
  const normalizedSeverity = severity.toLowerCase();

  // Define CVSS v3 severity ranges
  const severityRanges: Record<string, [number, number]> = {
    none:     [0.0, 0.0],
    low:      [0.1, 3.9],
    medium:   [4.0, 6.9],
    high:     [7.0, 8.9],
    critical: [9.0, 10.0],
  };

  // Get range for given severity
  const range = severityRanges[normalizedSeverity];

  if (!range) return '';

  // Search for score in cvss sources that fits the severity range
  for (const source of Object.values(cvss)) {
    if (source && typeof source === 'object' && 'v3score' in source && source.v3score != null) {
      const raw = (source as any).v3score;
      const score = typeof raw === 'number' ? raw : parseFloat(String(raw));

      if (!Number.isFinite(score) || Number.isNaN(score)) {
        continue;
      }

      if (score >= range[0] && score <= range[1]) {
        return `${ source.v3score } (v3)`;
      }
    }
  }

  // If no matching score found, return the first available score (fallback)
  for (const source of Object.values(cvss)) {
    if (source && typeof source === 'object' && 'v3score' in source && source.v3score != null) {
      return `${ source.v3score } (v3)`;
    }
  }

  return '';
}
