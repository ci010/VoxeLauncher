<template>
	<v-stepper non-linear dark v-model="step">
		<v-stepper-header>
			<v-stepper-step :rules="[() => valid]" editable :complete="step > 1" step="1">{{$t('profile.baseSetting')}}</v-stepper-step>
			<v-divider></v-divider>
			<v-stepper-step editable :complete="step > 2" step="2">
				{{$t('profile.advancedSetting')}}
				<small>{{$t('optional')}}</small>
			</v-stepper-step>
			<v-divider></v-divider>
		</v-stepper-header>

		<v-stepper-items>
			<v-stepper-content step="1">
				<v-form ref="form" v-model="valid" lazy-validation style="height: 100%;">
					<v-container grid-list fill-height>
						<v-layout row wrap>
							<v-flex d-flex xs4>
								<v-text-field dark v-model="name" persistent-hint :hint="$t('profile.nameHint')" :label="$t('name')"
								  :rules="nameRules" required></v-text-field>
							</v-flex>
							<v-flex d-flex xs4>
								<v-text-field dark v-model="author" persistent-hint :hint="$t('profile.authorHint')" :label="$t('author')"
								  required></v-text-field>
							</v-flex>
							<v-flex d-flex xs4>
								<version-menu @value="mcversion = $event">
									<template v-slot="{ on }">
										<v-text-field dark append-icon="arrow" persistent-hint :hint="$t('profile.versionHint')"
										  v-model="mcversion" :label="$t('minecraft.version')" :readonly="true" @click:append="on.keydown"
										  v-on="on"></v-text-field>
									</template>
								</version-menu>
							</v-flex>
							<v-flex d-flex xs12>
								<v-text-field dark v-model="description" persistent-hint :hint="$t('profile.descriptionHint')"
								  :label="$t('description')">
								</v-text-field>
							</v-flex>
						</v-layout>
					</v-container>
				</v-form>
				<v-layout>
					<v-btn flat @click="quit">{{$t('cancel')}}</v-btn>
					<v-spacer></v-spacer>
					<v-btn flat @click="step = 2">
						{{$t('next')}}
					</v-btn>
					<v-btn color="primary" :disabled="!valid || name === '' || mcversion === ''" @click="doCreate">
						{{$t('create')}}
					</v-btn>
				</v-layout>
			</v-stepper-content>
			<v-stepper-content step="2">
				<v-form v-model="valid" lazy-validation style="height: 100%;">
					<v-container grid-list fill-height style="overflow: auto;">
						<v-layout row wrap>
							<v-flex d-flex xs6>
								<v-select class="java-select" hide-details :item-text="getJavaText" :item-value="getJavaValue"
								  prepend-inner-icon="add" v-model="javaLocation" :label="$t('java.location')" :items="javas"
								  required :menu-props="{ auto: true, overflowY: true }"></v-select>
							</v-flex>
							<v-flex d-flex xs3>
								<v-text-field hide-details type="number" v-model="minMemory" :label="$t('java.minMemory')"
								  required></v-text-field>
							</v-flex>
							<v-flex d-flex xs3>
								<v-text-field hide-details type="number" v-model="maxMemory" :label="$t('java.maxMemory')"
								  required></v-text-field>
							</v-flex>
							<v-flex d-flex xs6>
								<forge-version-menu @value="forgeVersion = $event.version" :mcversion="mcversion">
									<template v-slot="{ on }">
										<v-text-field dark append-icon="arrow" persistent-hint :hint="$t('profile.versionHint')"
										  v-model="forgeVersion" :label="$t('forge.version')" :readonly="true" @click:append="on.keydown"
										  v-on="on"></v-text-field>
									</template>
								</forge-version-menu>
							</v-flex>
						</v-layout>
					</v-container>
				</v-form>

				<v-layout>
					<v-btn flat @click="quit">{{$t('cancel')}}</v-btn>
					<v-spacer></v-spacer>
					<!-- <v-btn flat @click="step = 3">
						{{$t('next')}}
					</v-btn> -->
					<v-btn color="primary" :disabled="!valid || name === '' || mcversion === ''" @click="doCreate">
						{{$t('create')}}
					</v-btn>
				</v-layout>
			</v-stepper-content>
		</v-stepper-items>
	</v-stepper>
</template>

<script>

export default {
  data: function () {
    const release = this.$repo.getters['minecraftRelease'].id;
    const forge = release ? this.$repo.getters.forgeRecommendedOf(release) : '';
    const forgeVersion = forge ? forge.version : '';
    return {
      step: 1,
      valid: false,

      name: '',
      mcversion: release,
      forgeVersion,
      javaLocation: this.$repo.getters['defaultJava'],
      maxMemory: 2048,
      minMemory: 1024,
      author: this.$repo.state.user.name,
      description: '',

      javaValid: true,
      memoryRule: [v => Number.isInteger(v)],
      nameRules: [
        v => !!v || this.$t('profile.requireName')
      ],
    }
  },
  computed: {
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
  props: {
    show: {
      type: Boolean,
      default: false,
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
    init() {
      const release = this.$repo.getters['minecraftRelease'].id;
      const forge = release ? this.$repo.getters.forgeRecommendedOf(release) : '';
      const forgeVersion = forge ? forge.version : '';
      this.forgeVersion = forgeVersion;
      this.mcversion = release;
      this.step = 1;
      this.name = '';
      this.author = this.$repo.state.user.name;
      this.description = '';
      const defaultJava = this.$repo.getters.defaultJava;
      this.javaLocation = this.javas.find(j => j.path === defaultJava.path);

      this.minMemory = 1024;
      this.maxMemory = 2048;
    },
    getJavaValue(java) {
      return java;
    },
    getJavaText(java) {
      return `JRE${java.majorVersion}, ${java.path}`
    },
    quit() {
      this.$emit('quit');
    },
    doCreate() {
      this.$repo.dispatch('createAndSelectProfile', {
        name: this.name,
        author: this.author,
        description: this.description,
        mcversion: this.mcversion,
        minMemory: this.minMemory,
        maxMemory: this.maxMemory,
        java: this.javaLocation,
        mcversion: this.mcversion,
        forge: {
          version: this.forgeVersion,
        },
      }).then(() => {
        this.init();
        this.$router.replace('/');
      });
    },
  }
}
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
