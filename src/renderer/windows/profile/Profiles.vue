<template>
	<v-container grid-list-md text-xs-center>
		<v-layout row>
			<v-flex xs11>
				<v-text-field append-icon="search" label="Search" solo dark color="green darken-1"></v-text-field>
			</v-flex>
			<v-flex xs1>
				<v-btn flat fab dark small style="margin-left: 5px; margin-top: 5px;">
					<v-icon dark style="font-size: 28px">add</v-icon>
				</v-btn>
			</v-flex>
		</v-layout>
		<!-- <v-flex style="height: 100%"> -->
		<v-layout column style="overflow: scroll; max-height: 400px;" align-space-around justify-start
		  fill-height>
			<v-flex v-for="profile in profiles" :key="profile.id">
				<v-card class="mx-auto" color="#grey darken-3" dark>
					<v-card-title>
						<v-icon large left>layers</v-icon>
						<span class="title font-weight-light">{{ profile.name }}</span>
					</v-card-title>

					<v-card-text class="headline font-weight-bold">{{ profile.description }}</v-card-text>

					<v-card-actions style="margin-top: 40px;">
						<v-list-tile class="grow">
							<v-list-tile-avatar color="grey darken-3">
								<v-img class="elevation-6" src="https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortCurly&accessoriesType=Prescription02&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=White&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Default&skinColor=Light"></v-img>
							</v-list-tile-avatar>

							<v-list-tile-content>
								<v-list-tile-title>Evan You</v-list-tile-title>
							</v-list-tile-content>

							<v-layout justify-end style="margin-bottom: auto;">
								<v-btn>
									<v-icon>delete</v-icon>
								</v-btn>
								<v-btn>
									<v-icon>file_copy</v-icon>
								</v-btn>
								<v-btn>
									<v-icon>check</v-icon>
								</v-btn>
							</v-layout>
						</v-list-tile>
					</v-card-actions>
				</v-card>
			</v-flex>
		</v-layout>
		<!-- </v-flex> -->
	</v-container>
</template>

<script>

export default {
  data: () => ({
    profiles: [
      {
        id: 'a',
        name: 'abc',
        type: 'modpack',
        description: 'description',
      },
      {
        id: 'b',
        name: 'abc',
        type: 'modpack',
        description: 'description',
      },
      {
        id: 'c',
        name: 'abc',
        type: 'modpack',
        description: 'description',
      }
    ],
  }),
  computed: {
    //   profiles() { return this.$repo.state.profile.all }
  },
  mounted() {
  },
  watch: {
  },
  methods: {
  },
}
</script>

<style>
.moveable {
  -webkit-app-region: drag;
  user-select: none;
}

.non-moveable {
  -webkit-app-region: no-drag;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.01s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
