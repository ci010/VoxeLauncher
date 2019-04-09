<template>
	<v-layout fill-height column>
		<v-tooltip top>
			<template v-slot:activator="{ on }">
				<v-btn v-on="on" style="position: absolute; left: 20px; bottom: 10px; " flat icon dark @click="goSetting">
					<v-icon dark>settings</v-icon>
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

		<v-menu top dark full-width v-if="problems.length !== 0">
			<template v-slot:activator="{ on }">
				<v-btn style="position: absolute; left: 200px; bottom: 10px; " :loading="refreshingProfile" :flat="problems.length !== 0"
				  outline dark :color="problems.length !== 0 ? 'red' : 'white' " v-on="on">
					<v-icon left dark :color="problems.length !== 0 ? 'red': 'white'">{{problems.length !== 0 ?
						'warning' : 'check_circle'}}</v-icon>
					{{$tc('diagnosis.problem', problems.length, {count: problems.length})}}
				</v-btn>
			</template>

			<v-list>
				<template v-for="(item, index) in problems">
					<v-list-tile ripple :key="index" @click="handleError(item)">
						<v-list-tile-content>
							<v-list-tile-title>
								{{ item.title }}
							</v-list-tile-title>
							<v-list-tile-sub-title>
								{{item.autofix ? 'click to fix this problem': 'pleace manually fix this'}}
							</v-list-tile-sub-title>
						</v-list-tile-content>
						<v-list-tile-action>
							<v-icon> {{item.autofix ? 'build' : 'arrow_right'}} </v-icon>
						</v-list-tile-action>
					</v-list-tile>
				</template>
			</v-list>
		</v-menu>

		<div class="display-1 white--text" style="padding-top: 50px; padding-left: 50px">
			{{profile.name}}
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
		  :disabled="problems.length !== 0" @click="launch">{{$t('launch')}}</v-btn>
		<task-dialog ref="taskDialog"></task-dialog>
		<v-dialog v-model="launching" hide-overlay persistent width="300">
			<v-card dark>
				<v-card-text>
					{{$t('launching')}}
					<v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear>
				</v-card-text>
			</v-card>
		</v-dialog>
	</v-layout>
</template>

<script>
export default {
  data: () => ({
    launching: false,
    refreshingProfile: false,
  }),
  computed: {
    profile() { return this.$repo.getters['profile/current'] },
    problems() {
      return this.profile.errors.map((e) => ({ id: e.id, autofix: e.autofix, title: this.$t(`diagnosis.${e.id}`, e.arguments || {}) }))
    },
  },
  mounted() {
    this.$repo.dispatch('profile/diagnose');
  },
  watch: {
  },
  methods: {
    launch() {
      this.launching = true;
      const launch = this.$repo.dispatch('launch')
        .then(() => {
          this.launching = false;
        }).catch((e) => {
          console.error(e);
          this.launching = false;
        });
      this.$electron.ipcRenderer.on('minecraft-stdout', (s) => {
        console.log(s);
      });
    },
    goSetting() {
      this.$router.push('setting');
    },
    goExport() {
    },
    goTask() {
      this.$refs.taskDialog.open();
    },
    updateVersion(mcversion) {
      this.refreshingProfile = true;
      this.$repo.commit('profile/edit', { id: this.profile.id, mcversion });
      this.$repo.dispatch('profile/diagnose').then(() => {
        this.refreshingProfile = false;
      });
    },
    handleError(error) {
      console.log(error);
      this.refreshingProfile = true;
      if (!error.autofix) {
        switch (error.id) {
          case 'missingVersion':
            this.$router.push('setting');
            break;
          case 'missingJava':
            this.$router.push('setting');
            break;
        }
      } else {
        this.$repo.dispatch('profile/fix').then(() => {
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
