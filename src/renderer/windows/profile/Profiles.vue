<template>
  <v-app style="background: transparent">
    <v-navigation-drawer
      v-model="drawer"
      :mini-variant.sync="mini"
      hide-overlay
      stateless
    >
      <v-toolbar
        flat
        class="transparent"
      >
        <v-list class="pa-0">
          <v-list-tile avatar>
            <v-list-tile-avatar>
              <img src="https://randomuser.me/api/portraits/men/85.jpg">
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>John Leider</v-list-tile-title>
            </v-list-tile-content>

            <v-list-tile-action>
              <v-btn
                icon
                @click.stop="mini = !mini"
              >
                <v-icon>chevron_left</v-icon>
              </v-btn>
            </v-list-tile-action>
          </v-list-tile>
        </v-list>
      </v-toolbar>

      <v-list
        class="pt-0"
        dense
      >
        <v-divider></v-divider>

        <v-list-tile
          v-for="item in items"
          :key="item.title"
          @click=""
        >
          <v-list-tile-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-tile-action>

          <v-list-tile-content>
            <v-list-tile-title>{{ item.title }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <!-- <div style="min-height: 50px; background: transparent" class="moveable"></div>
        <v-card fill-heigh style="height: 100%; background: transparent;">
            <v-toolbar dark height="70" width="500">
                <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
                <v-tabs slot="extension" v-model="tab" color="dark" align-with-title>
                    <v-tabs-slider color="yellow"></v-tabs-slider>
                    <v-tab v-for="item in items" :key="item">
                        {{ item }}
                    </v-tab>
                </v-tabs>
                <v-layout align-center justify-center>
                    <v-toolbar-title class="mx-auto" style="margin-top: -70px;">
                        <img :src="logo" width="290" height="90" class="moveable">
                    </v-toolbar-title>
                </v-layout>
                <v-btn icon @click="close">
                    <v-icon dark>close</v-icon>
                </v-btn>
            </v-toolbar>

            <v-content style="background-color: white; height: 100%; margin: 0 10px;">
                <v-container fluid>
                    <v-layout justify-center align-center>
                        <v-tabs-items v-model="tab">
                            <v-tab-item v-for="item in items" :key="item">
                                <v-card flat>
                                    <v-card-text>{{ text }}</v-card-text>
                                </v-card>
                            </v-tab-item>
                        </v-tabs-items>
                    </v-layout>
                    <v-btn color="green" dark large>
                        Launch
                    </v-btn>
                </v-container>
            </v-content>
        </v-card> -->
  </v-app>
</template>

<script>
import logo from '@/assets/minecraft.logo.png'

export default {
  data: () => ({
    logo,
    tab: '',
    text: 'shit',
    // items: ['news', 'settings', 'mods'],
    items: [
      { icon: 'dashboard', title: 'ModPackA' },
      { icon: 'dashboard', title: 'ModPackB' },
      { icon: 'dashboard', title: 'ModPackC' },
      { icon: 'global', title: 'Server' },
    ],

    drawer: true,
    mini: true,
  }),
  computed: {
  },
  mounted() {
  },
  methods: {
    close() {
      this.$store.dispatch('exit');
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
