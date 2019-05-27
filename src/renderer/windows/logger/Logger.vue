<template>
	<v-card fill-heigh style="height: 100%;" dark>
		<v-toolbar dark height="40" width="500" class="moveable">
			<v-toolbar-title>Logger</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-btn icon @click="close" class="non-moveable">
				<v-icon dark>close</v-icon>
			</v-btn>
		</v-toolbar>
		<v-list style="overflow: auto; max-height: 90vh; max-width: 100%">
			<v-list-tile v-for="(l, index) in logs" :key="index" avatar @click="onClick(l)">
				<v-chip dark outline label>{{l.time}}</v-chip>
				<v-chip dark outline label>{{l.src}}</v-chip>
				<v-list-tile-content>
					<v-list-tile-title v-text="l.content">
					</v-list-tile-title>
				</v-list-tile-content>
			</v-list-tile>
		</v-list>
	</v-card>
</template>

<script>

const pattern = /^\[(.+)\] \[(.+)\]: (.+)/;
export default {
  data: () => ({
    logs: [],
  }),
  computed: {
  },
  mounted() {
    this.$electron.ipcRenderer.on("minecraft-stdout", (event, str) => {
      this.accept(str);
    });
    this.$electron.ipcRenderer.on("minecraft-error", (event, str) => {

    });
  },
  methods: {
    close() {
      this.$electron.ipcRenderer.send("window-hide");
    },
    onClick(l) {
      this.$copy(l.raw);
    },
    accept(log) {
      console.log(log);
      const matched = pattern.exec(log);
      console.log(matched);
      if (matched) {
        const [full, time, src, content] = matched;
        this.logs.push({
          time, src, content,
          raw: log
        });
      } else {
        this.logs.push({
          raw: log
        });
      }
    }
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
.v-list__tile__content {
  margin-left: 7px;
}
.v-list__tile__title {
  overflow: auto;
  text-overflow: unset;
}
::-webkit-scrollbar {
  display: none;
}
</style>
