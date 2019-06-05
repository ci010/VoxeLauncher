<template>
	<v-tooltip top>
		<template v-slot:activator="{ on }">
			<v-card v-on="on" color="darken-1" flat hover :class="{ incompatible: !compatible }" class="draggable-card mod-card white--text"
			  style="margin-top: 10px; padding: 0 10px;" draggable @dragstart="onDragStart" @dblclick="tryOpen">
				<v-layout justify-center align-center fill-height>
					<v-flex v-if="icon" xs4 style="padding: 0 10px 0 0;" fill-height>
						<v-img :src="icon" style="height: 100%" contain> </v-img>
					</v-flex>
					<v-flex xs8 style="padding: 10px 0;">
						<h3>
							{{data.name}}
							{{data.version}}
						</h3>
						<span style="color: #bdbdbd">
							{{data.description}}
						</span>
					</v-flex>
				</v-layout>
			</v-card>
		</template>
		{{ compatible ? data.modid : $t('mod.incompatible') }}
		<v-divider></v-divider>
	</v-tooltip>
</template>

<script>
export default {
  data() {
    return {
      icon: '',
    };
  },
  props: ['data', 'isSelected', 'index', 'hash', 'compatible'],
  mounted() {
    this.$repo.dispatch('resource/readForgeLogo', this.hash).then((icon) => {
      if (typeof icon === 'string' && icon !== '') {
        this.icon = `data:image/png;base64, ${icon}`;
      }
    })
  },
  methods: {
    onDragStart(e) {
      e.dataTransfer.setData("Index", `${this.isSelected ? 'R' : 'L'}${this.index}`);
    },
    tryOpen(e) {
      if (this.data.url) {
        this.$electron.shell.openExternal(this.data.url);
      }
    },
  },
}
</script>

<style scoped=true>
.incompatible.draggable-card:hover {
  background-color: #e65100;
}
.title {
  max-width: 100%;
  white-space: nowrap;
}
</style>