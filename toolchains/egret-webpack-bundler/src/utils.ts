import * as os from 'os';
import { walk } from '@nodelib/fs.walk';
import * as path from 'path';

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

type Entity = {
    name: string;
    path: string;
}

export function walkDir(root: string) {
    return new Promise<Entity[]>((resolve, reject) => {
        walk(root, (error, entities) => {
            if (error) {
                reject(error);
            }
            else {
                entities.forEach((e) => e.path = path.relative(root, e.path).split('\\').join('/'));
                resolve(entities);
            }

        });
    });

}