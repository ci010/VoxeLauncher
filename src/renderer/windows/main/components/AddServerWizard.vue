<template>
  <v-stepper v-model="step" non-linear dark>
    <v-stepper-header>
      <v-stepper-step :rules="[() => valid]" editable :complete="step > 1" step="1">
        {{ $t('profile.baseSetting') }}
      </v-stepper-step>
      <v-divider />
      <v-stepper-step editable :complete="step > 2" step="2">
        {{ $t('profile.advancedSetting') }}
        <small>{{ $t('optional') }}</small>
      </v-stepper-step>
      <v-divider />
    </v-stepper-header>

    <v-stepper-items>
      <v-stepper-content step="1">
        <v-form ref="form" v-model="valid" lazy-validation style="height: 100%;">
          <v-container grid-list fill-height>
            <v-layout row wrap>
              <v-flex d-flex xs12>
                <v-card>
                  <v-layout justify-center align-center>
                    <v-flex xs3>
                      <img :src="icon" style="max-width: 80px; max-height: 80px; min-height: 80px; margin: 5px 0 0 30px;">
                    </v-flex>
                    <v-flex xs9>
                      <v-layout row>
                        <v-flex>
                          <v-icon left>
                            title
                          </v-icon>
                          {{ $t(status.version.name) }}
                        </v-flex>
                        <v-flex>
                          <v-icon left>
                            people
                          </v-icon>
                          {{ status.players.online + '/' + status.players.max }}
                        </v-flex>
                        <v-flex>
                          <v-icon left>
                            signal_cellular_alt
                          </v-icon>
                          {{ status.ping }}
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                </v-card>
              </v-flex>
              <v-flex d-flex xs4>
                <v-text-field v-model="name" dark persistent-hint :hint="$t('profile.name')" :label="$t('profile.name')"
                              required />
              </v-flex>
              <v-flex d-flex xs4>
                <v-text-field v-model="host" dark persistent-hint :hint="$t('profile.server.hostHint')" :label="$t('profile.server.host')"
                              required />
              </v-flex>
              <v-flex d-flex xs4>
                <version-menu :extra-filter="versionFilter" @value="mcversion = $event">
                  <template v-slot="{ on }">
                    <v-text-field v-model="mcversion" dark append-icon="arrow" persistent-hint
                                  :hint="$t('profile.server.versionHint')" :label="$t('minecraft.version')" :readonly="true" @click:append="on.keydown"
                                  v-on="on" />
                  </template>
                </version-menu>
              </v-flex>
              
              <v-flex d-flex xs4>
                <v-switch v-model="filterVersion" :label="$t('profile.server.filterVersion')" />
              </v-flex>
              <v-flex d-flex xs4 />
              <v-flex d-flex xs4>
                <v-btn :loading="pinging" :disabled="!host||!port" @click="ping">
                  {{ $t('profile.server.ping') }}
                </v-btn>
              </v-flex>
            </v-layout>
          </v-container>
        </v-form>
        <v-layout>
          <v-btn flat @click="quit">
            {{ $t('cancel') }}
          </v-btn>
          <v-spacer />
          <v-btn flat @click="step = 2">
            {{ $t('next') }}
          </v-btn>
          <v-btn color="primary" :disabled="!valid || name === '' || mcversion === ''" @click="doCreate">
            {{ $t('create') }}
          </v-btn>
        </v-layout>
      </v-stepper-content>
      <v-stepper-content step="2">
        <v-form v-model="valid" lazy-validation style="height: 100%;">
          <v-container grid-list fill-height style="overflow: auto;">
            <v-layout row wrap>
              <v-flex d-flex xs6>
                <v-select v-model="javaLocation" class="java-select" hide-details :item-text="getJavaText"
                          :item-value="getJavaValue" prepend-inner-icon="add" :label="$t('java.location')" :items="javas"
                          required :menu-props="{ auto: true, overflowY: true }" />
              </v-flex>
              <v-flex d-flex xs3>
                <v-text-field v-model="minMemory" hide-details type="number" :label="$t('java.minMemory')"
                              required />
              </v-flex>
              <v-flex d-flex xs3>
                <v-text-field v-model="maxMemory" hide-details type="number" :label="$t('java.maxMemory')"
                              required />
              </v-flex>
              <v-flex d-flex xs6>
                <forge-version-menu :mcversion="mcversion" @value="forgeVersion = $event.version">
                  <template v-slot="{ on }">
                    <v-text-field v-model="forgeVersion" dark append-icon="arrow" persistent-hint
                                  :hint="$t('profile.versionHint')" :label="$t('forge.version')" :readonly="true" @click:append="on.keydown"
                                  v-on="on" />
                  </template>
                </forge-version-menu>
              </v-flex>
            </v-layout>
          </v-container>
        </v-form>

        <v-layout>
          <v-btn flat @click="quit">
            {{ $t('cancel') }}
          </v-btn>
          <v-spacer />
          <v-btn color="primary" :disabled="!valid || name === '' || mcversion === ''" @click="doCreate">
            {{ $t('create') }}
          </v-btn>
        </v-layout>
      </v-stepper-content>
    </v-stepper-items>
  </v-stepper>
</template>

<script>
import protocolToVersion from 'static/protocol.json';
import mcToProtocol from 'static/mc-protocol.json';

import unknownServer from 'static/unknown_server.png';

export default {
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    const release = this.$repo.getters.minecraftRelease.id;
    const forge = release ? this.$repo.getters.forgeRecommendedOf(release) : '';
    const forgeVersion = forge ? forge.version : '';
    return {
      step: 1,
      valid: false,

      name: '',
      versionName: '',
      host: '',
      port: 25565,
      mcversion: release,
      forgeVersion,
      javaLocation: this.$repo.getters.defaultJava,
      maxMemory: 2048,
      minMemory: 1024,
      status: {
        version: {
          name: 'profile.server.unknown',
          protocol: -1,
        },
        players: {
          max: -1,
          online: -1,
        },
        description: 'profile.server.unknownDescription',
        favicon: '',
        ping: 0,
      },
      pinging: false,

      filterVersion: false,
      javaValid: true,
      memoryRule: [v => Number.isInteger(v)],
      nameRules: [
        v => !!v || this.$t('profile.requireName'),
      ],
    };
  },
  computed: {
    icon() {
      return this.status.favicon || unknownServer;
    },
    acceptingMcVersion() {
      return protocolToVersion[this.status.version.protocol] || [];
    },
    ready() {
      return this.valid && this.javaValid;
    },
    versions() {
      return Object.keys(this.$repo.state.version.minecraft.versions);
    },
    javas() {
      return this.$repo.state.java.all;
    },
  },
  watch: {
    show() {
      if (this.show) {
        this.init();
      }
    },
  },
  methods: {
    versionFilter(v) {
      if (!this.filterVersion) {
        return true;
      }
      if (this.acceptingMcVersion.length === 0) {
        return true;
      }
      return this.acceptingMcVersion.indexOf(v.id) !== -1;
    },
    init() {
      const release = this.$repo.getters.minecraftRelease.id;
      const forge = release ? this.$repo.getters.forgeRecommendedOf(release) : '';
      const forgeVersion = forge ? forge.version : '';
      this.forgeVersion = forgeVersion;
      this.mcversion = release;
      this.step = 1;
      this.name = '';
      const defaultJava = this.$repo.getters.defaultJava;
      this.javaLocation = this.javas.find(j => j.path === defaultJava.path);

      this.minMemory = 1024;
      this.maxMemory = 2048;
    },
    getJavaValue(java) {
      return java;
    },
    getJavaText(java) {
      return `JRE${java.majorVersion}, ${java.path}`;
    },
    quit() {
      this.$emit('quit');
    },
    ping() {
      this.status = {
        version: {
          name: 'profile.server.ping',
          protocol: -1,
        },
        players: {
          max: -1,
          online: -1,
        },
        description: 'profile.server.pingDescription',
        favicon: '',
        ping: 0,
      };
      this.pinging = true;
      this.$repo.dispatch('pingServer', { host: this.host, port: 25565, protocol: Number.parseInt(mcToProtocol[this.mcversion], 10) }).then((frame) => {
        this.status = frame;
      }).finally(() => {
        this.pinging = false;
      });
    },
    doCreate() {
      this.$repo.dispatch('createAndSelectProfile', {
        name: this.name,
        mcversion: this.mcversion,
        minMemory: this.minMemory,
        maxMemory: this.maxMemory,
        java: this.javaLocation,
        type: 'server',
        host: this.host,
        port: this.port,
        forge: {
          version: this.forgeVersion,
        },
      }).then(() => {
        this.init();
        this.$router.replace('/');
      });
    },
  },
};
</script>

<style>
.java-select .v-select__selection {
  white-space: nowrap;
  overflow-x: hidden;
  overflow-y: hidden;

  max-width: 240px;
}
.v-stepper__step span {
  margin-right: 12px !important;
}
.v-stepper__step div {
  display: flex !important;
}
</style>
