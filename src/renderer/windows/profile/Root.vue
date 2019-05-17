<template>
	<v-app style="background: transparent;">
		<vue-particles v-if="loading" color="#dedede" style="position: absolute; width: 100%; height: 100%;"></vue-particles>
		<v-layout v-else fill-height>
			<v-navigation-drawer v-model="drawer" mini-variant stateless dark style="border-radius: 2px 0 0 2px;"
			  class="moveable">
				<v-toolbar flat class="transparent">
					<v-list class="pa-0 non-moveable">
						<v-list-tile avatar @click="goBack">
							<v-list-tile-avatar>
								<v-icon dark>arrow_back</v-icon>
							</v-list-tile-avatar>
						</v-list-tile>
					</v-list>
				</v-toolbar>
				<v-list class="non-moveable">
					<v-divider dark style="display: block !important;"></v-divider>
					<v-list-tile :disabled="!logined" @click="goHome">
						<v-list-tile-action>
							<v-icon>home</v-icon>
						</v-list-tile-action>
					</v-list-tile>
					<v-list-tile :disabled="!logined" @click="goProfiles">
						<v-list-tile-action>
							<v-icon>apps</v-icon>
						</v-list-tile-action>
					</v-list-tile>
					<v-list-tile :disabled="!logined" avatar @click="goUser">
						<v-list-tile-avatar>
							<v-icon dark>person</v-icon>
						</v-list-tile-avatar>
					</v-list-tile>
					<v-spacer></v-spacer>
				</v-list>
				<v-list class="non-moveable" style="position: absolute; bottom: 0px;">
					<v-list-tile avatar @click="goSetting">
						<v-list-tile-avatar>
							<v-icon dark>settings</v-icon>
						</v-list-tile-avatar>
					</v-list-tile>
				</v-list>
			</v-navigation-drawer>
			<v-layout style="padding: 0; background: transparent; max-height: 100vh;" fill-height>
				<v-card class="main-body" color="grey darken-4">
					<vue-particles color="#dedede" style="position: absolute; width: 100%; height: 100%;"></vue-particles>
					<transition name="fade-transition" mode="out-in">
						<router-view></router-view>
					</transition>
					<task-notify></task-notify>
				</v-card>
			</v-layout>
		</v-layout>
	</v-app>
</template>

<script>
import logo from '@/assets/minecraft.logo.png'
import defaultSkin from 'universal/defaultSkin';
import TaskNotify from './TaskNotify';

export default {
  data: () => ({
    logo,
    loading: false, // disable for now, but it'll be abled if the loading process is too slow..
    tab: '',
    drawer: true,
    defaultSkin: { data: defaultSkin, slim: false },
    localHistory: [],
    timeTraveling: false,
  }),
  components: { TaskNotify },
  computed: {
    username() {
      return this.$repo.state.user.name;
    },
    skin() {
      const skin = this.$repo.state.user.skin;
      return skin.data === '' ? this.defaultSkin : this.$repo.state.user.skin;
    },
    logined() {
      return this.$repo.getters['user/logined'];
    },
  },
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
  watch: {},
  methods: {
    close() {
      this.$store.dispatch('exit');
    },
    goHome() {
      this.$router.replace('/');
    },
    goProfiles() {
      this.$router.replace('/profiles');
    },
    goSetting() {
      this.$router.replace('/setting');
    },
    goUser() {
      this.$router.replace('/user');
    },
    goBack() {
      if (!this.login && this.$route.path === '/login') {
        return;
      }
      this.timeTraveling = true;
      if (this.localHistory.length !== 0) {
        const before = this.localHistory.pop();
        this.$router.replace(before);
      }
      this.timeTraveling = false;
    },
  },
}
</script>

<style>
.clip-head {
  clip-path: inset(0px 30px 30px 0px) !important;
  width: 64px;
  height: auto; /*to preserve the aspect ratio of the image*/
}
.moveable {
  -webkit-app-region: drag;
  user-select: none;
}

.non-moveable {
  -webkit-app-region: no-drag;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
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

