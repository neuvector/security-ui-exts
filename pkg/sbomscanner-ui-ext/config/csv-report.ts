export type CsvHeaders = readonly [string, ...string[]];

export type CsvCell = string | number | boolean | null | undefined;

export type CsvRowCells<THeaders extends CsvHeaders> = Array<CsvCell> & {
  length: THeaders['length'];
};

export function createCsvRows<THeaders extends CsvHeaders>(headers: THeaders): string[] {
  return [headers.join(',')];
}

export function pushCsvRow<THeaders extends CsvHeaders>(
  csvRows: string[],
  headers: THeaders,
  row: CsvRowCells<THeaders>
): void {
  if (row.length !== headers.length) {
    throw new Error(`CSV row length (${ row.length }) does not match headers length (${ headers.length })`);
  }

  csvRows.push((row as Array<CsvCell>).join(','));
}

export const IMAGE_VULNERABILITY_REPORT_HEADERS = [
  'IMAGE REFERENCE',
  'REGISTRY',
  'REPOSITORY',
  'PLATFORM',
  'DIGEST',
  'IN USE',
  'WORKLOAD COUNT',
  'CVE_ID',
  'SCORE',
  'SEVERITY',
  'PACKAGE',
  'FIX AVAILABLE',
  'FIXED VERSION',
  'EXPLOITABILITY',
  'VEX STATEMENT',
  'PACKAGE VERSION',
  'PACKAGE PATH',
  'DESCRIPTION',
] as const;

export const WORKLOADS_REPORT_HEADERS = [
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
  'CVEs(None)',
] as const;

export const WORKLOAD_CONTEXT_VULNERABILITY_HEADERS = [
  'CVE_ID',
  'SCORE',
  'PACKAGE',
  'FIX AVAILABLE',
  'SEVERITY',
  'EXPLOITABILITY',
  'PACKAGE VERSION',
  'PACKAGE PATH',
  'DESCRIPTION',
] as const;

export const WORKLOAD_DETAIL_REPORT_HEADERS = [
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
  'DESCRIPTION',
] as const;
