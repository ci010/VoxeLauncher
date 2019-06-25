<template>
	<v-layout fill-height column>

		<v-icon style="position: absolute; right: 0; top: 0; z-index: 2; margin: 0; padding: 5px; cursor: pointer"
		  v-ripple dark>close</v-icon>
		<v-tooltip top>
			<template v-slot:activator="{ on }">
				<v-btn v-on="on" style="position: absolute; left: 20px; bottom: 10px; " flat icon dark to="/profile-setting">
					<v-icon dark>more_vert</v-icon>
				</v-btn>
			</template>
			{{$t('profile.setting')}}
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
					<v-badge left :value="activeTasksCount !== 0">
						<template v-slot:badge>
							<span>{{activeTasksCount}}</span>
						</template>
						<v-icon dark>assignment</v-icon>
					</v-badge>
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
								{{ $t(`diagnosis.${item.id}`, item.arguments || {}) }}
							</v-list-tile-title>
							<v-list-tile-sub-title>
								{{ $t(`diagnosis.${item.id}.message`, item.arguments || {}) }}
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
				{{profile.name || `Minecraft ${profile.mcversion}`}}
			</span>
			<v-chip label color="green" v-if="profile.author" outline small :selected="true" style="margin-right: 5px;">
				{{profile.author}}
			</v-chip>

			<v-chip label color="green" outline small :selected="true">
				Version: {{$repo.getters['currentVersion'].id}}
			</v-chip>
		</div>

		<v-btn color="grey darken-1" style="position: absolute; right: 10px; bottom: 10px; " dark large
		  @click="launch" :disabled="refreshingProfile || missingJava || launched" :loading="launching">
			{{$t('launch.launch')}}
			<v-icon right> play_arrow </v-icon>
		</v-btn>

		<task-dialog v-model="taskDialog" @close="taskDialog=false"></task-dialog>
		<crash-dialog v-model="crashDialog" :content="crashReport" :location="crashReportLocation" @close="crashDialog=false"></crash-dialog>
		<java-wizard ref="jwizard" @task="taskDialog=true" @show="taskDialog=false"></java-wizard>
		<v-dialog v-model="tempDialog" width="250">
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
    launching: false,
    launched: false,
    taskDialog: false,

    crashDialog: false,
    crashReport: '',
    crashReportLocation: '',

    tempDialog: false,
    tempDialogText: '',
  }),
  computed: {
    refreshingProfile() { return this.profile.refreshing; },
    problems() { return this.profile.problems; },
    missingJava() { return this.$repo.getters['missingJava']; },
    profile() { return this.$repo.getters['selectedProfile'] },
    activeTasksCount() {
      let count = 0;
      for (const task of this.$repo.state.task.tasks) {
        if (task.status === 'running') {
          count += 1;
        }
      }
      return count;
    },
  },
  mounted() {

  },
  watch: {
  },
  activated() {
  },
  methods: {
    async launch() {
      if (this.launching) {
        this.tempDialog = true;
        return;
      }
      this.launching = true;
      this.tempDialog = true;
      this.tempDialogText = this.$t('launch.checkingProblems');

      const urgency = this.problems.filter(p => !p.optional);
      if (urgency.some(p => p.autofix)) {
        this.tempDialog = false;
        this.taskDialog = true;
        await this.handleAutoFix();
      }
      if (urgency.length !== 0) {
        this.handleManualFix(urgency[0]);
        this.tempDialog = false;
        return;
      }

      this.tempDialogText = this.$t('launch.launching');
      setTimeout(() => { this.tempDialogText = this.$t('launch.launchingSlow'); }, 4000);

      this.$repo.dispatch('launch')
        .catch((e) => {
          console.error(e);
        });
      this.$electron.ipcRenderer.once('minecraft-window-ready', () => {
        this.launched = true;
        this.launching = false;
        this.tempDialog = false;
      });
      this.$electron.ipcRenderer.once('minecraft-exit', (event, status) => {
        this.tempDialog = false;
        this.launched = false;
        if (status.crashReport) {
          this.crashDialog = true;
          this.crashReport = status.crashReport;
          this.crashReportLocation = status.crashReportLocation || '';
        }
      })
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
          this.$repo.dispatch('exportProfile', { dest: filename }).then(() => {
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
      this.$repo.dispatch('editProfile', { mcversion });
    },
    fixProblem(problem) {
      console.log(problem);
      if (!problem.autofix) {
        return this.handleManualFix(problem);
      } else {
        return this.handleAutoFix();
      }
      return Promise.resolve();
    },
    async handleManualFix(problem) {
      switch (problem.id) {
        case 'missingVersion':
          this.$router.push('profile-setting');
          break;
        case 'missingJava':
          this.$router.push('profile-setting');
          break;
        case 'autoDownload':
          const handle = await this.$repo.dispatch('installJava');
          if (handle) {
            this.taskDialog = true;
            await this.$repo.dispatch('waitTask', handle);
          }
          break;
        case 'manualDownload':
          return this.$repo.dispatch('redirectToJvmPage');
        case 'incompatibleJava':
          return this.$refs.jwizard.display(this.$t('java.incompatibleJava'), this.$t('java.incompatibleJavaHint'));
      }
    },
    async handleAutoFix() {
      await this.$repo.dispatch('fixProfile', this.problems);
    },
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
.v-badge__badge .primary {
  left: -13px;
}
</style>
