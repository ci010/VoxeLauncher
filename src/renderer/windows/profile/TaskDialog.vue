<template>
	<v-dialog v-model="dialog" hide-overlay persistent width="500" style="max-height: 100%">
		<v-toolbar dark tabs color="grey darken-3">
			<!-- <v-toolbar-side-icon></v-toolbar-side-icon> -->
			<v-toolbar-title>{{$t('task.manager')}}</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-btn icon @click="minimize">
				<v-icon>arrow_drop_down</v-icon>
			</v-btn>
			<template v-slot:extension>
				<v-tabs v-model="active" centered slider-color="green" color="grey darken-3">
					<v-tab ripple>
						{{$t('task.running')}}
					</v-tab>
					<v-tab ripple>
						{{$t('task.history')}}
					</v-tab>
				</v-tabs>
			</template>
		</v-toolbar>
		<v-tabs-items v-model="active">
			<v-tab-item>
				<v-card flat style="min-height: 300px;" dark color="grey darken-4">
					<v-card-text>
						{{ running.length === 0 ? $t('task.empty') : '' }}
						<v-treeview transition v-model="tree" :open="openTree" :items="running" activatable item-key="_internalId"
						  open-on-click item-children="tasks">
							<template v-slot:append="{ item, open }">
								<v-icon v-if="item.status === 'successed'" color="green">
									check
								</v-icon>
								<v-progress-circular v-else small :size="20" :width="3" indeterminate color="white" class="mb-0"></v-progress-circular>
								<v-progress-linear v-if="item.status === 'running' && item.total !== -1" :value="item.progress / item.total * 100"
								  color="white" class="mb-0"></v-progress-linear>
							</template>
						</v-treeview>
					</v-card-text>
				</v-card>
			</v-tab-item>
			<v-tab-item>
				<v-card flat style="min-height: 300px;" dark color="grey darken-4">
					<v-card-text>
						hmmb
					</v-card-text>
				</v-card>
			</v-tab-item>
		</v-tabs-items>

		<!-- <v-card dark>

			<v-card-title primary-title>
				<h3 class="headline mb-0">Task Manager</h3>
			</v-card-title>

		</v-card> -->
	</v-dialog>
</template>

<script>
export default {
  data: () => ({
    tree: [],
    dialog: false,
    openTree: [],
    active: 0,
  }),
  computed: {
    running() { return this.$repo.state.task.running.map(id => Object.freeze(this.$repo.state.task.tree[id])); },
    finished() { return this.$repo.state.task.history; },
  },
  mounted() { },
  methods: {
    open() {
      this.dialog = true;
    },
    minimize() {
      this.dialog = false;
    }
  },
}
</script>

<style>
</style>
