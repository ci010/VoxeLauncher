<template>
	<v-container grid-list>
		<v-layout wrap style="padding: 6px; 8px;" fill-height>
			<v-flex d-flex xs12 tag="h1" style="margin-bottom: 20px; " class="white--text">
				<span class="headline">{{$tc('setting.name', 2)}}</span>
			</v-flex>
			<v-flex d-flex xs6 grow>
				<v-select dark :label="$t('setting.language')" :items="langs" v-model="selectedLang"></v-select>
			</v-flex>
			<v-flex d-flex xs6></v-flex>
			<v-flex d-flex xs6 style="flex-direction: column;">
				<v-checkbox dark v-model="autoInstallOnAppQuit" :label="$t('setting.autoInstallOnAppQuit')"></v-checkbox>
				<v-checkbox dark v-model="autoDownload" :label="$t('setting.autoDownload')"></v-checkbox>
				<v-checkbox dark v-model="allowPrerelease" :label="$t('setting.allowPrerelease')"></v-checkbox>
			</v-flex>

			<v-flex d-flex xs6 grow style="color: white;">
				<v-tooltip top v-if="updateInfo">
					<template v-slot:activator="{ on }">
						<v-card dark hover v-on="on">
							<v-card-title>
								<h3>
									{{updateInfo.releaseName}}
								</h3>
								<span class="grey--text">{{updateInfo.releaseDate}}</span>
								<v-spacer></v-spacer>
								<v-chip small>v{{updateInfo.version}}</v-chip>
							</v-card-title>
							<v-divider></v-divider>
							<v-card-text>

								<div v-html="updateInfo.releaseNotes"></div>
							</v-card-text>
						</v-card>
					</template>
					{{$t('setting.latestVersion')}}
				</v-tooltip>

			</v-flex>
			<v-flex d-flex xs6>
				<v-btn large dark @click="checkUpdate">
					{{$t('setting.checkUpdate')}}
				</v-btn>
			</v-flex>

			<p class="white--text" style="position: absolute; bottom: 35px; right: 315px;">
				<a href="https://github.com/ci010/voxelauncher"> Github Repo</a>
			</p>

			<p class="white--text" style="position: absolute; bottom: 10px; right: 300px;">
				Present by <a href="https://github.com/ci010"> CI010 </a>
			</p>
		</v-layout>
	</v-container>
</template>

<script>
export default {
  data: function () {
    return {
      allowPrerelease: this.$repo.state.config.allowPrerelease,
      autoInstallOnAppQuit: this.$repo.state.config.autoInstallOnAppQuit,
      autoDownload: this.$repo.state.config.autoDownload,
      selectedLang: this.$repo.state.config.locale,
    };
  },
  watch: {
    selectedLang() {
      this.$repo.commit('config/locale', this.selectedLang);
    },
    allowPrerelease() {
      this.$repo.commit('config/allowPrerelease', this.allowPrerelease);
    },
    autoInstallOnAppQuit() {
      this.$repo.commit('config/autoInstallOnAppQuit', this.autoInstallOnAppQuit);
    },
    autoDownload() {
      this.$repo.commit('config/autoDownload', this.autoDownload);
    },
  },
  computed: {
    version() { },
    updateInfo() { return this.$repo.state.config.updateInfo; },
    readyToUpdate() { return this.$repo.state.config.readyToUpdate; },
    langs() { return this.$repo.state.config.locales; }
  },
  methods: {
    checkUpdate() {
      this.$repo.dispatch('config/checkUpdate').then(resolt => {
        console.log(resolt);
      });
    },
  }
}
</script>

<style>
</style>
