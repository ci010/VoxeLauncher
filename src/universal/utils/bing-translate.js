import queryString from 'querystring';
import { net } from 'electron';

class BingTranslator {
    constructor(token) {
        this.token = token;
    }
    
    translate(text, from, to) {
        return new Promise((resolve, reject) => {
            const url = `https://api.microsofttranslator.com/v2/Http.svc/Translate?text=${queryString.escape(text)}&from=${from}&to=${to}`;
            const req = net.request(url);
            let s = '';
            req.setHeader('Authorization', this.token);
            req.on('response', (msg) => {
                msg.on('data', (b) => { s += b.toString(); });
                msg.on('end', () => { resolve(s); });
            });
            req.on('error', e => reject(e));
            req.end();
        });
    }
}
