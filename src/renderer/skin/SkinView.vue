<template>
    <canvas style="z-index: 10;" :width="width" :height="height" @contextmenu="openMenu">
    </canvas>
</template>

<script>
import Model from './skin-model'
import { ipcRenderer } from 'electron'
let THREE = require('three')
const OrbitControls = require('three-orbit-controls')(THREE)
export default {
    props: {
        width: {
            type: Number,
            default: 210,
        },
        height: {
            type: Number,
            default: 400,
        },
        cape: {
            type: Object,
        },
        rotate: {
            type: Boolean,
            default: true,
        },
        maxDistance: {
            type: Number,
            default: 3,
        },
        minDistance: {
            type: Number,
            default: 1.5,
        },
        slim: {
            type: Boolean,
            default: false,
        },
        data: {
            required: true,
        }
    },
    watch: {
        data(nskin) {
            if (nskin === undefined) {
                this.$setSkin(undefined)
                return;
            }
            this.$setSkin(nskin, this.slim)
        }
    },
    methods: {
        openMenu() {
            const self = this;
            ipcRenderer.emit('contextMenu', [
                {
                    name: 'Export Skin',
                    onclick() {
                    },
                },
                {
                    name: 'Upload Skin',
                    onclick() {
                    },
                },
            ]);
        }
    },
    mounted(e) {
        console.log("===========START===========")
        let canvas = this.$el;
        let gl = canvas.getContext("webgl");
        console.log(gl.getParameter(gl.RENDERER));
        console.log(gl.getParameter(gl.VENDOR));
        console.log(getUnmaskedInfo(gl).vendor);
        console.log(getUnmaskedInfo(gl).renderer);
        function getUnmaskedInfo(gl) {
            let unMaskedInfo = {
                renderer: '',
                vendor: ''
            };
            let dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
            if (dbgRenderInfo != null) {
                unMaskedInfo.renderer = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
                unMaskedInfo.vendor = gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL);
            }
            return unMaskedInfo;
        }
        console.log("===========END===========")
        let renderer = new THREE.WebGLRenderer({ canvas: this.$el, antialias: true, alpha: true });
        let scene = new THREE.Scene();
        let camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.5, 5);
        camera.position.z = 3;
        let character = new Model()
        character.root.translateY(-0.5)
        this.$setSkin = (skin, slim) => {
            character.updateSkin(skin, slim);
        }
        this.$setCape = (cape) => {
            character.updateCape(cape);
        }
        scene.add(character.root)
        if (this.data)
            this.$setSkin(this.data, this.slim)
        camera.lookAt(new THREE.Vector3(0, 0, 0))
        let controls = new OrbitControls(camera, this.$el)
        controls.target = new THREE.Vector3(0, 0, 0)
        controls.enablePan = false
        controls.enableKeys = false
        controls.maxDistance = this.maxDistance;
        controls.minDistance = this.minDistance
        if (this.rotate) {
            controls.autoRotate = true;
            controls.autoRotateSpeed = 4
        }
        requestAnimationFrame(function animate(nowMsec) {
            requestAnimationFrame(animate);
            controls.update()
            renderer.render(scene, camera);
        })
    }
}
</script>