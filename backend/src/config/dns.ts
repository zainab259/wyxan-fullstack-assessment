import { setServers } from 'node:dns';

export function configuredDnsServers(value = process.env.DNS_SERVERS): string[] {
  return (value ?? '').split(',').map((server) => server.trim()).filter(Boolean);
}

export function configureDns(value = process.env.DNS_SERVERS): void {
  const servers = configuredDnsServers(value);
  if (servers.length > 0) setServers(servers);
}
