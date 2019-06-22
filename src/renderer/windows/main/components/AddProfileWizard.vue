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
			<v-stepper-step editable step="3">
				{{$t('profile.forgeSetting')}}
				<small>{{$t('optional')}}</small>
			</v-stepper-step>
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
								<!-- <version-menu @value="mcversion = $event">
									<template v-slot="{ on }">
										<v-text-field dark append-icon="arrow" persistent-hint :hint="$t('profile.versionHint')"
										  v-model="mcversion" :label="$t('minecraft.version')" :readonly="true" @click:append="on.keydown"
										  v-on="on"></v-text-field>
									</template>
								</version-menu> -->
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
				<v-card class="mb-5" color="grey lighten-1" height="200px">

				</v-card>

				<v-layout>
					<v-btn flat @click="quit">{{$t('cancel')}}</v-btn>
					<v-spacer></v-spacer>
					<v-btn flat @click="step = 3">
						{{$t('next')}}
					</v-btn>
					<v-btn color="primary" :disabled="!valid" @click="doCreate">
						{{$t('create')}}
					</v-btn>
				</v-layout>
			</v-stepper-content>

			<v-stepper-content step="3">
				<v-card class="mb-5" color="grey lighten-1" height="200px"></v-card>

				<v-layout>
					<v-btn flat @click="quit">{{$t('cancel')}}</v-btn>
					<v-spacer></v-spacer>
					<v-btn flat @click="step = 1">
						{{$t('next')}}
					</v-btn>
					<v-btn color="primary" :disabled="!valid" @click="doCreate">
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
    return {
      step: 0,

      valid: false,
      mcversion: this.$repo.getters['minecraftRelease'].id,

      javaValid: true,
      maxMemory: 1024,
      minMemory: 1024,
      javaLocation: this.$repo.getters['defaultJava'],
      memoryRule: [v => Number.isInteger(v)],

      name: '',
      nameRules: [
        v => !!v || this.$t('profile.requireName')
      ],
      author: this.$repo.state.user.name,
      description: '',
    }
  },
  computed: {
    ready() {
      return this.valid && this.javaValid;
    },
    versions() {
      return Object.keys(this.$repo.state.version.minecraft.versions);
    },
  },
  components: {
  },
  methods: {
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
      }).then(() => {
        this.$router.replace('/');
      });
    },
  }
}
</script>

<style>
.v-stepper__step span {
  margin-right: 12px !important;
}
.v-stepper__step div {
  display: flex !important;
}
</style>
