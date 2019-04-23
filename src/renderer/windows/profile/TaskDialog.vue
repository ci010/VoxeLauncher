<template>
	<v-dialog v-model="dialog" hide-overlay persistent width="500" style="max-height: 100%">
		<v-toolbar dark tabs color="grey darken-3">
			<v-toolbar-title>{{$t('task.manager')}}</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-btn icon @click="trigger">
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
						<v-treeview transition v-model="runningTree" :open="runningOpened" :items="running"
						  activatable item-key="_internalId" open-on-click item-children="tasks" item-text="localized">
							<template v-slot:append="{ item, open }">
								<v-icon v-if="item.status === 'successed'" color="green">
									check
								</v-icon>
								<v-progress-linear v-if="item.status === 'running' && item.total !== -1" :height="10"
								  :value="item.progress / item.total * 100" color="white"></v-progress-linear>
								<v-progress-circular v-if="item.status === 'running' && item.total === -1" small :size="20"
								  :width="3" indeterminate color="white" class="mb-0"></v-progress-circular>
							</template>
						</v-treeview>
					</v-card-text>
				</v-card>
			</v-tab-item>
			<v-tab-item>
				<v-card flat style="min-height: 300px;" dark color="grey darken-4">
					<v-card-text>
						{{ finished.length === 0 ? $t('task.empty') : '' }}
						<v-treeview transition v-model="historyTree" :open="historyOpened" :items="finished"
						  activatable item-key="_internalId" open-on-click item-children="tasks" item-text="localized">
							<template v-slot:append="{ item, open }">
								<v-icon v-if="item.status === 'successed'" color="green">
									check
								</v-icon>
							</template>
						</v-treeview>
					</v-card-text>
				</v-card>
			</v-tab-item>
		</v-tabs-items>
	</v-dialog>
</template>

<script>


export default {
  data: () => ({
    dialog: false,
    runningTree: [],
    runningOpened: [],
    historyTree: [],
    historyOpened: [],
    active: 0,
  }),
  computed: {
    localizedTree() {
      const tree = this.$repo.state.task.tree;
      const running = this.$repo.state.task.running;
      const history = this.$repo.state.task.history;
      const ids = [...running, ...history];
      const translate = (node) => {
        node.localized = this.$t(node.path, node.arguments || {});
        for (const c of node.tasks) {
          translate(c);
        }
      };
      const localizedTree = {}
      for (const id of ids) {
        const local = { ...tree[id] };
        translate(local);
        localizedTree[id] = local;
      }
      return localizedTree;
    },
    running() {
      // const tree = this.$repo.state.task.tree;
      const tree = this.localizedTree;
      return this.$repo.state.task.running
        .map(id => tree[id]);
    },
    finished() {
      const tree = this.localizedTree;
      // const tree = this.$repo.state.task.tree;
      return this.$repo.state.task.history
        .map(id => tree[id]);
    },
  },
  mounted() {
  },
  methods: {
    trigger() {
      this.dialog = !this.dialog;
    },
  },
}
</script>

<style scoped=true>
.v-progress-linear {
  margin-left: 10px;
}
</style>
