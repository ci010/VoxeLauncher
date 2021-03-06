<template>
  <v-layout row wrap>
    <v-icon v-ripple style="position: absolute; right: 0; top: 0; z-index: 2; margin: 0; padding: 10px; cursor: pointer; border-radius: 2px; user-select: none;"
            dark @click="quitLauncher">
      close
    </v-icon>
    <v-tooltip top>
      <template v-slot:activator="{ on }">
        <v-btn style="position: absolute; left: 20px; bottom: 10px; " flat icon dark to="/base-setting" v-on="on">
          <v-icon dark>
            more_vert
          </v-icon>
        </v-btn>
      </template>
      {{ $t('profile.setting') }}
    </v-tooltip>

    <v-tooltip top>
      <template v-slot:activator="{ on }">
        <v-btn style="position: absolute; left: 80px; bottom: 10px; " flat icon dark v-on="on"
               @click="goExport">
          <v-icon dark>
            share
          </v-icon>
        </v-btn>
      </template>
      {{ $t('profile.modpack.export') }}
    </v-tooltip>

    <v-tooltip top>
      <template v-slot:activator="{ on }">
        <v-btn style="position: absolute; left: 140px; bottom: 10px; " flat icon dark v-on="on"
               @click="goTask">
          <v-badge right :value="activeTasksCount !== 0">
            <template v-slot:badge>
              <span>{{ activeTasksCount }}</span>
            </template>
            <v-icon dark>
              assignment
            </v-icon>
          </v-badge>
        </v-btn>
      </template>
      {{ $tc('task.manager', 2) }}
    </v-tooltip>

    <v-menu v-if="refreshingProfile || problems.length !== 0" offset-y top dark>
      <v-btn slot="activator" style="position: absolute; left: 200px; bottom: 10px; " :loading="refreshingProfile || missingJava"
             :flat="problems.length !== 0" outline dark :color="problems.length !== 0 ? 'red' : 'white' ">
        <v-icon left dark :color="problems.length !== 0 ? 'red': 'white'">
          {{ problems.length !== 0 ?
            'warning' : 'check_circle' }}
        </v-icon>
        {{ $tc('diagnosis.problem', problems.length, {count: problems.length}) }}
      </v-btn>

      <v-list>
        <template v-for="(item, index) in problems">
          <v-list-tile :key="index" ripple @click="fixProblem(item)">
            <v-list-tile-content>
              <v-list-tile-title>
                {{ $t(`diagnosis.${item.id}`, item.arguments || {}) }}
              </v-list-tile-title>
              <v-list-tile-sub-title>
                {{ $t(`diagnosis.${item.id}.message`, item.arguments || {}) }}
              </v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-icon> {{ item.autofix?'build':'arrow_right' }} </v-icon>
            </v-list-tile-action>
          </v-list-tile>
        </template>
      </v-list>
    </v-menu>

    <v-flex d-flex xs12>
      <div class="display-1 white--text" style="padding-top: 50px; padding-left: 50px">
        <span style="margin-right: 10px;">
          {{ profile.name || `Minecraft ${profile.mcversion}` }}
        </span>
        <v-chip v-if="profile.author" label color="green" outline small :selected="true" style="margin-right: 5px;">
          {{ profile.author }}
        </v-chip>

        <v-chip label color="green" outline small :selected="true">
          Version: {{ $repo.getters['currentVersion'].id }}
        </v-chip>
      </div>
    </v-flex>
    
    <v-flex d-flex xs6 style="margin: 40px 0 0 40px;">
      <v-card v-if="isServer" class="white--text">
        <v-layout>
          <v-flex xs5 style=" padding: 5px 0">
            <v-card-title>
              <v-img :src="icon" height="125px" style="max-height: 125px;" contain />
            </v-card-title>
          </v-flex>
          <v-flex xs7>
            <v-card-title>
              <div>
                <div style="font-size: 20px;">
                  {{ $t(profile.status.version.name) }}
                </div>
                <text-component :source="profile.status.description" />

                <div> {{ $t('profile.server.players') }} : {{ profile.status.players.online + '/' + profile.status.players.max }} </div>
              </div>
            </v-card-title>
          </v-flex>
        </v-layout>
        <v-divider light />
        <v-card-actions class="pa-3">
          <v-icon left>
            signal_cellular_alt
          </v-icon>
          <div>  {{ $t('profile.server.pings') }} : {{ profile.status.ping }} ms </div>
        
          <v-spacer />
          <v-btn v-if="isServer" flat dark large @click="refreshServer">
            <v-icon>
              refresh
            </v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-flex>


    <v-btn color="primary" style="position: absolute; right: 10px; bottom: 10px; " dark large
           :disabled="refreshingProfile || missingJava"
           @click="launch">
      {{ $t('launch.launch') }}
      <v-icon v-if="launchStatus === 'ready'" right> 
        play_arrow
      </v-icon>
      <v-progress-circular v-else class="v-icon--right" indeterminate :size="20" :width="2" />
    </v-btn>

    <task-dialog v-model="taskDialog" @close="taskDialog=false" />
    <crash-dialog v-model="crashDialog" :content="crashReport" :location="crashReportLocation"
                  @close="crashDialog=false" />
    <java-wizard ref="jwizard" @task="taskDialog=true" @show="taskDialog=false" />
    <v-dialog v-model="tempDialog" :persistent="launchStatus === 'launching'" width="250">
      <v-card dark>
        <v-container>
          <v-layout align-center justify-center column>
            <v-flex>
              <v-progress-circular :size="70" :width="7" color="white" indeterminate />
            </v-flex>
            <v-flex mt-3>
              {{ tempDialogText }}
            </v-flex>
          </v-layout>
        </v-container>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
import unknownServer from 'static/unknown_server.png';
import { PINGING_STATUS, createFailureServerStatus } from 'universal/utils/server-status';

export default {
  data: () => ({
    taskDialog: false,

    crashDialog: false,
    crashReport: '',
    crashReportLocation: '',

    tempDialog: false,
    tempDialogText: '',
  }),
  computed: {
    icon() { return this.profile.status.favicon || unknownServer; },
    isServer() { return this.profile.type === 'server'; },
    problems() { return this.profile.problems; },
    launchStatus() { return this.$repo.state.launch.status; },
    refreshingProfile() { return this.profile.refreshing; },
    missingJava() { return this.$repo.getters.missingJava; },
    profile() { return this.$repo.getters.selectedProfile; },
    activeTasksCount() {
      let count = 0;
      for (const task of this.$repo.state.task.tasks) {
        if (task.status === 'running') {
          count += 1;
        }
      }
      return count;
    },
  },
  watch: {
    launchStatus() {
      switch (this.launchStatus) {
        case 'ready':
          this.tempDialog = false;
          break;
        case 'checkingProblems':
          this.tempDialog = true;
          this.tempDialogText = this.$t('launch.checkingProblems');
          break;
        case 'launching':
          this.tempDialog = true;
          this.tempDialogText = this.$t('launch.launching');
          setTimeout(() => { this.tempDialogText = this.$t('launch.launchingSlow'); }, 4000);
          break;
        // case 'launched':
        case 'minecraftReady':
          this.tempDialog = false;
          break;
        default:
      }
    },
  },
  mounted() {

  },
  activated() {
  },
  methods: {
    async launch() {
      if (this.launchStatus !== 'ready') {
        this.tempDialog = true;
        return;
      }

      const success = await this.$repo.dispatch('launch').catch((e) => {
        console.error(e);
      });
      if (!success) {
        const problems = this.$repo.getters.selectedProfile.problems;
        if (problems.length !== 0) {
          this.tempDialog = false;
          this.handleManualFix(problems[0]);
          return;
        }
      }
      this.$electron.ipcRenderer.once('minecraft-exit', (event, status) => {
        if (status.crashReport) {
          this.crashDialog = true;
          this.crashReport = status.crashReport;
          this.crashReportLocation = status.crashReportLocation || '';
        }
      });
    },
    goExport() {
      this.$electron.remote.dialog.showSaveDialog({
        title: this.$t('profile.export.title'),
        filters: [{ name: 'zip', extensions: ['zip'] }],
        message: this.$t('profile.export.message'),
        defaultPath: `${this.profile.name}.zip`,
      }, (filename, bookmark) => {
        if (filename) {
          this.tempDialogText = this.$t('profile.export.exportingMessage');
          this.tempDialog = true;
          this.$repo.dispatch('exportProfile', { dest: filename }).then(() => {
            this.tempDialog = false;
          }).catch((e) => {
            this.tempDialog = false;
            console.error(e);
          });
        }
      });
    },
    goTask() {
      this.taskDialog = true;
    },
    updateVersion(mcversion) {
      this.$repo.dispatch('editProfile', { mcversion });
    },
    fixProblem(problem) {
      console.log(problem);
      if (!problem.autofix) {
        return this.handleManualFix(problem);
      }
      return this.handleAutoFix();
    },
    async handleManualFix(problem) {
      let handle;
      switch (problem.id) {
        case 'missingVersion':
          this.$router.push('base-setting');
          break;
        case 'missingJava':
          this.$router.push('base-setting');
          break;
        case 'autoDownload':
          handle = await this.$repo.dispatch('installJava');
          if (handle) {
            this.taskDialog = true;
            await this.$repo.dispatch('waitTask', handle);
          }
          break;
        case 'manualDownload':
          await this.$repo.dispatch('redirectToJvmPage');
          break;
        case 'incompatibleJava':
          if (this.$repo.state.java.all.some(j => j.majorVersion === 8)) {
            await this.$repo.dispatch('editProfile', { java: this.$repo.state.java.all.find(j => j.majorVersion === 8) });
          } else {
            await this.$refs.jwizard.display(this.$t('java.incompatibleJava'), this.$t('java.incompatibleJavaHint'));
          }
          break;
        default:
      }
    },
    async handleAutoFix() {
      await this.$repo.dispatch('fixProfile', this.problems);
    },
    async refreshServer() {
      await this.$repo.dispatch('refreshProfile');
    },
    quitLauncher() {
      setTimeout(() => {
        this.$store.dispatch('quit');
      }, 150);
    },
  },
};
</script>

<style>
.v-dialog__content--active {
  -webkit-app-region: no-drag;
  user-select: auto;
}
.v-dialog {
  -webkit-app-region: no-drag;
  user-select: auto;
}
.v-badge__badge.primary {
  right: -10px;
  height: 20px;
  width: 20px;
  font-size: 12px;
}
</style>
