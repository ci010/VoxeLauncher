<template>
  <v-container fluid grid-list-md fill-height>
    <v-tooltip :close-delay="0" left>
      <template v-slot:activator="{ on }">
        <v-speed-dial v-if="security" v-model="fab"
                      style="position:absolute; z-index: 2; bottom: 80px; left: 85px;" direction="top" :open-on-hover="true">
          <template v-slot:activator>
            <v-btn v-model="fab" :disabled="pending" fab @click="doLoadSkin" v-on="on" @mouseenter="enterEditBtn">
              <v-icon>edit</v-icon>
            </v-btn>
          </template>
          <v-btn :disabled="pending" fab small v-on="on" @click="importUrlDialog=true" @mouseenter="enterLinkBtn">
            <v-icon>link</v-icon>
          </v-btn>
          <v-btn :disabled="pending" fab small v-on="on" @click="doSaveSkin" @mouseenter="enterSaveBtn">
            <v-icon>save</v-icon>
          </v-btn>
        </v-speed-dial>
      </template>
      {{ hoverTextOnEdit }}
    </v-tooltip>

    <v-fab-transition>
      <v-btn v-show="modified" fab small absolute style="bottom: 100px; left: 45px; z-index: 2;"
             :disabled="pending" @click="doReset">
        <v-icon>clear</v-icon>
      </v-btn>
    </v-fab-transition>
    <v-fab-transition>
      <v-btn v-show="modified" fab small absolute style="bottom: 100px; left: 157px; z-index: 2;"
             :disabled="pending" @click="doUpload">
        <v-icon>check</v-icon>
      </v-btn>
    </v-fab-transition>

    <v-layout v-if="security" row fill-height>
      <v-flex shrink>
        <v-layout justify-center align-center fill-height>
          <v-flex style="z-index: 1;">
            <skin-view :data="skin.data" :slim="skin.slim" @drop="onDropSkin" @dragover="onDragOver" />
            <v-progress-circular v-if="pending" color="white" indeterminate :size="90" style="position: absolute; top: 30vh; left: 13vh;" />
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex grow>
        <v-layout column fill-height>
          <v-flex d-flex grow>
            <v-layout column justify-start>
              <v-flex tag="h1" class="white--text" xs1 style="margin-bottom: 10px; padding: 6px; 8px;">
                <span class="headline">{{ $t('user.info') }}</span>
              </v-flex>
              <v-flex xs1>
                <v-text-field hide-details :label="$t('user.name')" readonly :value="user.name" color="primary"
                              dark append-icon="file_copy" @click:append="$copy(user.name)" />
              </v-flex>
              <v-flex xs1>
                <v-text-field hide-details :label="$t('user.accessToken')" readonly :value="user.accessToken"
                              color="primary" dark append-icon="file_copy" @click:append="$copy(user.accessToken)" />
              </v-flex>
              <v-flex xs1>
                <v-select hide-details :label="$t('user.authService')" readonly :value="user.authService"
                          :items="authServices" color="primary" dark prepend-inner-icon="add" />
              </v-flex>
              <v-flex xs1>
                <v-select hide-details :label="$t('user.profileService')" :items="profileServices" :value="user.profileService"
                          color="primary" dark prepend-inner-icon="add" />
              </v-flex>

              <v-flex xs1>
                <v-select v-model="skin.slim" hide-details :label="$t('user.skinSlim')"
                          :items="[{text:'Alex', value:true}, {text:'Steve', value:false}]" item-text="text" item-value="value" color="primary" dark />
              </v-flex>
            </v-layout>
          </v-flex>

          <v-flex d-flex shrink>
            <v-layout wrap>
              <v-flex d-flex xs6>
                <v-btn block dark :disabled="pending" @click="refreshSkin">
                  <v-icon left dark>
                    refresh
                  </v-icon>
                  {{ $t('user.refreshSkin') }}
                </v-btn>
              </v-flex>
              <v-flex d-flex xs6>
                <v-btn block dark :disabled="pending" @click="refreshAccount">
                  <v-icon left dark>
                    refresh
                  </v-icon>
                  {{ $t('user.refreshAccount') }}
                </v-btn>
              </v-flex>
            </v-layout>
          </v-flex>
          <v-flex d-flex shrink>
            <v-layout wrap>
              <v-flex d-flex xs6>
                <v-btn block replace to="/login">
                  <v-icon left dark>
                    compare_arrows
                  </v-icon>
                  {{ $t('user.switchAccount') }}
                </v-btn>
              </v-flex>
              <v-flex d-flex xs6>
                <v-btn block dark color="red" replace to="/login" @click="doLogout">
                  <v-icon left dark>
                    exit_to_app
                  </v-icon>
                  {{ $t('user.logout') }}
                </v-btn>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-layout v-else column fill-height style="padding: 0 30px;">
      <v-flex tag="h1" class="white--text" xs1 style="margin-bottom: 10px; padding: 6px; 8px;">
        <span class="headline">{{ $t('user.challenges') }}</span>
      </v-flex>
      <v-flex v-if="waitingChallenges" grow />
      <v-flex v-if="waitingChallenges" offset-xs4>
        <v-progress-circular indeterminate :width="7" :size="170" color="white" />
      </v-flex>
      <v-flex v-else xs1>
        <v-text-field v-for="(c, index) in challenges" :key="c.question.id" hide-details outline
                      :label="c.question.question" color="primary"
                      dark style="margin-bottom: 10px;" @input="challenges[index].answer.answer=$event;challegesError=undefined" />
      </v-flex>
      <v-alert :value="challegesError" type="error" transition="scale-transition">
        {{ (challegesError||{}).errorMessage }}
      </v-alert>
      <v-flex d-flex grow />
      <v-flex d-flex shrink>
        <v-layout wrap>
          <v-flex d-flex xs12 class="white--text">
            <v-spacer />
            <a style="z-index: 1" href="https://account.mojang.com/me/changeSecretQuestions">{{ $t('user.forgetChallenges') }}</a>
          </v-flex>
          <v-flex d-flex xs12>
            <v-btn block :loading="submittingChallenges" color="primary" @click="doSumitAnswer">
              <v-icon left dark>
                check
              </v-icon>
              {{ $t('user.submitChallenges') }}
            </v-btn>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex d-flex shrink>
        <v-layout wrap>
          <v-flex d-flex xs6>
            <v-btn block replace to="/login">
              <v-icon left dark>
                compare_arrows
              </v-icon>
              {{ $t('user.switchAccount') }}
            </v-btn>
          </v-flex>
          <v-flex d-flex xs6>
            <v-btn block dark color="red" replace to="/login" @click="doLogout">
              <v-icon left dark>
                exit_to_app
              </v-icon>
              {{ $t('user.logout') }}
            </v-btn>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-dialog v-model="importUrlDialog" width="400">
      <v-card dark>
        <v-container fluid grid-list-md>
          <v-layout row wrap>
            <v-flex d-flex xs12>
              <v-text-field v-model="skinUrl" validate-on-blur :rules="skinUrlFormat" :label="$t('user.skinPlaceUrlHere')"
                            clearable @input="updateSkinUrl" />
            </v-flex>
            <v-flex d-flex xs12>
              <v-btn :disabled="skinUrlError" @click="doLoadSkinFromUrl">
                {{ $t('user.skinImport') }}
              </v-btn>
            </v-flex>
          </v-layout>
        </v-container>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>

// https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
const URL_PATTERN = new RegExp('^(https?:\\/\\/)?' // protocol
  + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
  + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
  + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
  + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
  + '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

export default {
  data() {
    return {
      fab: false,

      hoverTextOnEdit: '',
      skinUrlError: true,
      skinUrlFormat: [
        v => !!v || this.$t('user.skinUrlNotEmpty'),
        v => !!URL_PATTERN.test(v) || this.$t('user.skinUrlNotValid'),
      ],
      skinUrl: '',

      security: true,
      submittingChallenges: false,
      waitingChallenges: false,
      challenges: [],
      challegesError: undefined,

      importUrlDialog: false,
      parsingSkin: false,
      uploadingSkin: false,
      refreshingSkin: false,

      skin: {
        data: '',
        slim: false,
      },
    };
  },
  computed: {
    pending() { return this.refreshingSkin || this.uploadingSkin || this.parsingSkin; },
    offline() { return this.user.authservice === 'offline'; },
    showChallenges() { return !this.security; },
    user() { return this.$repo.state.user; },
    authServices() { return this.$repo.getters.authServices; },
    profileServices() { return this.$repo.getters.profileServices; },
    modified() {
      const skin = this.$repo.state.user.skin;
      return skin.data !== this.skin.data || this.skin.slim !== skin.slim;
    },
  },
  mounted() {
    this.doReset();
    this.waitingChallenges = true;
    this.$repo.dispatch('checkLocation').then((security) => {
      console.log(security);
      this.security = security;
      if (!this.security) {
        this.$repo.dispatch('getChallenges').then((c) => {
          this.challenges = c;
          this.waitingChallenges = false;
        }, (e) => {
          this.waitingChallenges = false;
          this.challegesError = e;
        });
      } else {
        this.waitingChallenges = false;
      }
    });
  },
  methods: {
    async doSumitAnswer() {
      this.submittingChallenges = true;
      await this.$nextTick();
      await this.$repo.dispatch('submitChallenges', JSON.parse(JSON.stringify(this.challenges.map(c => c.answer)))).then((resp) => {
        this.security = true;
      }).catch((e) => {
        this.challegesError = e;
      }).finally(() => {
        this.submittingChallenges = false;
      });
    },
    doLogout() {
      return this.$repo.dispatch('logout');
    },
    refreshSkin() {
      this.refreshingSkin = true;
      this.$repo.dispatch('refreshSkin').then(() => {
        this.$notify('info', this.$t('user.refreshSkinSuccess'));
      }, (e) => {
        this.$notify('error', this.$t('user.refreshSkinFail', e));
      }).finally(() => {
        this.refreshingSkin = false;
        this.doReset();
      });
    },
    refreshAccount() {
      this.$repo.dispatch('refreshInfo');
    },
    onDragOver(e) {
      e.preventDefault();
      return false;
    },
    onDropSkin(e) {
      e.preventDefault();

      const length = e.dataTransfer.files.length;
      if (length > 0) {
        console.log(`Detect drop import ${length} file(s).`);
        for (let i = 0; i < length; ++i) {
          // TOOD: use resource module to manage skin
          this.$repo.dispatch('parseSkin', e.dataTransfer.files[i].path).then((skin) => {
            if (skin) {
              this.skin.data = skin;
            }
          });
        }
      }
    },
    doLoadSkinFromUrl() {
      this.importUrlDialog = false;

      this.parsingSkin = true;
      this.$repo.dispatch('parseSkin', this.skinUrl).then((skin) => {
        if (skin) { this.skin.data = skin; }
      }, (e) => {
        this.$notify('error', this.$t('user.skinParseFailed', e));
      }).finally(() => {
        this.parsingSkin = false;
      });
    },
    async doLoadSkin() {
      await this.$nextTick();
      this.$electron.remote.dialog.showOpenDialog({ title: this.$t('user.openSkinFile'), filters: [{ extensions: ['png'], name: 'PNG Images' }] }, (filename, bookmark) => {
        if (filename && filename[0]) {
          this.$repo.dispatch('parseSkin', filename[0]).then((skin) => {
            if (skin) {
              this.skin.data = skin;
            }
          }, (e) => {
            this.$notify('error', this.$t('user.skinParseFailed', e));
          });
        }
      });
    },
    doReset() {
      const skin = this.$repo.state.user.skin;
      this.skin.data = skin.data;
      this.skin.slim = skin.slim;
    },
    doUpload() {
      if (this.offline) {
        console.warn('Cannot update skin during offline mode');
      } else {
        this.uploadingSkin = true;
        this.$repo.dispatch('uploadSkin', this.skin)
          .then(() => this.refreshSkin(), (e) => {
            this.$notify('error', this.$t('user.uploadSkinFail', e));
          }).finally(() => {
            this.uploadingSkin = false;
          });
      }
    },
    doSaveSkin() {
      this.$electron.remote.dialog.showSaveDialog({ title: this.$t('user.skinSaveTitle'), defaultPath: `${this.user.name}.png`, filters: [{ extensions: ['png'], name: 'PNG Images' }] }, (filename, bookmark) => {
        if (filename) {
          this.$repo.dispatch('saveSkin', { path: filename, skin: this.skin });
        }
      });
    },
    enterEditBtn() {
      this.hoverTextOnEdit = this.$t('user.skinImportFile');
    },
    enterLinkBtn() {
      this.hoverTextOnEdit = this.$t('user.skinImportLink');
    },
    enterSaveBtn() {
      this.hoverTextOnEdit = this.$t('user.skinSave');
    },
    updateSkinUrl(url) {
      this.skinUrlError = this.skinUrlFormat.some(r => typeof r(url) === 'string');
    },
  },
};
</script>

<style scoped=true>
</style>
