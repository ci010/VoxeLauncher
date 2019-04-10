<template>
	<v-container grid-list-md text-xs-center>
		<v-layout row>
			<v-flex xs11>
				<v-text-field v-model="filter" append-icon="filter_list" :label="$t('filter')" solo dark color="green darken-1"></v-text-field>
			</v-flex>
			<v-flex xs1>
				<v-tooltip bottom>
					<template v-slot:activator="{ on }">
						<v-btn flat fab dark small style="margin-left: 5px; margin-top: 5px;" @click="goWizard" v-on="on">
							<v-icon dark style="font-size: 28px">add</v-icon>
						</v-btn>
					</template>
					{{$t('add')}}
				</v-tooltip>
			</v-flex>
		</v-layout>
		<!-- <v-flex style="height: 100%"> -->
		<v-layout column style="overflow: scroll; max-height: 450px;" align-space-around justify-start
		  fill-height>
			<v-flex v-for="profile in profiles" :key="profile.id">
				<v-card class="mx-auto" color="#grey darken-3" dark>
					<v-tooltip top>
						<template v-slot:activator="{ on }">
							<v-btn icon color="red" style="position: absolute; right: 0px;" @click="doDelete(profile.id)"
							  flat v-on="on">
								<v-icon dark>
									close
								</v-icon>
							</v-btn>
						</template>
						{{$t('!delete')}}
					</v-tooltip>
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
								<v-list-tile-title>{{ profile.author }}</v-list-tile-title>
							</v-list-tile-content>

							<v-layout justify-end style="margin-bottom: auto;">
								<v-btn @click="doCopy(profile.id)" flat>
									<v-icon>file_copy</v-icon>
								</v-btn>
								<v-tooltip top>
									<template v-slot:activator="{ on }">
										<v-btn v-on="on" @click="selectProfile(profile.id)" color="primary">
											<v-icon>check</v-icon>
										</v-btn>
									</template>
									{{$t('select')}}
								</v-tooltip>
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
    filter: '',
  }),
  computed: {
    profiles() {
      const filter = this.filter.toLowerCase();
      return this.$repo.getters['profile/profiles'].filter(profile =>
        filter === '' ||
        profile.author.toLowerCase().indexOf(filter) !== -1 ||
        profile.name.toLowerCase().indexOf(filter) !== -1 ||
        profile.description.toLowerCase().indexOf(filter) !== -1
      );
    }
  },
  mounted() {
  },
  watch: {},
  methods: {
    goWizard() {
      this.$router.replace('/wizard');
    },
    doDelete(id) {
      this.$repo.dispatch('profile/delete', id);
    },
    doCopy(id) {
    },
    selectProfile(id) {
      this.$repo.commit('profile/select', id);
      this.$router.replace('/');
    },
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
