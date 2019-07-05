<template>
  <v-snackbar v-model="snackbar" :top="true" :right="true">
    <v-icon :color="colors[status]" left>
      {{ icons[status] }}
    </v-icon>

    {{ content }}

    {{ $t(`log.${status}`) }}
    <v-btn color="pink" flat @click="snackbar = false">
      <v-icon>close</v-icon>
    </v-btn>
  </v-snackbar>
</template>

<script>
import Vue from 'vue';

export default {
  data: () => ({
    snackbar: false,

    content: '',
    status: '',

    icons: {
      success: 'check_circle',
      info: 'info',
      warning: 'priority_high',
      error: 'warning',
    },
    colors: {
      success: 'green',
      error: 'red',
      info: 'white',
      warning: 'orange',
    },
  }),
  mounted() {
    this.$electron.ipcRenderer.addListener('task-successed', this.onSuccessed);
    this.$electron.ipcRenderer.addListener('task-failed', this.onFailed);

    Vue.prototype.$notify = this.notify.bind(this);
  },
  destroyed() {
    this.$electron.ipcRenderer.removeListener('task-successed', this.onSuccessed);
    this.$electron.ipcRenderer.removeListener('task-failed', this.onFailed);
  },
  methods: {
    notify(status, content) {
      this.status = status;
      this.content = content;
      this.snackbar = true;
    },
    onSuccessed(event, id) {
      this.snackbar = true;
      const task = this.$repo.state.task.tree[id];
      this.content = this.$t(task.path, task.arguments || {});
      this.status = 'success';
    },
    onFailed(event, id) {
      this.snackbar = true;
      const task = this.$repo.state.task.tree[id];
      this.content = this.$t(task.path, task.arguments || {});
      this.status = 'error';
    },
  },
};
</script>

<style>
</style>
