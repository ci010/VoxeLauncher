<template>
  <vue-particles v-if="loading" color="#dedede" style="position: absolute; width: 100%; height: 100%;" />
  <v-layout v-else fill-height>
    <v-navigation-drawer :value="true" mini-variant stateless dark style="border-radius: 2px 0 0 2px;"
                         class="moveable">
      <v-toolbar flat class="transparent">
        <v-list class="pa-0 non-moveable">
          <v-list-tile avatar @click="goBack">
            <v-list-tile-avatar>
              <v-icon dark>
                arrow_back
              </v-icon>
            </v-list-tile-avatar>
          </v-list-tile>
        </v-list>
      </v-toolbar>
      <v-list class="non-moveable">
        <v-divider dark style="display: block !important;" />
        <v-list-tile :disabled="!logined" replace to="/">
          <v-list-tile-action>
            <v-icon>home</v-icon>
          </v-list-tile-action>
        </v-list-tile>
        <v-list-tile :disabled="!logined" replace to="/profiles">
          <v-list-tile-action>
            <v-icon>apps</v-icon>
          </v-list-tile-action>
        </v-list-tile>
        <v-list-tile :disabled="!logined" replace to="/user">
          <v-list-tile-action>
            <v-icon>person</v-icon>
          </v-list-tile-action>
        </v-list-tile>
        <v-spacer />
      </v-list>
      <v-list class="non-moveable" style="position: absolute; bottom: 0px;">
        <v-list-tile replace to="/setting">
          <v-list-tile-action>
            <v-icon dark>
              settings
            </v-icon>
          </v-list-tile-action>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-layout style="padding: 0; background: transparent; max-height: 100vh;" fill-height>
      <v-card class="main-body" color="grey darken-4">
        <vue-particles color="#dedede" style="position: absolute; width: 100%; height: 100%;" click-mode="repulse" />
        <transition name="fade-transition" mode="out-in">
          <keep-alive>
            <router-view />
          </keep-alive>
        </transition>
        <notifier />
        <context-menu />
      </v-card>
    </v-layout>
  </v-layout>
</template>

<script>
import 'renderer/assets/common.css';

export default {
  data: () => ({
    loading: false, // disable for now, but it'll be abled if the loading process is too slow..
    localHistory: [],
    timeTraveling: false,
  }),
  computed: {
    logined() {
      return this.$repo.getters.logined;
    },
  },
  watch: {},
  created() {
    this.$router.afterEach((to, from) => {
      if (!this.timeTraveling) this.localHistory.push(from.fullPath);
    });
  },
  mounted() {
    this.$electron.ipcRenderer.once('vuex-sync', () => {
      this.loading = false;
    });
    if (!this.logined) {
      this.$router.push('/login');
    }
  },
  methods: {
    goBack() {
      if (!this.logined && this.$route.path === '/login') {
        return;
      }
      this.timeTraveling = true;
      const before = this.localHistory.pop();
      if (before) {
        this.$router.replace(before);
      }
      this.timeTraveling = false;
    },
  },
};
</script>

<style>
.clip-head {
  clip-path: inset(0px 30px 30px 0px) !important;
  width: 64px;
  height: auto; /*to preserve the aspect ratio of the image*/
}
.v-input__icon--prepend {
  margin-right: 7px;
}
</style>

<style scoped=true>
.main-body {
  max-width: 690px;
  width: 100%;
  border-radius: 0px 2px 2px 0;
}
</style>
