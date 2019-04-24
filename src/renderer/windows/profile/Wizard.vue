<template>
	<v-stepper vertical non-linear dark v-model="step">
		<v-stepper-header>
			<v-stepper-step editable :complete="step > 1" step="1">ABC</v-stepper-step>

			<v-divider></v-divider>

			<v-stepper-step editable :complete="step > 2" step="2">Name of step 2</v-stepper-step>

			<v-divider></v-divider>

			<v-stepper-step editable step="3">Name of step 3</v-stepper-step>
		</v-stepper-header>

		<v-stepper-items>
			<v-stepper-content step="1">
				<v-card class="mb-5" height="200px">
					<v-card-text>
						ABC
					</v-card-text>
				</v-card>

				<v-btn color="primary" @click="step = 2">
					Continue
				</v-btn>

				<v-btn flat>Cancel</v-btn>
			</v-stepper-content>

			<v-stepper-content step="2">
				<v-card class="mb-5" color="grey lighten-1" height="200px">

				</v-card>

				<v-btn color="primary" @click="step = 3">
					Continue
				</v-btn>

				<v-btn flat>Cancel</v-btn>
			</v-stepper-content>

			<v-stepper-content step="3">
				<v-card class="mb-5" color="grey lighten-1" height="200px"></v-card>

				<v-btn color="primary" @click="step = 1">
					Continue
				</v-btn>

				<v-btn flat>Cancel</v-btn>
			</v-stepper-content>
		</v-stepper-items>
	</v-stepper>
</template>

<script>

export default {
  data: () => ({
    step: 0,

    valid: true,

    mcversion: '',

    javaValid: true,
    maxMemory: 1024,
    minMemory: 1024,
    javaLocation: '',
    memoryRule: [v => Number.isInteger(v)],

    name: '',
    nameRules: [
      v => !!v || 'Name is required',
      v => (v && v.length <= 10) || 'Name must be less than 10 characters'
    ],
    author: '',
    description: 'No description',
  }),
  computed: {
    ready() {
      return this.valid && this.javaValid;
    },
    versions() {
      return Object.keys(this.$repo.state.version.minecraft.versions);
    },
  },
  components: {
    VersionSelect: () => import('./VersionSelect'),
  },
  mounted() {
    this.author = this.$repo.state.user.name;
  },
  methods: {
    submit() {
      this.$repo.dispatch('profile/createAndSelect', {
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
</style>
