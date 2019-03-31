<template>
	<v-menu v-model="menu" :close-on-content-click="false" :nudge-width="200" offset-x>
		<template v-slot:activator="{ on }">
			<v-btn dark flat v-on="on">
				Version
			</v-btn>
		</template>

		<v-card>
			<v-layout row>
				<v-flex xs3>
                    Version Names
				</v-flex>
                <v-flex xs9>

                </v-flex>
			</v-layout>
			<v-list>
				<v-list-tile avatar>
					<v-list-tile-avatar>
						<img src="https://cdn.vuetifyjs.com/images/john.jpg" alt="John">
					</v-list-tile-avatar>

					<v-list-tile-content>
						<v-list-tile-title>John Leider</v-list-tile-title>
						<v-list-tile-sub-title>Founder of Vuetify.js</v-list-tile-sub-title>
					</v-list-tile-content>

					<!-- <v-list-tile-action>
						<v-btn :class="fav ? 'red--text' : ''" icon @click="fav = !fav">
							<v-icon>favorite</v-icon>
						</v-btn>
					</v-list-tile-action> -->
				</v-list-tile>
			</v-list>

			<v-divider></v-divider>

			<v-list>
				<!-- <v-list-tile>
					<v-list-tile-action>
						<v-switch v-model="message" color="purple"></v-switch>
					</v-list-tile-action>
					<v-list-tile-title>Enable messages</v-list-tile-title>
				</v-list-tile>

				<v-list-tile>
					<v-list-tile-action>
						<v-switch v-model="hints" color="purple"></v-switch>
					</v-list-tile-action>
					<v-list-tile-title>Enable hints</v-list-tile-title>
				</v-list-tile> -->
			</v-list>

			<v-card-actions>
				<v-spacer></v-spacer>

				<v-btn flat @click="menu = false">Cancel</v-btn>
				<v-btn color="primary" flat @click="menu = false">Save</v-btn>
			</v-card-actions>
		</v-card>
	</v-menu>
</template>

<script>
export default {
  data: () => ({
    menu: false,
  }),
  methods: {

  },
}
</script>

<style>
</style>
