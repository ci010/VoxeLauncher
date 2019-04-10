import buildNameTag from './lib/nametag';
import buildChatBox from './lib/bubble';
import convert from './lib/skin.convert';
import format from './lib/skin.format';

const THREE = require('three');

const FACE = {
    left: 0,
    right: 1,
    top: 2,
    bottom: 3,
    front: 4,
    back: 5,
};

const defaultSkin = 'data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAFDUlEQVR42u2a20sUURzH97G0LKMotPuWbVpslj1olJXdjCgyisowsSjzgrB0gSKyC5UF1ZNQWEEQSBQ9dHsIe+zJ/+nXfM/sb/rN4ZwZ96LOrnPgyxzP/M7Z+X7OZc96JpEISfWrFhK0YcU8knlozeJKunE4HahEqSc2nF6zSEkCgGCyb+82enyqybtCZQWAzdfVVFgBJJNJn1BWFgC49/VpwGVlD0CaxQiA5HSYEwBM5sMAdKTqygcAG9+8coHKY/XXAZhUNgDYuBSPjJL/GkzVVhAEU5tqK5XZ7cnFtHWtq/TahdSw2l0HUisr1UKIWJQBAMehDuqiDdzndsP2EZECAG1ZXaWMwOCODdXqysLf++uXUGv9MhUHIByDOijjdiSAoH3ErANQD73C7TXXuGOsFj1d4YH4OTJAEy8y9Hd0mCaeZ5z8dfp88zw1bVyiYhCLOg1ZeAqC0ybaDttHRGME1DhDeVWV26u17lRAPr2+mj7dvULfHw2q65fhQRrLXKDfIxkau3ZMCTGIRR3URR5toU38HbaPiMwUcKfBAkoun09PzrbQ2KWD1JJaqswjdeweoR93rirzyCMBCmIQizqoizZkm2H7iOgAcHrMHbbV9KijkUYv7qOn55sdc4fo250e+vUg4329/Xk6QB/6DtOws+dHDGJRB3XRBve+XARt+4hIrAF4UAzbnrY0ve07QW8uHfB+0LzqanMM7qVb+3f69LJrD90/1axiEIs6qIs21BTIToewfcSsA+Bfb2x67OoR1aPPzu2i60fSNHRwCw221Suz0O3jO+jh6V1KyCMGse9721XdN5ePutdsewxS30cwuMjtC860T5JUKpXyKbSByUn7psi5l+juDlZYGh9324GcPKbkycaN3jUSAGxb46IAYPNZzW0AzgiQ5tVnzLUpUDCAbakMQXXrOtX1UMtHn+Q9/X5L4wgl7t37r85OSrx+TYl379SCia9KXjxRpiTjIZTBFOvrV1f8ty2eY/T7XJ81FQAwmA8ASH1ob68r5PnBsxA88/xAMh6SpqW4HRnLBrkOA9Xv5wPAZjAUgOkB+SHxgBgR0qSMh0zmZRsmwDJm1gFg2PMDIC8/nAHIMls8x8GgzOsG5WiaqREgYzDvpTwjLDy8NM15LpexDEA3LepjU8Z64my+8PtDCmUyRr+fFwA2J0eAFYA0AxgSgMmYBMZTwFQnO9RNAEaHOj2DXF5UADmvAToA2ftyxZYA5BqgmZZApDkdAK4mAKo8GzPlr8G8AehzMAyA/i1girUA0HtYB2CaIkUBEHQ/cBHSvwF0AKZFS5M0ZwMQtEaEAmhtbSUoDADH9ff3++QZ4o0I957e+zYAMt6wHkhzpjkuAcgpwNcpA7AZDLsvpwiuOkBvxygA6Bsvb0HlaeKIF2EbADZpGiGzBsA0gnwQHGOhW2snRpbpPexbAB2Z1oicAMQpTnGKU5ziFKc4xSlOcYpTnOIUpzgVmgo+XC324WfJAdDO/+ceADkCpuMFiFKbApEHkOv7BfzfXt+5gpT8V7rpfYJcDz+jAsB233r6yyBsJ0mlBCDofuBJkel4vOwBFPv8fyYAFPJ+wbSf/88UANNRVy4Awo6+Ig2gkCmgA5DHWjoA+X7AlM//owLANkX0w0359od++pvX8fdMAcj3/QJ9iJsAFPQCxHSnQt8vMJ3v2wCYpkhkAOR7vG7q4aCXoMoSgG8hFAuc/grMdAD4B/kHl9da7Ne9AAAAAElFTkSuQmCC';

function isAllAplha(context, x1, y1, x2, y2) {
    const h = Math.abs(y1 - y2);
    const w = Math.abs(x1 - x2);
    const imgData = context.getImageData(x1, y1, w, h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const alpha = imgData.data[(x + y * w) * 4 + 3];
            if (alpha !== 0) return false;
        }
    }
    return true;
}

class PlayerModel {
    remap(type) {
        const legacy = this.texture.image.height !== this.texture.image.width;
        const model = this.slim ? format.alex : format.steve;
        const mapUv = (mesh, faceIdx, x1, y1, x2, y2) => {
            const geometry = mesh.geometry;
            const texture = mesh.material.map;
            const tileUvW = 1 / texture.image.width;
            const tileUvH = 1 / texture.image.height;
            let UVs = geometry.faceVertexUvs[0][faceIdx * 2];
            x1 *= tileUvW;
            x2 *= tileUvW;
            y1 = 1 - (y1 * tileUvH);
            y2 = 1 - (y2 * tileUvH);
            UVs[0].x = x1; UVs[0].y = y1;
            UVs[1].x = x1; UVs[1].y = y2;
            UVs[2].x = x2; UVs[2].y = y1;
            UVs = geometry.faceVertexUvs[0][faceIdx * 2 + 1];
            UVs[0].x = x1; UVs[0].y = y2;
            UVs[1].x = x2; UVs[1].y = y2;
            UVs[2].x = x2; UVs[2].y = y1;
        };
        const order = ['left', 'right', 'top', 'bottom', 'front', 'back'];
        const map = (mesh, src) => {
            for (let i = 0; i < order.length; i++) {
                const posArr = src[order[i]];
                mapUv(mesh, i, posArr[0], posArr[1], posArr[2], posArr[3]);
            }
        };
        if (type === 'cape') {
            if (this[type]) { map(this[type], model[type]); }
        } else if (type === 'arm') {
            for (const key of ['rightArm', 'leftArm']) {
                map(this[key], model[key]);
                if (!legacy && this[`${key}Layer`]) { map(this[`${key}Layer`], model[key].layer); }
            }
        } else {
            for (const key of Object.keys(model).filter(k => k !== 'cape')) {
                if (this[key]) { map(this[key], model[key]); }
                if (!legacy && this[`${key}Layer`]) { map(this[`${key}Layer`], model[key].layer); }
            }
        }
    }

    remodel() {
        if (!this.root) {
            this.root = new THREE.Object3D();
            const template = this.slim ? format.alex : format.steve;
            const partsNames = Object.keys(template);
            for (const pname of partsNames) {
                const model = template[pname];
                const skinMesh = new THREE.Mesh(new THREE.CubeGeometry(model.w,
                    model.h, model.d),
                pname === 'cape' ? this.capeMaterial : this.material);
                skinMesh.name = pname;
                const box = new THREE.BoxHelper(skinMesh, 0xffffff);
                box.name = `${pname}Box`;
                this[box.name] = box;
                box.visible = false;
                skinMesh.add(box);
                this[skinMesh.name] = skinMesh;
                this.root.add(skinMesh);
                if (model.y) skinMesh.position.y = model.y;
                if (model.x) skinMesh.position.x = model.x;
                if (model.z) skinMesh.position.z = model.z;

                if (pname === 'cape') {
                    skinMesh.rotation.x = 25 * (Math.PI / 180);
                }
                const layer = model.layer;
                if (layer) {
                    const layerMesh = new THREE.Mesh(new THREE.CubeGeometry(layer.w,
                        layer.h, layer.d),
                    this.materialTran);
                    layerMesh.name = `${pname}Layer`;
                    this[layerMesh.name] = layerMesh;
                    skinMesh.add(layerMesh);
                    if (layer.y) layerMesh.position.y = layer.y;
                    if (layer.x) layerMesh.position.x = layer.x;
                    if (layer.z) layerMesh.position.z = layer.z;
                }
            }
            this.remap();
        } else {
            const template = this.slim ? format.alex : format.steve;
            for (const key of ['rightArm', 'leftArm']) {
                let model = template[key];
                this[key].geometry = new THREE.CubeGeometry(model.w, model.h, model.d);
                model = model.layer;
                this[`${key}Layer`].geometry = new THREE.CubeGeometry(model.w, model.h, model.d);
            }
            this.remap('arm');
        }
    }

    constructor(option = {}) {
        let skin = option.skin;
        const { cape, isSlim } = option;

        const can = document.createElement('canvas');
        can.width = 64;
        can.height = 64;
        const texture = new THREE.CanvasTexture(can);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        this.texture = texture;
        texture.name = 'skinTexture';
        this.material = new THREE.MeshBasicMaterial({ map: texture });
        this.materialTran = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        const capeTexture = new THREE.CanvasTexture(document.createElement('canvas'));
        capeTexture.magFilter = THREE.NearestFilter;
        capeTexture.minFilter = THREE.NearestFilter;
        this.capeTexture = capeTexture;
        capeTexture.name = 'capeTexture';
        const capeMaterial = new THREE.MeshBasicMaterial({
            map: this.capeTexture,
        });
        capeMaterial.name = 'capeMaterial';
        this.capeMaterial = capeMaterial;
        capeMaterial.visible = false;

        if (!skin) skin = defaultSkin;
        this.updateSkin(skin, isSlim);
        this.updateCape(cape);
    }

    updateSkin(skin, isSlim) {
        isSlim = isSlim || false;
        const texture = this.texture;
        const slimChange = this.slim === undefined || this.slim == null || this.slim !== isSlim;
        this.slim = isSlim;
        if (slimChange) {
            this.remodel();
        }
        const reload = (img) => {
            const legacy = img.width !== img.height;
            const canvas = texture.image;
            const context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.width;
            context.clearRect(0, 0, img.width, img.width);
            if (legacy) {
                context.drawImage(img, 0, 0, img.width, img.width / 2.0);
                convert(context, img.width);
            } else {
                context.drawImage(img, 0, 0, img.width, img.width);
            }
            texture.needsUpdate = true;
        };
        if (skin instanceof Image) {
            reload(skin);
            return this;
        }
        const img = new Image();
        img.onload = () => { reload(img); };
        if (skin instanceof Buffer) {
            img.src = `data:image/png;base64, ${skin.toString('base64')}`;
        } else if (typeof skin === 'string') {
            img.src = skin;
        }
        return this;
    }

    updateCape(cape) {
        if (cape === undefined) {
            this.capeMaterial.visible = false;
            return this;
        }
        this.capeMaterial.visible = true;
        const texture = this.capeTexture;
        const reload = (img) => {
            texture.image = img;
            texture.needsUpdate = true;
            this.remap('cape');
        };
        if (cape instanceof Image) {
            reload(cape);
            return this;
        }
        const img = new Image();
        img.onload = () => { reload(img); };
        if (cape instanceof Buffer) { img.src = `data:image/png;base64, ${cape.toString('base64')}`; } else if (typeof cape === 'string') { img.src = cape; }
        return this;
    }

    name(name) {
        if (name === undefined || name === '' || name === null) {
            if (this.nameTagObject === null) return this;
            this.root.remove(this.nameTagObject);
            this.nameTagObject = null;
        }
        if (this.nameTagObject) this.clear();
        // build the texture
        const canvas = buildNameTag(name);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        // build the sprite itself
        const material = new THREE.SpriteMaterial({
            map: texture,
            // useScreenCoordinates: false
        });
        const sprite = new THREE.Sprite(material);
        this.nameTagObject = sprite;
        sprite.position.y = 1.15;
        // add sprite to the character
        this.root.add(this.nameTagObject);
        return this;
    }

    load(option) {
        if (!option) return this;
        if (option.skin) { this.loadSkin(option.skin); }
        if (option.cape) { this.loadCape(option.skin); }
        return this;
    }

    say(text, expire = 4) {
        expire *= 1000;
        if (this.speakExpire) {
            clearTimeout(this.speakExpire);
            this.root.remove(this.speakBox);
            this.speakBox = null;
            this.speakExpire = null;
        }
        this.speakExpire = setTimeout(() => {
            this.root.remove(this.speakBox);
            this.speakBox = null;
            this.speakExpire = null;
        }, expire);

        // build the texture
        const canvas = buildChatBox(text);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        // build the sprite itself
        const material = new THREE.SpriteMaterial({
            map: texture,
            // useScreenCoordinates: false
        });
        const sprite = new THREE.Sprite(material);
        this.speakBox = sprite;
        sprite.scale.multiplyScalar(4);
        sprite.position.y = 1.5;
        // add sprite to the character
        this.root.add(this.speakBox);
        return this;
    }
}

export default PlayerModel;
