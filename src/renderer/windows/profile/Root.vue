<template>
	<v-app style="background: transparent;">
		<v-layout fill-height>
			<v-navigation-drawer width=700px v-model="drawer" :mini-variant.sync="mini" stateless absolute
			  dark style="border-radius: 2px;" @click="onNaviClicked">
				<v-toolbar flat class="transparent">
					<v-list class="pa-0">
						<v-list-tile avatar>
							<v-list-tile-avatar>
								<img src="https://randomuser.me/api/portraits/men/100.jpg">
							</v-list-tile-avatar>

							<v-list-tile-content>
								<v-list-tile-title>Username</v-list-tile-title>
							</v-list-tile-content>

							<v-list-tile-action>
								<v-btn icon @click.stop="mini = !mini">
									<v-icon>chevron_left</v-icon>
								</v-btn>
							</v-list-tile-action>
						</v-list-tile>
					</v-list>
				</v-toolbar>
				<v-list>
					<v-divider></v-divider>
					<v-list-tile @click="">
						<v-list-tile-action>
							<v-icon>home</v-icon>
						</v-list-tile-action>
						<v-list-tile-title>Home</v-list-tile-title>
					</v-list-tile>

					<v-list-group prepend-icon="account_circle" v-model="openBinding[0]">
						<template v-slot:activator>
							<v-list-tile>
								<v-list-tile-title>Users</v-list-tile-title>
							</v-list-tile>
						</template>
						<v-list-group no-action sub-group v-model="openBinding[1]">
							<template v-slot:activator>
								<v-list-tile>
									<v-list-tile-title>Admin</v-list-tile-title>
								</v-list-tile>
							</template>

							<v-list-tile v-for="(admin, i) in admins" :key="i" @click="">
								<v-list-tile-title v-text="admin[0]"></v-list-tile-title>
								<v-list-tile-action>
									<v-icon v-text="admin[1]"></v-icon>
								</v-list-tile-action>
							</v-list-tile>
						</v-list-group>

						<v-list-group sub-group no-action v-model="openBinding[2]">
							<template v-slot:activator>
								<v-list-tile>
									<v-list-tile-title>Actions</v-list-tile-title>
								</v-list-tile>
							</template>
							<v-list-tile v-for="(crud, i) in cruds" :key="i" @click="">
								<v-list-tile-title v-text="crud[0]"></v-list-tile-title>
								<v-list-tile-action>
									<v-icon v-text="crud[1]"></v-icon>
								</v-list-tile-action>
							</v-list-tile>
						</v-list-group>
					</v-list-group>
				</v-list>
			</v-navigation-drawer>
			<v-layout style="padding: 20px 0px 20px 0px; background: transparent; max-height: 100vh;"
			  fill-height>
				<div style="width: 100px;"></div>

				<v-card style="width: 100%;" color="grey darken-4">
					<router-view></router-view>
				</v-card>

			</v-layout>
		</v-layout>
	</v-app>
</template>

<script>
import logo from '@/assets/minecraft.logo.png'

export default {
  data: () => ({
    logo,
    tab: '',
    text: 'shit',
    openBinding: [false, false, false, false],
    backupBinding: [false, false, false, false],

    items: ['news', 'settings', 'mods'],
    admins: [
      ['Management', 'people_outline'],
      ['Settings', 'settings']
    ],
    cruds: [
      ['Create', 'add'],
      ['Read', 'insert_drive_file'],
      ['Update', 'update'],
      ['Delete', 'delete']
    ],

    drawer: true,
    mini: true,
  }),
  mounted() {
  },
  watch: {
    mini() {
      if (!this.mini) {
        this.openBinding = [...this.backupBinding];
      } else {
        this.backupBinding = [...this.openBinding];
        this.openBinding = [false, false, false, false];
      }
    },
  },
  methods: {
    close() {
      this.$store.dispatch('exit');
    },
    onNaviClicked() {
			console.log('click!')
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
