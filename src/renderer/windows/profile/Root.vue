<template>
	<v-app style="background: transparent;">
		<v-layout fill-height>
			<v-navigation-drawer width=700px v-model="drawer" mini-variant stateless dark style="border-radius: 2px 0 0 2px;"
			  class="moveable">
				<v-toolbar flat class="transparent">
					<v-list class="pa-0 non-moveable">
						<v-list-tile avatar @click="goBack">
							<v-list-tile-avatar>
								<v-icon dark>arrow_back</v-icon>
								<!-- <img class="clip-head" :src="skin.data"> -->
							</v-list-tile-avatar>
						</v-list-tile>
					</v-list>
				</v-toolbar>
				<v-list class="non-moveable">
					<v-divider dark style="display: block !important;"></v-divider>
					<v-list-tile @click="goHome">
						<v-list-tile-action>
							<v-icon>home</v-icon>
						</v-list-tile-action>
					</v-list-tile>
					<v-list-tile avatar @click="goUser">
						<v-list-tile-avatar>
							<v-icon dark>person</v-icon>
							<!-- <img class="clip-head" :src="skin.data"> -->
						</v-list-tile-avatar>
					</v-list-tile>
				</v-list>
			</v-navigation-drawer>
			<v-layout style="padding: 0; background: transparent; max-height: 100vh;" fill-height>
				<!-- <div style="width: 100px;"></div> -->

				<v-card style="width: 100%; border-radius: 0px 2px 2px 0; max-width: 640px;" color="grey darken-4">
					<vue-particles color="#dedede" style="position: absolute; width: 100%; height: 100%;"></vue-particles>
					<transition name="fade-transition">
						<router-view style="max-width; 640px;"></router-view>
					</transition>
				</v-card>
			</v-layout>
		</v-layout>
	</v-app>
</template>

<script>
import logo from '@/assets/minecraft.logo.png'
import defaultSkin from 'universal/defaultSkin';

export default {
  data: () => ({
    logo,
    tab: '',
    drawer: true,
    defaultSkin: { data: defaultSkin, slim: false },
    localHistory: [],
    timeTraveling: false,
  }),
  computed: {
    username() {
      return this.$repo.state.user.name;
    },
    skin() {
      const skin = this.$repo.state.user.skin;
      return skin.data === '' ? this.defaultSkin : this.$repo.state.user.skin;
    },
  },
  created() {
    this.$router.afterEach((to, from) => {
      if (!this.timeTraveling) this.localHistory.push(from.fullPath);
    });
  },
  mounted() {
  },
  watch: {},
  methods: {
    close() {
      this.$store.dispatch('exit');
    },
    goHome() {
      this.$router.replace('/profiles');
    },
    goUser() {
      this.$router.replace('/user');
    },
    goBack() {
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
  transition: opacity 0.01s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
