import * as os from 'os';

export function getNetworkAddress(): string {

    const ifaces = os.networkInterfaces();
    const ips: string[] = [];
    Object.keys(ifaces).forEach(function (ifname) {
        const alias = 0;
        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }
            ips.push(iface.address);
        });
    });

    return ips[0];
}