<template>
	<v-dialog v-model="value" hide-overlay width="500" style="max-height: 100%">
		<v-toolbar dark tabs color="grey darken-3">
			<v-toolbar-title>{{$t('task.manager')}}</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-btn icon @click="$emit('close')">
				<v-icon>arrow_drop_down</v-icon>
			</v-btn>
		</v-toolbar>
		<v-card flat style="min-height: 300px;" dark color="grey darken-4">
			<v-card-text>
				{{ all.length === 0 ? $t('task.empty') : '' }}
				<v-treeview hoverable transition v-model="tree" :open="opened" :items="all" activatable
				  item-key="_internalId" open-on-click item-children="tasks" item-text="localText">
					<template v-slot:append="{ item, open }">
						<v-icon v-if="item.status !== 'running'" :color="item.status === 'successed'?'green':item.status === 'cancelled'?'white':'red'">
							{{item.status === 'successed' ? 'check' : item.status === 'cancelled' ? 'stop' :
							'error_outline'}}
						</v-icon>
						<v-progress-circular v-if="item.status === 'running'" small :size="20" :value="item.progress / item.total * 100"
						  :width="3" :indeterminate="item.total === -1" color="white" class="mb-0"></v-progress-circular>
					</template>

					<template v-slot:label="{ item, open }">
						<div style="padding: 5px 0px;">
							{{item.localText}}
							<span style="color: grey; font-size: 12px; font-style: italic; ">{{item.time}}</span>
							<div style="color: grey; font-size: 12px; font-style: italic; ">{{item.message}}</div>
						</div>
					</template>
				</v-treeview>
			</v-card-text>
		</v-card>
		<v-snackbar v-model="snackbar" :bottom="true">
			DONE
			<v-btn color="pink" flat @click="snackbar = false">
				Close
			</v-btn>
		</v-snackbar>

	</v-dialog>
</template>

<script>


export default {
  data: () => ({
    snackbar: false,
    tree: [],
    opened: [],
    active: 0,
  }),
  props: {
    value: {
      type: Boolean,
      default: false,
    }
  },
  computed: {
    all() {
      return this.$repo.state.task.tasks;
    },
  },
  mounted() {
  },
  methods: {
  },
}
</script>

<style scoped=true>
.v-progress-linear {
  margin-left: 10px;
}
</style>
<style>
.v-treeview-node__label {
  white-space: normal;
  line-break: normal;
  word-break: break-all;
}
</style>

