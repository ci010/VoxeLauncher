<template>
	<v-layout fill-height column>
		<v-tooltip top>
			<template v-slot:activator="{ on }">
				<v-btn v-on="on" style="position: absolute; left: 20px; bottom: 10px; " flat icon dark @click="goSetting">
					<v-icon dark>more_vert</v-icon>
				</v-btn>
			</template>
			{{$t('settings')}}
		</v-tooltip>

		<v-tooltip top>
			<template v-slot:activator="{ on }">
				<v-btn v-on="on" style="position: absolute; left: 80px; bottom: 10px; " flat icon dark @click="goExport">
					<v-icon dark>share</v-icon>
				</v-btn>
			</template>
			{{$t('profile.modpack.export')}}
		</v-tooltip>

		<v-tooltip top>
			<template v-slot:activator="{ on }">
				<v-btn v-on="on" style="position: absolute; left: 140px; bottom: 10px; " flat icon dark @click="goTask">
					<v-icon dark>assignment</v-icon>
				</v-btn>
			</template>
			{{$tc('task.manager', 2)}}
		</v-tooltip>

		<v-menu offset-y top dark v-if="problems.length !== 0">
			<v-btn slot="activator" style="position: absolute; left: 200px; bottom: 10px; " :loading="refreshingProfile || missingJava"
			  :flat="problems.length !== 0" outline dark :color="problems.length !== 0 ? 'red' : 'white' ">
				<v-icon left dark :color="problems.length !== 0 ? 'red': 'white'">{{problems.length !== 0 ?
					'warning' : 'check_circle'}}</v-icon>
				{{$tc('diagnosis.problem', problems.length, {count: problems.length})}}
			</v-btn>

			<v-list>
				<template v-for="(item, index) in problems">
					<v-list-tile ripple :key="index" @click="fixProblem(item)">
						<v-list-tile-content>
							<v-list-tile-title>
								{{ item.title }}
							</v-list-tile-title>
							<v-list-tile-sub-title>
								{{ item.message }}
							</v-list-tile-sub-title>
						</v-list-tile-content>
						<v-list-tile-action>
							<v-icon> {{item.autofix?'build':'arrow_right'}} </v-icon>
						</v-list-tile-action>
					</v-list-tile>
				</template>
			</v-list>
		</v-menu>

		<div class="display-1 white--text" style="padding-top: 50px; padding-left: 50px">
			<span style="margin-right: 10px;">
				{{profile.name}}
			</span>
			<v-chip label color="green" outline small :selected="false" style="margin-right: 5px;">
				{{profile.author || 'Unknown'}}
			</v-chip>
			<version-menu ref="menu" @value="updateVersion" :disabled="refreshingProfile">
				<template v-slot="{ on }">
					<v-chip label color="green" outline small :selected="false" v-on="on">
						<span style="cursor: pointer !important; ">
							{{profile.mcversion}}
						</span>
					</v-chip>
				</template>
			</version-menu>
		</div>

		<v-btn color="grey darken-1" style="position: absolute; right: 10px; bottom: 10px; " dark large
		  @click="launch" :disabled="refreshingProfile || missingJava" :loading="refreshingProfile || missingJava">
			{{$t('launch.launch')}}
			<v-icon right> play_arrow </v-icon>
		</v-btn>

		<task-dialog v-model="taskDialog" @close="taskDialog=false"></task-dialog>
		<crash-dialog v-model="crashDialog" :content="crashReport" :location="crashReportLocation" @close="crashDialog=false"></crash-dialog>
		<fix-dialog v-model="fixDialog" :options="fixOptions" @close="fixDialog=false"></fix-dialog>
		<java-wizard v-if="missingJava" @task="taskDialog=true" @show="taskDialog=false"></java-wizard>
		<v-dialog v-model="tempDialog" persistent width="250">
			<v-card dark>
				<v-container>
					<v-layout align-center justify-center column>
						<v-flex>
							<v-progress-circular :size="70" :width="7" color="white" indeterminate></v-progress-circular>
						</v-flex>
						<v-flex mt-3>
							{{tempDialogText}}
						</v-flex>
					</v-layout>
				</v-container>
			</v-card>
		</v-dialog>

	</v-layout>
</template>

<script>
export default {
  data: () => ({
    refreshingProfile: false,

    taskDialog: false,

    crashDialog: false,
    crashReport: '',
    crashReportLocation: '',

    tempDialog: false,
    tempDialogText: '',

    fixDialog: false,
    fixOptions: [],
  }),
  computed: {
    missingJava() { return this.$repo.getters['java/missing']; },
    profile() { return this.$repo.getters['profile/current'] },
    problems() {
      return this.profile.errors.map((e) => ({
        ...e,
        title: this.$t(`diagnosis.${e.id}`, e.arguments || {}),
        message: this.$t(`diagnosis.${e.id}.message`, e.arguments || {}),
        options: (e.options || []).map(o => ({
          ...o,
          title: this.$t(`diagnosis.${e.id}.${o.id}`, e.arguments || {}),
          message: this.$t(`diagnosis.${e.id}.${o.id}.message`, e.arguments || {}),
        }))
      }));
    },
  },
  mounted() {
    this.$repo.dispatch('profile/diagnose');
  },
  watch: {
  },
  methods: {
    async launch() {
      this.tempDialog = true;
      this.tempDialogText = this.$t('launch.checkingProblems');

      await this.$repo.dispatch('profile/diagnose');
      if (this.problems.some(p => p.autofix)) {
        await this.handleAutoFix();
      }
      await this.$repo.dispatch('profile/diagnose');
      if (this.problems.length !== 0) {
        this.handleManualFix(this.problems[0]);
        this.tempDialog = false;
        return;
      }

      this.tempDialogText = this.$t('launch.launching');
      setTimeout(() => { this.tempDialogText = this.$t('launch.launchingSlow'); }, 4000);

      this.$repo.dispatch('launch')
        .catch((e) => {
          console.error(e);
          this.tempDialog = false;
        });
      this.$electron.ipcRenderer.once('minecraft-window-ready', () => {
        this.tempDialog = false;
      });
      this.$electron.ipcRenderer.once('minecraft-exit', (event, status) => {
        this.tempDialog = false;
        if (status.crashReport) {
          this.crashDialog = true;
          this.crashReport = status.crashReport;
          this.crashReportLocation = status.crashReportLocation || '';
        }
      })
    },
    goSetting() {
      this.$router.push('profile-setting');
    },
    goExport() {
      this.$electron.remote.dialog.showSaveDialog({
        title: this.$t('profile.export.title'),
        filters: [{ name: 'zip', extensions: ['zip'] }],
        message: this.$t('profile.export.message'),
        defaultPath: `${this.profile.name}.zip`,
      }, (filename, bookmark) => {
        if (filename) {
          this.tempDialogText = this.$t('profile.export.exportingMessage');
          this.tempDialog = true;
          this.$repo.dispatch('profile/export', { dest: filename }).then(() => {
            this.tempDialog = false;
          }).catch((e) => {
            this.tempDialog = false;
            console.error(e);
          });
        }
      });
    },
    goTask() {
      this.taskDialog = true;
    },
    updateVersion(mcversion) {
      this.refreshingProfile = true;
      this.$repo.commit('profile/edit', { mcversion });
      this.$repo.dispatch('profile/diagnose').then(() => {
        this.refreshingProfile = false;
      });
    },
    fixProblem(error) {
      console.log(error);
      this.refreshingProfile = true;
      if (!error.autofix) {
        this.handleManualFix(error).finally(() => {
          this.refreshingProfile = false;
        })
      } else {
        return this.handleAutoFix().finally(() => {
          this.refreshingProfile = false;
        });
      }
      return Promise.resolve();
    },
    async handleManualFix(error) {
      console.log(error);
      if (error.options && error.options.length !== 0) {
        this.fixOptions = error.options;
        this.fixDialog = true;
      } else {
        switch (error.id) {
          case 'missingVersion':
            this.$router.push('profile-setting');
            break;
          case 'missingJava':
            this.$router.push('profile-setting');
            break;
          case 'autoDownload':
            const handle = await this.$repo.dispatch('java/install');
            if (handle) {
              this.taskDialog = true;
              await this.$repo.dispatch('task/wait', handle);
            }
            break;
          case 'manualDownload':
            return this.$repo.dispatch('java/redirect');
        }
      }
    },
    async handleAutoFix() {
      const profile = this.profile;
      const { id, mcversion } = profile;
      const location = this.$repo.state.root;
      if (profile.diagnosis) {
        const diagnosis = profile.diagnosis;
        if (mcversion !== '') {
          if (diagnosis.missingVersionJson || diagnosis.missingVersionJar) {
            const versionMeta = this.$repo.state.version.minecraft.versions[mcversion];
            const handle = await this.$repo.dispatch('version/minecraft/download', versionMeta);
            this.taskDialog = true;
            await this.$repo.dispatch('task/wait', handle);
          }
          if (diagnosis.missingAssetsIndex
            || Object.keys(diagnosis.missingAssets).length !== 0
            || diagnosis.missingLibraries.length !== 0) {
            const handle = await this.$repo.dispatch('version/checkDependencies', mcversion);
            this.taskDialog = true;
            await this.$repo.dispatch('task/wait', handle);
          }
          await this.$repo.dispatch('profile/diagnose');
        }
      }
    },
  },
  components: {
    ExportDialog: () => import('./ExportDialog'),
    TaskDialog: () => import('./TaskDialog'),
    CrashDialog: () => import('./CrashDialog'),
    FixDialog: () => import('./FixDialog'),
    JavaWizard: () => import('./JavaWizard'),
  },
}
</script>

<style>
.v-dialog__content--active {
  -webkit-app-region: no-drag;
  user-select: auto;
}
.v-dialog {
  -webkit-app-region: no-drag;
  user-select: auto;
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
