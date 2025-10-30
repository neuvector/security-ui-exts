import { imageDetailsToCSV, downloadCSV, downloadJSON } from '../report';

describe('imageDetailsToCSV', () => {
  test('handles empty or null input', () => {
    expect(imageDetailsToCSV(null as any)).toEqual([]);
    expect(imageDetailsToCSV([])).toEqual([]);
  });

  test('converts vulnerabilities to CSV rows with correct field mapping and sanitization', () => {
    const vuls = [
      { cve: 'CVE-1', cvss: { nvd: { v3score: '9.8' } }, packageName: 'pkg', fixedVersions: ['1.0', '1.1'], severity: 'critical', suppressed: false, installedVersion: '0.9', purl: 'purl-1', description: 'desc "quote"\nnew line' },
      { cve: 'CVE-2', cvss: { redhat: { v3score: '7.0' } }, packageName: 'pkg2', fixedVersions: [], severity: 'high', suppressed: true, installedVersion: '2.0', purl: 'purl-2', description: 'another' },
      { cve: 'CVE-3', cvss: { ghsa: { v3score: '5.0' } }, packageName: 'pkg3', fixedVersions: null, severity: 'low', suppressed: false, installedVersion: '3.0', purl: 'purl-3', description: 'ok' },
      { cve: 'CVE-4', cvss: {}, packageName: 'pkg4', fixedVersions: ['a'], severity: 'none', suppressed: false, installedVersion: '4.0', purl: 'purl-4', description: 'no score' },
    ];

    const rows = imageDetailsToCSV(vuls as any) as any[];

    expect(rows.length).toBe(4);

    expect(rows[0]).toEqual({
      CVE_ID: 'CVE-1',
      SCORE: '9.8 (CVSS v3)',
      PACKAGE: 'pkg',
      "FIX AVAILABLE": '1.0, 1.1',
      SEVERITY: 'critical',
      EXPLOITABILITY: 'Affected',
      "PACKAGE VERSION": '0.9',
      "PACKAGE PATH": 'purl-1',
      DESCRIPTION: "desc 'quote' new line",
    });

    expect(rows[1]).toEqual({
      CVE_ID: 'CVE-2',
      SCORE: '7.0 (CVSS v3)',
      PACKAGE: 'pkg2',
      "FIX AVAILABLE": '',
      SEVERITY: 'high',
      EXPLOITABILITY: 'Suppressed',
      "PACKAGE VERSION": '2.0',
      "PACKAGE PATH": 'purl-2',
      DESCRIPTION: 'another',
    });

    expect(rows[2]).toEqual({
      CVE_ID: 'CVE-3',
      SCORE: '5.0 (CVSS v3)',
      PACKAGE: 'pkg3',
      "FIX AVAILABLE": '',
      SEVERITY: 'low',
      EXPLOITABILITY: 'Affected',
      "PACKAGE VERSION": '3.0',
      "PACKAGE PATH": 'purl-3',
      DESCRIPTION: 'ok',
    });

    expect(rows[3]).toEqual({
      CVE_ID: 'CVE-4',
      SCORE: '',
      PACKAGE: 'pkg4',
      "FIX AVAILABLE": 'a',
      SEVERITY: 'none',
      EXPLOITABILITY: 'Affected',
      "PACKAGE VERSION": '4.0',
      "PACKAGE PATH": 'purl-4',
      DESCRIPTION: 'no score',
    });
  });
});

describe('download utils', () => {
  let mockLink: any;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let createElementSpy: jest.SpyInstance;
  let mockCreateObjectURL: jest.Mock;

  beforeEach(() => {
    mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: { visibility: '' },
      download: '',
    };

    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

    // Mock URL.createObjectURL since it doesn't exist in JSDOM
    mockCreateObjectURL = jest.fn().mockReturnValue('mock-url');
    URL.createObjectURL = mockCreateObjectURL;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clean up the global URL mock
    delete (URL as any).createObjectURL;
  });

  test('downloadCSV creates and clicks a link with the correct CSV content', () => {
    const csvContent = 'col1,col2\nval1,val2';
    const filename = 'report.csv';

    downloadCSV(csvContent, filename);

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/csv;charset=utf-8;');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', filename);
    expect(mockLink.style.visibility).toBe('hidden');
    expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
    expect(mockLink.click).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
  });

  test('downloadJSON creates and clicks a link with the correct JSON content', () => {
    const jsonContent = '{"key": "value"}';
    const filename = 'report.json';

    downloadJSON(jsonContent, filename);

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json;charset=utf-8;');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', filename);
    expect(mockLink.style.visibility).toBe('hidden');
    expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
    expect(mockLink.click).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
  });

  test('downloadCSV does nothing if link.download is not supported', () => {
    const unsupportedLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: { visibility: '' },
      // no 'download' property, so it will be undefined
    };
    createElementSpy.mockReturnValue(unsupportedLink as any);

    downloadCSV('content', 'file.csv');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockCreateObjectURL).not.toHaveBeenCalled();
    expect(unsupportedLink.setAttribute).not.toHaveBeenCalled();
    expect(appendChildSpy).not.toHaveBeenCalled();
    expect(unsupportedLink.click).not.toHaveBeenCalled();
    expect(removeChildSpy).not.toHaveBeenCalled();
  });

  test('downloadJSON does nothing if link.download is not supported', () => {
    const unsupportedLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: { visibility: '' },
    };
    createElementSpy.mockReturnValue(unsupportedLink as any);

    downloadJSON('content', 'file.json');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockCreateObjectURL).not.toHaveBeenCalled();
    expect(unsupportedLink.setAttribute).not.toHaveBeenCalled();
    expect(appendChildSpy).not.toHaveBeenCalled();
    expect(unsupportedLink.click).not.toHaveBeenCalled();
    expect(removeChildSpy).not.toHaveBeenCalled();
  });
});