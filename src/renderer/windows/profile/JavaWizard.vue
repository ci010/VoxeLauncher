<template>
	<v-dialog :value="show" persistent width="600">
		<v-card dark color="grey darken-4">
			<v-toolbar dark tabs color="grey darken-3">
				<v-toolbar-title>
					{{$t('java.missing')}}
				</v-toolbar-title>
			</v-toolbar>
			<v-window v-model="step">
				<v-window-item :value="0">
					<v-card-text>
						{{$t('java.missingHint')}}
					</v-card-text>

					<v-list style="width: 100%" class="grey darken-4" dark>
						<template v-for="(option, i) in options">
							<v-list-tile :key="i" ripple @click="fixProblem(i)">
								<v-list-tile-content>
									<v-list-tile-title>
										{{ (i + 1) + '. ' + option.title }}
									</v-list-tile-title>
									<v-list-tile-sub-title>
										{{ option.message }}
									</v-list-tile-sub-title>
								</v-list-tile-content>
								<v-list-tile-action>
									<v-icon> {{ option.autofix ? 'build' : 'arrow_right' }} </v-icon>
								</v-list-tile-action>
							</v-list-tile>
						</template>
					</v-list>
				</v-window-item>

				<v-window-item :value="1">
					<v-card-text>
						<v-treeview transition :items="items" activatable item-key="_internalId" open-on-click
						  item-children="tasks" item-text="localText">
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
					<v-card-actions>
					</v-card-actions>
				</v-window-item>

				<v-window-item :value="2">
					<v-card-text>
						{{ status === 'none' ? $t('java.refreshAfter') : $t('java.noJavaInPath') }}
					</v-card-text>
					<v-card-actions>
						<v-btn @click="back">
							{{$t('back')}}
							<v-icon right>
								arrow_left
							</v-icon>
						</v-btn>
						<v-spacer></v-spacer>
						<v-btn @click="refresh" :loading="status==='resolving'">
							{{$t('refresh')}}
							<v-icon right>
								refresh
							</v-icon>
						</v-btn>
					</v-card-actions>
				</v-window-item>

				<v-window-item :value="3">
					<v-container fill-height v-if="status === 'resolving'">
						<v-layout fill-height align-center justify-center>
							<v-progress-circular :size="128" indeterminate></v-progress-circular>
						</v-layout>
					</v-container>
					<v-card-text v-else-if="status === 'error'">
						{{$t('java.noLegalJava')}}
					</v-card-text>
					<v-card-actions v-if="status === 'error'">
						<v-btn @click="back">
							{{$t('back')}}
							<v-icon right>
								arrow_left
							</v-icon>
						</v-btn>
					</v-card-actions>
				</v-window-item>
			</v-window>
		</v-card>
	</v-dialog>
</template>

<script>
export default {
  data: function () {
    return {
      step: 0,

      items: [],

      status: 'none',

      options: [{
        autofix: true,
        title: this.$t('diagnosis.missingJava.autoDownload'),
        message: this.$t('diagnosis.missingJava.autoDownload.message')
      }, {
        title: this.$t('diagnosis.missingJava.manualDownload'),
        message: this.$t('diagnosis.missingJava.manualDownload.message')
      }, {
        title: this.$t('diagnosis.missingJava.selectJava'),
        message: this.$t('diagnosis.missingJava.selectJava.message')
      }],
    }
  },
  methods: {
    async fixProblem(index) {
      this.step = index + 1;
      switch (index) {
        case 0:
          const handle = await this.$repo.dispatch('java/install');
          if (handle) {
            const self = this;
            const $repo = this.$repo;
            const task = $repo.state.task.tree[handle];
            this.items = task.tasks;
            await this.$repo.dispatch('task/wait', handle);
          }
          break;
        case 1:
          await this.$repo.dispatch('java/redirect');
          break;
        case 2:
          this.status = 'resolving';
          this.$electron.remote.dialog.showOpenDialog({
            title: this.$t('java.browse'),
          }, (filepaths, bookmarks) => {
            this.$repo.dispatch('java/add', filepaths)
              .then(result => {
                if (result.every(r => typeof r !== 'object' || r === null)) {
                  this.status = 'error';
                }
              });
          });
          break;
      }
    },
    refresh() {
      this.status = 'resolving';
      this.$repo.dispatch('java/refresh').finally(() => {
        if (this.show) {
          this.status = 'error';
        }
      });
    },
    back() {
      this.step = 0;
      this.status = 'none';
    }
  },
  computed: {
    show() {
      return this.$repo.state.java.all.length === 0;
    },
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    }
  },
  mounted() {
  },
}
</script>

<style scoped=true>
</style>
