import { net } from 'electron';
import { MojangService } from 'ts-minecraft';

export default {
    namespaced: true,
    actions: {
        fetchNews() {
            return new Promise((resolve, reject) => {
                const req = net.request('https://launchermeta.mojang.com/mc/news.json');
                req.on('response', (response) => {
                    let str = '';
                    response.on('data', (buf) => { str += buf.toString(); });
                    response.on('end', () => { resolve(JSON.parse(str)); });
                });
                req.end();
            });
        },
    },
};
