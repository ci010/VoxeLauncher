<template>
	<v-layout fill-height column>
		<v-btn style="position: absolute; left: 10px; bottom: 10px; " flat icon dark @click="goSetting">
			<v-icon dark>settings</v-icon>
		</v-btn>

		<v-btn style="position: absolute; left: 70px; bottom: 10px; " flat icon dark @click="goExport">
			<v-icon dark>share</v-icon>
		</v-btn>

		<div class="display-1 white--text" style="padding-top: 50px; padding-left: 50px">
			{{profile.name}}
			<v-chip label color="green" outline small :selected="false"> 
				{{profile.author}}
			</v-chip>
			<v-chip label color="green" outline small :selected="false">
				{{profile.mcversion}}
			</v-chip>
		</div>
		<v-btn color="grey darken-1" style="position: absolute; right: 10px; bottom: 10px; " dark large
		  @click="launch">Launch</v-btn>
		<export-dialog :dialog="exportDialog"></export-dialog>
	</v-layout>
</template>

<script>
export default {
  data: () => ({
    exportDialog: false,
  }),
  computed: {
    profile() { return this.$repo.getters['profile/current'] }
  },
  mounted() {
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
  },
  components: {
    ExportDialog: () => import('./ExportDialog'),
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
