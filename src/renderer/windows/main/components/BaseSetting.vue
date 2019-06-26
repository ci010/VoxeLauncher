<template>
  <v-form ref="form" v-model="valid" lazy-validation>
    <v-container grid-list-xs fill-height style="overflow: auto;">
      <v-layout row wrap justify-start align-start>
        <v-flex tag="h1" style="margin-bottom: 10px;" class="white--text" xs12>
          <span class="headline">{{ $t('profile.setting') }}</span>
        </v-flex>
        <v-flex d-flex xs6>
          <v-text-field v-model="name" outline hide-details dark :label="$t('profile.name')"
                        :placeholder="`Minecraft ${mcversion}`" />
        </v-flex>
        <v-flex d-flex xs6>
          <v-text-field outline hide-details dark readonly :value="$repo.getters.currentVersion.id"
                        :label="$t('profile.version')" @click="$emit('goto', [0, 0])" />
        </v-flex>
        <v-flex d-flex xs6>
          <v-text-field v-model="author" outline hide-details dark :label="$t('profile.modpack.author')"
                        :placeholder="$repo.state.user.name" required />
        </v-flex>
        <v-flex d-flex xs6>
          <v-text-field v-model="url" outline hide-details dark :label="$t('profile.url')" placeholder="www.whatever.com"
                        required />
        </v-flex>
        <v-flex d-flex xs12>
          <v-text-field v-model="description" outline hide-details dark :label="$t('profile.modpack.description')" />
        </v-flex>

        <v-flex d-flex xs6>
          <v-btn outline large @click="$emit('goto', [1, 0])">
            {{ $tc('gamesetting.name', 2) }}
          </v-btn>
        </v-flex>
        <v-flex d-flex xs6>
          <v-btn outline large @click="$emit('goto', [0, 2])">
            {{ $t('profile.launchingDetail') }}
          </v-btn>
        </v-flex>
        <v-flex d-flex xs6>
          <v-btn outline large @click="$emit('goto', [1, 1])">
            {{ $tc('resourcepack.name', 2) }}
          </v-btn>
        </v-flex>
        <v-flex d-flex xs6>
          <v-btn outline large @click="$emit('goto', [2, 0])">
            {{ $tc('mod.name', 2) }}
          </v-btn>
        </v-flex>

        <v-flex d-flex xs6>
          <v-checkbox v-model="hideLauncher" hide-details dark :label="$t('launch.hideLauncher')" />
        </v-flex>
        <v-flex d-flex xs6>
          <v-checkbox v-model="showLog" hide-details dark :label="$t('launch.showLog')" />
        </v-flex>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script>
import AbstractSetting from '../mixin/AbstractSetting';

export default {
  mixins: [AbstractSetting],
  data () {
    return {
      active: 0,
      valid: true,
      hideLauncher: false,
      showLog: false,
      type: '',
      name: '',

      host: '',
      port: -1,

      author: '',
      description: '',
      url: '',
    };
  },
  computed: {
    mcversion: {
      get() { return this.$repo.getters.selectedProfile.mcversion; },
      set(v) { this.$repo.dispatch('editProfile', { mcversion: v }); },
    },
    forgeVersion: {
      get() { return this.$repo.getters.selectedProfile.forge.version; },
      set(v) { return this.$repo.dispatch('editProfile', { forge: { version: v } }); },
    },
    localVersion: {
      get() {
        const ver = this.$repo.getters.currentVersion;
        return this.localVersions.find(v => ver.id === v.id);
      },
      set(v) {
        const payload = {};
        if (v.minecraft !== this.mcversion) {
          this.mcversion = v.minecraft;
          payload.mcversion = this.mcversion;
        }
        const profile = this.$repo.getters.selectedProfile;
        if (v.forge !== profile.forge.version) {
          payload.forge = {
            version: v.forge || '',
          };
        }
        this.$repo.dispatch('editProfile', payload);
      },
    },
    localVersions() {
      return this.$repo.state.version.local;
    },
    versions() {
      return Object.keys(this.$repo.state.version.minecraft.versions);
    },
  },
  created() {
    this.$repo.dispatch('refreshForge').catch((e) => {
      console.error(e);
    });
  },
  methods: {
    save() {
      const payload = {
        name: this.name,
        hideLauncher: this.hideLauncher,
        url: this.url,
        showLog: this.showLog,
      };
      if (this.type === 'modpack') {
        this.$repo.dispatch('editProfile', {
          ...payload,
          author: this.author,
          description: this.description,
        });
      } else {
        this.$repo.dispatch('editProfile', {
          ...payload,
          host: this.host,
          port: this.port,
        });
      }
    },
    load() {
      const profile = this.$repo.getters.selectedProfile;
      this.name = profile.name;
      this.hideLauncher = profile.hideLauncher;
      this.url = profile.url;
      this.showLog = profile.showLog;
      this.type = profile.type;
      if (profile.type === 'modpack') {
        this.author = profile.author;
        this.description = profile.description;
      } else {
        this.port = profile.port;
        this.host = profile.host;
      }
    },
    onSelectForge(version) {
      if (version) {
        this.forgeVersion = version.version;
      } else {
        this.forgeVersion = '';
      }
    },
    onNameInput(event) {
      if (!this.editingName) {
        event.preventDefault();
      }
    },
    onMouseWheel(e) {
      e.stopPropagation();
      return true;
    },
  },
};
</script>

<style scoped=true>
.flex {
  padding: 6px 8px !important;
}
button {
  margin: 0
}
</style>
<style>
.v-menu {
  max-width: 0px;
}
.local-version .v-select__selection--comma {
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
