<template>
	<v-dialog v-model="dialog" hide-overlay persistent width="500" style="max-height: 100%">
		<v-card color="primary" dark>
			<v-layout>
				<v-spacer></v-spacer>
				<v-icon v-ripple style="cursor: pointer;" @click="minimize"> arrow_drop_down </v-icon>
			</v-layout>
			<v-card-text>
				{{ running.length === 0 ? 'No running task' : 'Running task' }}

				<v-treeview v-model="tree" :open="openTree" :items="running" activatable item-key="name"
				  open-on-click item-children="tasks" :value="treeValues">
					<template v-slot:prepend="{ item, open }">
						<v-icon v-if="item.status === 'finished'">
                            check
						</v-icon>
						<v-icon v-else>
							circle
						</v-icon>
					</template>
				</v-treeview>
				<!-- <v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear> -->
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script>
export default {
  data: () => ({
    tree: {},
    dialog: false,
    openTree: [],
    treeValues: [],

  }),
  computed: {
    running() { return this.$repo.state.task.running.map(id => this.$repo.state.task.tree[id]); },
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
