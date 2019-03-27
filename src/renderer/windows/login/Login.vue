<template>
    <v-app style="background: transparent">
        <div style="min-height: 50px; background: transparent" class="moveable"></div>
        <v-card fill-heigh style="height: 100%; background: transparent;">
            <v-toolbar dark height="70" width="500">
                <v-btn dark flat icon @click="navigate">
                    <transition name="fade" mode="out-in">
                        <v-icon dark v-if="$route.path==='/login'">settings</v-icon>
                        <v-icon dark v-else>arrow_back</v-icon>
                    </transition>
                </v-btn>
                <v-toolbar-title class="mx-auto">
                    <img :src="logo" width="290" height="90" class="moveable" style="top:-55px; position: absolute;">
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="close">
                    <v-icon dark>close</v-icon>
                </v-btn>
            </v-toolbar>
            <transition name="fade" mode="out-in">
                <router-view></router-view>
            </transition>
        </v-card>
    </v-app>
</template>

<script>
import logo from '@/assets/minecraft.logo.png'

export default {
    data: () => ({
        logo,
    }),
    mounted() {
    },
    methods: {
        navigate() {
            if (this.$route.path === '/login') {
                this.$router.replace('/setting')
            } else {
                this.$router.replace('/login')
            }
        },
        close() {
            this.$electron.remote.getCurrentWindow().close()
        },
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
