import { configuredDnsServers } from './dns';

describe('optional DNS resolver configuration', () => {
  it('uses system DNS when no override is configured', () => {
    expect(configuredDnsServers('')).toEqual([]);
    expect(configuredDnsServers(undefined)).toEqual([]);
  });

  it('parses an explicit comma-separated resolver list', () => {
    expect(configuredDnsServers(' 8.8.8.8, 1.1.1.1 ')).toEqual(['8.8.8.8', '1.1.1.1']);
  });
});
