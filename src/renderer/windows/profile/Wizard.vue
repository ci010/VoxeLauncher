<template>
	<v-container>
		<v-layout fill-height column>
			<v-card dark>
				<v-form ref="form" v-model="valid" lazy-validation>
					<v-layout align-space-around justify-space-between row fill-height>
						<v-text-field dark v-model="name" label="Name" :rules="nameRules" required></v-text-field>
						<v-text-field dark v-model="author" label="Author" required></v-text-field>
					</v-layout>

					<v-select v-model="mcversion" :items="versions" label="Version" required @change="" @blur=""></v-select>
					<!-- <version-select></version-select> -->

					<v-text-field dark v-model="description" label="Description"></v-text-field>
				</v-form>
			</v-card>
		</v-layout>
		<v-layout>
			<v-expansion-panel dark>
				<v-expansion-panel-content>
					<template v-slot:header>
						<div>Java</div>
					</template>
					<v-card>
						<v-card-text>
							<v-form v-model="javaValid">
								<v-text-field name="Java Location" v-model="javaLocation"></v-text-field>
								<v-text-field name="maxMemory" :rules="memoryRule" v-model="maxMemory"></v-text-field>
								<v-text-field name="minMemory" :rules="memoryRule" v-model="minMemory"></v-text-field>
							</v-form>
						</v-card-text>
					</v-card>
				</v-expansion-panel-content>
				<v-expansion-panel-content>
					<template v-slot:header>
						<div>Optifine</div>
					</template>
					<v-card>
						<v-card-text>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
							incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
							exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</v-card-text>
					</v-card>
				</v-expansion-panel-content>
				<v-expansion-panel-content>
					<template v-slot:header>
						<div>Forge</div>
					</template>
					<v-card>
						<v-card-text>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
							incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
							exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</v-card-text>
					</v-card>
				</v-expansion-panel-content>
				<v-expansion-panel-content>
					<template v-slot:header>
						<div>Liteloader</div>
					</template>
					<v-card>
						<v-card-text>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
							incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
							exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</v-card-text>
					</v-card>
				</v-expansion-panel-content>
			</v-expansion-panel>
		</v-layout>

		<v-layout>
			<v-btn dark @click="submit">
				<v-icon left>arrow_back</v-icon>
				Back
			</v-btn>
			<v-btn dark @click="submit">
				Submit
				<v-icon right>check</v-icon>
			</v-btn>
		</v-layout>
	</v-container>
</template>

<script>

export default {
  data: () => ({
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
      return Object.keys(this.$repo.state.versions.minecraft.versions);
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
