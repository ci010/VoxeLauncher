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
			{{$t('modpack.export')}}
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
			<v-btn slot="activator" style="position: absolute; left: 200px; bottom: 10px; " :loading="refreshingProfile"
			  :flat="problems.length !== 0" outline dark :color="problems.length !== 0 ? 'red' : 'white' ">
				<v-icon left dark :color="problems.length !== 0 ? 'red': 'white'">{{problems.length !== 0 ?
					'warning' : 'check_circle'}}</v-icon>
				{{$tc('diagnosis.problem', problems.length, {count: problems.length})}}
			</v-btn>

			<v-list>
				<template v-for="(item, index) in problems">
					<v-list-tile ripple :key="index" @click="handleError(item)">
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
			<v-chip label color="green" outline small :selected="false" style="margin-left: 10px;">
				{{profile.author || 'Unknown'}}
			</v-chip>
			<version-menu ref="menu" @value="updateVersion">
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
		  :disabled="problems.length !== 0" @click="launch">
			{{$t('launch.launch')}}
			<v-icon right> play_arrow </v-icon>
		</v-btn>
		<task-dialog ref="taskDialog"></task-dialog>

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

		<v-dialog v-model="fixDialog" persistent width="600">
			<v-card dark>
				<v-card-title primary-title>
					{{$t('diagnosis.fix')}}
				</v-card-title>
				<v-list>
					<template v-for="(option, i) in fixOptions">
						<v-list-tile :key="i" ripple @click="handleError(option)">
							<v-list-tile-content>
								<v-list-tile-title>
									{{ option.title }}
								</v-list-tile-title>
								<v-list-tile-sub-title>
									{{ option.message }}
								</v-list-tile-sub-title>
							</v-list-tile-content>
							<v-list-tile-action>
								<v-icon> {{ option.autofix ? 'build' : 'arrow_right' }} </v-icon>
							</v-list-tile-action>
						</v-list-tile>
					</template>
				</v-list>
				<v-card-actions>
					<v-btn @click="fixDialog=false">
						{{$t('cancel')}}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-layout>
</template>

<script>
export default {
  data: () => ({
    refreshingProfile: false,

    tempDialog: false,
    tempDialogText: '',

    fixDialog: false,
    fixOptions: [],
  }),
  computed: {
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
    launch() {
      this.tempDialog = true;
      this.tempDialogText = this.$t('launching');
      setTimeout(() => {
        this.tempDialogText = this.$t('launching.slow');
      }, 4000);
      const launch = this.$repo.dispatch('launch')
        .catch((e) => {
          console.error(e);
          this.tempDialog = false;
        });
      this.$electron.ipcRenderer
        .once('launched', () => {
          this.tempDialog = false;
        });
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
      this.$refs.taskDialog.trigger();
    },
    updateVersion(mcversion) {
      this.refreshingProfile = true;
      this.$repo.commit('profile/edit', { mcversion });
      this.$repo.dispatch('profile/diagnose').then(() => {
        this.refreshingProfile = false;
      });
    },
    handleError(error) {
      console.log(error);
      this.refreshingProfile = true;
      if (!error.autofix) {
        if (error.options) {
          this.fixOptions = error.options;
          this.fixDialog = true;
        } else if (error.action) {
          this.$repo.dispatch(error.action);
        } else {
          switch (error.id) {
            case 'missingVersion':
              this.$router.push('setting');
              break;
            case 'selectJava':
              this.$router.push('setting');
              break;
          }
        }
        this.refreshingProfile = false;
      } else {
        this.$repo.dispatch('profile/fix').then(() => {
          this.refreshingProfile = false;
        }).catch(() => {
          this.refreshingProfile = false;
        });
      }
    },
  },
  components: {
    ExportDialog: () => import('./ExportDialog'),
    TaskDialog: () => import('./TaskDialog'),
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
