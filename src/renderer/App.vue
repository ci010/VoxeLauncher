<template>
	<v-app style="background: transparent;">
		<router-view></router-view>
		<textarea readonly style="position:absolute;left:-9999px;" ref="clipboard"></textarea>
	</v-app>
</template>

<script>

import 'vuetify/dist/vuetify.css';
import 'renderer/assets/google.font.css';
import Vue from 'vue';

export default {
  computed: {
  },
  beforeMount() {
  },
  created() {
    this.$electron.ipcRenderer.on('copy', (text) => {
      const clipboard = this.$refs.clipboard;
      clipboard.value = text;
      clipboard.select();
      document.execCommand('copy');
    });
  },
  mounted() {
    Vue.prototype.$copy = (text) => {
      const clipboard = this.$refs.clipboard;
      clipboard.value = text;
      clipboard.select();
      document.execCommand('copy');
    }
  },
  methods: {
  },
}
</script>

<style>
</style>
