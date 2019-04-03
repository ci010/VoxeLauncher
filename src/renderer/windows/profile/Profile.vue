<template>
	<v-layout fill-height column>
		<v-btn style="position: absolute; left: 10px; bottom: 10px; " flat icon dark @click="goSetting">
			<v-icon dark>settings</v-icon>
		</v-btn>

		<v-btn style="position: absolute; left: 70px; bottom: 10px; " flat icon dark @click="goExport">
			<v-icon dark>share</v-icon>
		</v-btn>

		<v-menu top dark full-width>
			<template v-slot:activator="{ on }">
				<v-btn style="position: absolute; left: 130px; bottom: 10px; " :flat="problems.length !== 0"
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
			<v-chip label color="green" outline small :selected="false">
				{{profile.author || 'Unknown'}}
			</v-chip>
			<version-menu ref="menu">
				<v-chip label color="green" outline small :selected="false" @click="$refs.menu.open()">
					{{profile.mcversion}}
				</v-chip>
			</version-menu>
		</div>
		<v-btn color="grey darken-1" style="position: absolute; right: 10px; bottom: 10px; " dark large
		  :disabled="problems.length !== 0" @click="launch">Launch</v-btn>
		<export-dialog :dialog="exportDialog"></export-dialog>
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
    handleError(error) {
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

      }
    },
  },
  components: {
    ExportDialog: () => import('./ExportDialog'),
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
