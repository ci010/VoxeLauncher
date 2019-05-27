<template>
	<v-container grid-list-md text-xs-center>
		<v-layout row>
			<v-flex xs10>
				<v-text-field v-model="filter" append-icon="filter_list" :label="$t('filter')" solo dark color="green darken-1"></v-text-field>
			</v-flex>
			<v-flex xs1>
				<v-tooltip :close-delay="0" left>
					<template v-slot:activator="{ on }">
						<v-speed-dial open-on-hover style="z-index: 1" direction="bottom" transition="slide-y-reverse-transition">
							<template v-slot:activator>
								<v-btn flat fab dark small style="margin-left: 5px; margin-top: 5px;" @click="goWizard"
								  v-on="on">
									<v-icon dark style="font-size: 28px">add</v-icon>
								</v-btn>
							</template>
							<v-btn style="z-index: 20;" fab small v-on="on" @mouseenter="enterAltCreate" @mouseleave="leaveAltCreate">
								<v-icon>storage</v-icon>
							</v-btn>
						</v-speed-dial>
					</template>
					{{hoverTextOnCreate}}
				</v-tooltip>
			</v-flex>
			<v-flex xs1>
				<v-tooltip :close-delay="0" left>
					<template v-slot:activator="{ on }">
						<v-speed-dial open-on-hover style="z-index: 1" direction="bottom" transition="slide-y-reverse-transition">
							<template v-slot:activator>
								<v-btn flat fab dark small style="margin-left: 5px; margin-top: 5px;" @click="doImport(false)"
								  v-on="on">
									<v-icon dark style="font-size: 28px">save_alt</v-icon>
								</v-btn>
							</template>
							<v-btn style="z-index: 20;" fab small v-on="on" @click="doImport(true)" @mouseenter="enterAltImport"
							  @mouseleave="leaveAltImport">
								<v-icon>folder</v-icon>
							</v-btn>
						</v-speed-dial>
					</template>
					{{hoverTextOnImport}}
				</v-tooltip>
			</v-flex>
		</v-layout>
		<!-- <v-flex style="height: 100%"> -->
		<v-layout row style="overflow: scroll; max-height: 450px;" justify-start fill-height>
			<v-flex v-for="profile in profiles" :key="profile.id" d-flex xs6 md12>
				<v-card draggable hover class="mx-auto" color="#grey darken-3" dark @click="selectProfile($event, profile.id)">
					<v-tooltip top>
						<template v-slot:activator="{ on }">
							<v-btn icon color="red" style="position: absolute; right: 0px;" @click="$event.stopPropagation();doDelete(profile.id)"
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
								<v-chip label :selected="false" @click="$event.stopPropagation()">{{ profile.mcversion }}</v-chip>
							</v-list-tile-avatar>

							<v-list-tile-content>
								<v-list-tile-title>{{ profile.author }}</v-list-tile-title>
							</v-list-tile-content>

							<v-layout justify-end align-end style="margin-bottom: auto;">
								<v-flex xs4>
									<v-tooltip top>
										<template v-slot:activator="{ on }">
											<v-btn @click="doCopy(profile.id)" v-on="on" light dark flat>
												<v-icon>file_copy</v-icon>
											</v-btn>
										</template>
										{{$t('profile.copy')}}
									</v-tooltip>
								</v-flex>
								<v-flex xs3>
									<!-- <v-tooltip top>
										<template v-slot:activator="{ on }">
											<v-btn v-on="on" @click="selectProfile($event, profile.id)" color="primary">
												<v-icon>check</v-icon>
											</v-btn>
										</template>
										{{$t('profile.select')}}
									</v-tooltip> -->
								</v-flex>
							</v-layout>
						</v-list-tile>
					</v-card-actions>
				</v-card>
			</v-flex>
		</v-layout>
		<v-dialog v-model="wizard" persistent>
			<wizard @quit="wizard=false"></wizard>
		</v-dialog>
	</v-container>
</template>

<script>

export default {
  data: function () {
    return {
      filter: '',
      wizard: false,
      hoverTextOnCreate: this.$t('profile.add'),
      hoverTextOnImport: this.$t('profile.importZip'),
    }
  },
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
  methods: {
    goWizard() {
      this.wizard = true;
    },
    doImport(fromFolder) {
      const filters = fromFolder ? [] : [{ extensions: ["zip"], name: "Zip" }];
      const properties = fromFolder ? ["openDirectory"] : ["openFile"];
      this.$electron.remote.dialog.showOpenDialog({
        title: this.$t("profile.import.title"),
        description: this.$t("profile.import.description"),
        filters,
        properties,
      }, (filenames, bookmarks) => {
        console.log(filenames);
        if (filenames && filenames.length > 0) {
          for (const f of filenames) {
            this.$repo.dispatch("profile/import", f);
          }
        }
      });
    },
    doDelete(id) {
      this.$repo.dispatch('profile/delete', id);
    },
    doCopy(id) {
    },
    selectProfile(event, id) {
      this.$repo.commit('profile/select', id);
      this.$router.replace('/');

      event.stopPropagation();
      return true;
    },
    enterAltCreate() {
      setTimeout(() => {
        this.hoverTextOnCreate = this.$t('profile.addServer');
      }, 100);
    },
    leaveAltCreate() {
      setTimeout(() => {
        this.hoverTextOnCreate = this.$t('profile.add');
      }, 100);
    },
    enterAltImport() {
      setTimeout(() => {
        this.hoverTextOnImport = this.$t('profile.importFolder');
      }, 100);
    },
    leaveAltImport() {
      setTimeout(() => {
        this.hoverTextOnImport = this.$t('profile.importZip');
      }, 100);
    }
  },
  components: {
    Wizard: () => import('./Wizard'),
  }
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
