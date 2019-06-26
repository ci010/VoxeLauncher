<template>
  <v-dialog v-model="show" :persistent="missing" width="600">
    <v-card dark color="grey darken-4">
      <v-toolbar dark tabs color="grey darken-3">
        <v-toolbar-title>
          {{ reason || $t('java.missing') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-window v-model="step">
        <v-window-item :value="0">
          <v-card-text>
            {{ hint || $t('java.missingHint') }}
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
          <v-card-text v-if="downloadError">
            {{ $t('java.errorDownload') }}
            <div>
              {{ downloadError }}
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="back">
              {{ $t('back') }}
              <v-icon right>
                arrow_left
              </v-icon>
            </v-btn>
          </v-card-actions>
        </v-window-item>

        <v-window-item :value="2">
          <v-card-text>
            {{ status === 'none' ? $t('java.refreshAfter') : $t('java.noJavaInPath') }}
          </v-card-text>
          <v-card-actions>
            <v-btn @click="back">
              {{ $t('back') }}
              <v-icon right>
                arrow_left
              </v-icon>
            </v-btn>
            <v-spacer />
            <v-btn :loading="status==='resolving'" @click="refresh">
              {{ $t('refresh') }}
              <v-icon right>
                refresh
              </v-icon>
            </v-btn>
          </v-card-actions>
        </v-window-item>

        <v-window-item :value="3">
          <v-container v-if="status === 'resolving'" fill-height>
            <v-layout fill-height align-center justify-center>
              <v-progress-circular :size="128" indeterminate />
            </v-layout>
          </v-container>
          <v-card-text v-else-if="status === 'error'">
            {{ $t('java.noLegalJava') }}
          </v-card-text>
          <v-card-actions v-if="status === 'error'">
            <v-btn @click="back">
              {{ $t('back') }}
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
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      show: this.missing,
      reason: null,
      hint: null,
      step: 0,

      items: [],

      status: 'none',
      downloadError: undefined,

      options: [{
        autofix: true,
        title: this.$t('diagnosis.missingJava.autoDownload'),
        message: this.$t('diagnosis.missingJava.autoDownload.message'),
      }, {
        title: this.$t('diagnosis.missingJava.manualDownload'),
        message: this.$t('diagnosis.missingJava.manualDownload.message'),
      }, {
        title: this.$t('diagnosis.missingJava.selectJava'),
        message: this.$t('diagnosis.missingJava.selectJava.message'),
      }],
    };
  },
  computed: {
    missing() {
      return this.$repo.getters.missingJava;
    },
  },
  mounted() {
    this.show = this.missing;
  },
  methods: {
    async fixProblem(index) {
      this.step = index + 1;
      let handle;
      switch (index) {
        case 0:
          handle = await this.$repo.dispatch('installJava');
          this.show = false;
          this.$emit('task');
          if (handle) {
            const self = this;
            const $repo = this.$repo;
            const task = $repo.state.task.tree[handle];
            this.items = task.tasks;
            try {
              await this.$repo.dispatch('waitTask', handle);
            } catch (e) {
              this.downloadError = e;
            }
            this.refresh();
          }
          break;
        case 1:
          await this.$repo.dispatch('redirectToJvmPage');
          break;
        case 2:
          this.status = 'resolving';
          this.$electron.remote.dialog.showOpenDialog({
            title: this.$t('java.browse'),
          }, (filepaths, bookmarks) => {
            filepaths.forEach((p) => {
              this.$repo.dispatch('resolveJava', p)
                .then((r) => {
                  if (!r) {
                    this.status = 'error';
                  }
                });
            });
          });
          break;
        default:
      }
    },
    refresh() {
      this.status = 'resolving';
      this.$repo.dispatch('refreshLocalJava').finally(() => {
        if (this.missing) {
          this.status = 'error';
          this.$emit('show');
          this.show = true;
        } else {
          this.reason = null;
          this.hint = null;
        }
      });
    },
    back() {
      this.step = 0;
      this.status = 'none';
    },
    display(reason, hint) {
      this.show = true;
      this.reason = reason;
      this.hint = hint;
    },
  },
};
</script>

<style scoped=true>
</style>
