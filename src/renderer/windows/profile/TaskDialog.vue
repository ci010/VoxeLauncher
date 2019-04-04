<template>
	<v-dialog v-model="dialog" hide-overlay persistent width="500" style="max-height: 100%">
		<v-card dark>
			<v-layout>
				<v-spacer></v-spacer>
				<v-icon v-ripple style="cursor: pointer;" @click="minimize"> arrow_drop_down </v-icon>
			</v-layout>
			<v-card-text>
				{{ running.length === 0 ? 'No running task' : 'Running task' }}

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
	</v-dialog>
</template>

<script>
export default {
  data: () => ({
    tree: [],
    dialog: false,
    openTree: [],
  }),
  computed: {
    running() { return this.$repo.state.task.running.map(id => Object.freeze(this.$repo.state.task.tree[id])); },
    finished() { return this.$repo.state.task.history; },
  },
  mounted() {
    console.log(this.running);
  },
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
