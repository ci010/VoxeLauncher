<template>
	<v-layout fill-height column>
		<v-tooltip top>
			<template v-slot:activator="{ on }">
				<v-btn v-on="on" style="position: absolute; left: 20px; bottom: 10px; " flat icon dark @click="goSetting">
					<v-icon dark>settings</v-icon>
				</v-btn>
			</template>
			{{$t('modpack.setting')}}
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
			{{$tc('task.name', 2)}}
		</v-tooltip>

		<v-menu top dark full-width>
			<template v-slot:activator="{ on }">
				<v-btn style="position: absolute; left: 200px; bottom: 10px; " :flat="problems.length !== 0"
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
				<v-chip label color="green" outline small :selected="false" @click="$refs.menu.open()">
					<span style="cursor: pointer !important; ">
						{{profile.mcversion}}
					</span>
				</v-chip>
			</version-menu>
		</div>
		<v-btn color="grey darken-1" style="position: absolute; right: 10px; bottom: 10px; " dark large
		  :disabled="problems.length !== 0" @click="launch">{{$t('launch')}}</v-btn>
		<export-dialog :dialog="exportDialog"></export-dialog>
		<task-dialog ref="taskDialog"></task-dialog>
	</v-layout>
</template>

<script>
export default {
  data: () => ({
    exportDialog: false,
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
      this.$repo.dispatch('launch');
    },
    goSetting() {
      this.$router.push('setting');
    },
    goExport() {
      this.exportDialog = true;
    },
    goTask() {
      this.$refs.taskDialog.open();
    },
    updateVersion(mcversion) {
      this.$repo.commit('profile/edit', { id: this.profile.id, mcversion });
      this.$repo.dispatch('profile/diagnose');
    },
    handleError(error) {
      console.log(error);
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
        this.$repo.dispatch('profile/fix');
      }
    },
  },
  components: {
    ExportDialog: () => import('./ExportDialog'),
    TaskDialog: () => import('./TaskDialog'),
    VersionMenu: () => import('./VersionMenu'),
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
