declare class PlayerModel {
    constructor(option: {
        skin: string | Buffer | HTMLImageElement,
        cape: string | Buffer | HTMLImageElement,
        isSlim: boolean,
    }) { }

    readonly root: THREE.Object3D;

    updateSkin(skin: string | Buffer | HTMLImageElement, isSlim: boolean): this;
    updateCape(cape: string | Buffer | HTMLImageElement): this;
    name(name: string): this;
    say(speak: string, expire?: number): this;
}
declare namespace PlayerModel {
    class Animation { }
    class Animations { }
}

export = PlayerModel