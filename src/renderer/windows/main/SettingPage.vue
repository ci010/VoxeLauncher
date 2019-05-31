<template>
	<v-container grid-list-md fluid>
		<v-layout wrap style="padding: 6px; 8px;" fill-height>
			<v-flex d-flex xs12 tag="h1" style="margin-bottom: 20px; " class="white--text">
				<span class="headline">{{$tc('setting.name', 2)}}</span>
			</v-flex>
			<v-flex d-flex xs6 grow>
				<v-select dark :label="$t('setting.language')" :items="langs" v-model="selectedLang"></v-select>
			</v-flex>
			<v-flex d-flex xs6>
				<v-combobox dark :label="$t('setting.location')" readonly v-model="rootLocation" append-icon="arrow_right"
				  append-outer-icon="folder" @click:append="showRootDir" @click:append-outer="browseRootDir"></v-combobox>
			</v-flex>
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
		<v-dialog :value="true" :persistent="!reloadError">
			<v-card dark v-if="!reloading">
				<v-card-title>
					<h2>
						{{$t('setting.setRootTitle')}}
					</h2>
				</v-card-title>
				<v-card-text>
					<p>
						{{$t('setting.setRootDescription')}}
					</p>
					<p>
						{{$t('setting.setRootCause')}}
					</p>
				</v-card-text>
				<v-card-actions>
					<v-checkbox v-model="clearData" persistent-hint :hint="$t('setting.cleanOldDataHint')" :label="$t('setting.cleanOldData')"></v-checkbox>
					<v-checkbox v-model="migrateData" persistent-hint :hint="$t('setting.copyOldToNewHint')"
					  :label="$t('setting.copyOldToNew')"></v-checkbox>
				</v-card-actions>
				<v-card-actions>
					<v-btn @click="doCancelApplyRoot">
						{{$t('cancel')}}
					</v-btn>
					<v-spacer></v-spacer>
					<v-checkbox v-model="restartLater" :label="$t('setting.restartLater')"></v-checkbox>
					<v-btn @click="doApplyRoot(rootLocation, true)">
						{{$t('setting.apply')}}
					</v-btn>
				</v-card-actions>
			</v-card>
			<v-card dark v-else>
				<v-card-title>
					<h2>
						{{$t('setting.waitReload')}}
					</h2>
				</v-card-title>
				<v-progress-circular v-if="!reloadError" indeterminate></v-progress-circular>
				<v-card-text v-else>
					{{$t('setting.reloadFailed')}}:
					{{reloadError}}
				</v-card-text>
			</v-card>
		</v-dialog>
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
      rootLocation: this.$repo.state.root,

      clearData: false,
      migrateData: false,
      restartLater: false,

      reloadDialog: false,
      reloading: false,
      reloadError: undefined,
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
      this.$repo.dispatch('config/checkUpdate').then(result => {
        console.log(result);
      });
    },
    showRootDir() {
      this.$electron.remote.shell.openItem(this.rootLocation);
    },
    browseRootDir() {
      this.$electron.remote.dialog.showOpenDialog({
        title: this.$t('setting.selectRootDirectory'),
        defaultPath: this.rootLocation,
        properties: ['openDirectory', 'createDirectory'],
      }, (paths, bookmarks) => {
        if (paths && paths.length !== 0) {
          this.rootLocation = paths[0];
          this.reloadDialog = true;
        }
      });
    },
    doCancelApplyRoot() {
      this.reloadDialog = false;
      this.rootLocation = this.$repo.state.root;
    },
    doApplyRoot(defer) {
      this.reloading = true;
      this.$electron.ipcRenderer.once("root", (error) => {
        this.reloading = false;
        if (error) {
          this.reloadError = error;
        } else {
          this.reloadDialog = false;
        }
      });
      this.$electron.ipcRenderer.send("root", { path: this.rootLocation, reload: !defer });
    },
  }
}
</script>

<style>
</style>
