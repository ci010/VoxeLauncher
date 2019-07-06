<template>
  <v-container grid-list-xs fill-height style="overflow: auto;">
    <v-layout row wrap justify-start align-content-start>
      <v-flex tag="h1" style="margin-bottom: 10px;" class="white--text" xs12>
        <span class="headline">{{ $t('profile.launchingDetail') }}</span>
      </v-flex>
      <v-flex d-flex xs12>
        <v-select v-model="java" hide-details outline :item-text="getJavaText"
                  :item-value="getJavaValue" prepend-inner-icon="add" :label="$t('java.location')" :items="javas" required
                  :menu-props="{ auto: true, overflowY: true }" @click:prepend-inner="browseFile" />
      </v-flex>
      <v-flex d-flex xs6>
        <v-text-field v-model="minMemory" hide-details outline type="number" :label="$t('java.minMemory')"
                      required />
      </v-flex>
      <v-flex d-flex xs6>
        <v-text-field v-model="maxMemory" hide-details outline type="number" :label="$t('java.maxMemory')"
                      required />
      </v-flex>
      <v-flex d-flex xs12>
        <args-combobox v-model="vmOptions" :label="$t('profile.vmOptions')" :create-hint="$t('profile.vmOptionsCreateHint')"
                       :hint="$t('profile.vmOptionsHint')" />
      </v-flex>
      <v-flex d-flex xs12>
        <args-combobox v-model="mcOptions" :label="$t('profile.mcOptions')" :create-hint="$t('profile.mcOptionsCreateHint')"
                       :hint="$t('profile.mcOptionsHint')" />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import AbstractSetting from '../mixin/AbstractSetting';

export default {
  mixins: [AbstractSetting],
  data() {
    return {
      vmOptions: [],
      mcOptions: [],

      maxMemory: undefined,
      minMemory: undefined,
      memoryRange: [256, 10240],
      memoryRule: [v => Number.isInteger(v)],

      javaValid: true,
      java: { path: '', version: '' },
    };
  },
  computed: {
    javas() {
      return this.$repo.state.java.all;
    },
  },
  methods: {
    save() {
      this.$repo.dispatch('editProfile', {
        minMemory: this.minMemory,
        maxMemory: this.maxMemory,
        vmOptions: this.vmOptions,
        mcOptions: this.mcOptions,
        java: this.java,
      });
    },
    load() {
      const profile = this.$repo.getters.selectedProfile;
      this.maxMemory = profile.maxMemory;
      this.minMemory = profile.minMemory;
      this.vmOptions = profile.vmOptions;
      this.mcOptions = profile.mcOptions;

      if (profile.java) {
        this.java = this.javas.find(j => j.path === profile.java.path);
      }
    },

    browseFile() {
      this.$electron.remote.dialog.showOpenDialog({
        title: this.$t('java.browse'),
      }, (filePaths, bookmarks) => {
        filePaths.forEach((p) => {
          this.$repo.dispatch('resolveJava', p);
        });
      });
    },
    getJavaValue(java) {
      return java;
    },
    getJavaText(java) {
      return `JRE${java.majorVersion}, ${java.path}`;
    },
  },
};
</script>

<style scoped=true>
.flex {
  padding: 6px 8px !important;
}
</style>
