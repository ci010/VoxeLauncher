<template>
	<v-snackbar v-model="snackbar" :top="true" :right="true">
		<v-icon :color="colors[status]"> {{icons[status]}} </v-icon>

		{{taskName}}

		{{$t(`task.${status}`)}}
		<v-btn color="pink" flat @click="snackbar = false">
			<v-icon>close</v-icon>
		</v-btn>
	</v-snackbar>
</template>

<script>

export default {
  data: () => ({
    snackbar: false,
    taskName: '',
    status: '',
    icons: {
      successed: 'check',
      failed: 'error_outline',
      cancelled: 'stop',
    },
    colors: {
      successed: 'green',
      failed: 'red',
      cancelled: 'white',
    }
  }),
  mounted() {
    this.$electron.ipcRenderer.addListener('task-successed', this.onSuccessed);
    this.$electron.ipcRenderer.addListener('task-failed', this.onFailed);
  },
  destroyed() {
    this.$electron.ipcRenderer.removeListener('task-successed', this.onSuccessed);
    this.$electron.ipcRenderer.removeListener('task-failed', this.onFailed);

  },
  methods: {
    onSuccessed(event, id) {
      this.snackbar = true;
      const task = this.$repo.state.task.tree[id];
      this.taskName = this.$t(task.path, task.arguments || {});
      this.status = 'successed';
    },
    onFailed(event, id) {
      this.snackbar = true;
      const task = this.$repo.state.task.tree[id];
      this.taskName = this.$t(task.path, task.arguments || {});
      this.status = 'failed';
    },
  },
}
</script>

<style>
</style>
