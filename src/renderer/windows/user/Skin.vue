<template>
    <v-app style="background: transparent;">
        <v-card fill-heigh style="height: 100%; background: transparent;">
            <v-toolbar dark height="70" width="500" class="moveable">
                <v-toolbar-title>User</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="close" class="non-moveable">
                    <v-icon dark>close</v-icon>
                </v-btn>
            </v-toolbar>
            <v-card-text style="margin-right: 10px; margin-left: 10px; background: white; user-select: none; width: auto">
                <skin-view :data="skin.data" :slim="skin.slim" :width="width" :height="height"></skin-view>
            </v-card-text>
            <v-card-actions class="" style="margin-right: 10px; margin-left: 10px; background: white;">
                <v-switch color="green" label="Is new version model?" v-model="skin.slim"></v-switch>
            </v-card-actions>
            <v-card-actions class="" style="margin-right: 10px; margin-left: 10px; background: white;">
                <v-btn color="green" dark @click="dropdown">{{$t('export')}}</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="green" dark @click="importDialog">{{$t('import')}}</v-btn>
            </v-card-actions>
        </v-card>
    </v-app>
</template>

<script>

export default {
    data: () => ({
        width: 248,
        height: 400,
        skin: {
            data: '',
            slim: false,
        }
    }),
    components: {
        // SkinView: () => import('./SkinView'),
    },
    computed: {
        playerSkin() { return this.$store.state.user.skin },
    },
    mounted() {
        this.skin.data = this.playerSkin.data;
        this.skin.slim = this.playerSkin.slim;
    },
    methods: {
        close() {
            this.$electron.ipcRenderer.send('user/close')
        },
        reset() {
            this.skin.data = this.playerSkin.data;
            this.skin.slim = this.playerSkin.slim;
        },
        async importDialog() {
            const file = await this.$openDialog();
            const data = await this.$store.dispatch('read', { path: file });
            this.skin.data = data;
        }
    },
}
</script>

<style>
.moveable {
  -webkit-app-region: drag;
  user-select: none;
}

.non-moveable {
  -webkit-app-region: no-drag;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.01s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
