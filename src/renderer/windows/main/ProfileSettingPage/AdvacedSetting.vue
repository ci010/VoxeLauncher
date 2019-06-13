<template>
	<v-container grid-list-xs fill-height style="overflow: auto;">
		<v-layout row wrap justify-start align-content-start>
			<v-flex tag="h1" style="margin-bottom: 10px;" class="white--text" xs12>
				<span class="headline">{{$t('profile.launchingDetail')}}</span>
			</v-flex>
			<v-flex d-flex xs12>
				<v-select :item-text="regularText" :item-value="getJavaValue" dark prepend-inner-icon="add"
				  v-model="java" :label="$t('java.location')" :items="javas" required :menu-props="{ auto: true, overflowY: true }"
				  @click:prepend-inner="browseFile"></v-select>
			</v-flex>
			<v-flex d-flex xs6>
				<v-text-field dark type="number" v-model="minMemory" :label="$t('java.minMemory')" required></v-text-field>
			</v-flex>
			<v-flex d-flex xs6>
				<v-text-field dark type="number" v-model="maxMemory" :label="$t('java.maxMemory')" required></v-text-field>
			</v-flex>
			<v-flex d-flex xs12>
				<v-combobox dark :label="$t('profile.vmOptions')" :items="usedVmOptions" v-model="vmOptions"
				  multiple></v-combobox>
			</v-flex>
			<v-flex d-flex xs12>
				<v-combobox dark :label="$t('profile.mcOptions')" :items="usedMcOptions" v-model="mcOptions"
				  multiple></v-combobox>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
export default {
  data() {
    return {
      usedVmOptions: [],
      usedMcOptions: [],
      vmOptions: [],
      mcOptions: [],

      maxMemory: 1024,
      minMemory: 2048,
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
      const profile = this.$repo.getters['selectedProfile'];
      this.maxMemory = profile.maxMemory;
      this.minMemory = profile.minMemory;
      this.vmOptions = profile.vmOptions;
      this.mcOptions = profile.mcOptions;
      this.java = profile.java;
    },
    getJavaValue(java) {
      return java;
    },
    regularText(java) {
      const text = `v${java.version}: ${java.path}`
      if (text.length > 25) {
        return text.substring(0, 25) + '...'
      }
      return text;
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
  }
}
</script>

<style scoped=true>
.flex {
  padding: 6px 8px !important;
}
</style>