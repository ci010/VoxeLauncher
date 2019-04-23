<template>
	<v-card color="grey darken-1" hover class="white--text" flat @click="trigger" style="margin-top: 10px;">
		<v-layout fill-height>
			<v-flex style="padding: 0;">
				<img :src="data.icon" style="height: 125px;" contain>
			</v-flex>
			<v-flex style="padding: 10px;">
				<span class="title">{{data.packName}}</span>
				<text-component :source="data.description"></text-component>
			</v-flex>
			<div style="position: absolute; z-index: 100">
				<v-btn v-if="isSelected && !noup" @click="moveup" icon>
					<v-icon>arrow_drop_up</v-icon>
				</v-btn>
				<v-btn v-if="isSelected & !nodown" @click="movedown" icon flat>
					<v-icon>arrow_drop_down</v-icon>
				</v-btn>
				<!-- <v-btn @click="trigger" icon v-if="isSelected">
					<v-icon>arrow_left</v-icon>
				</v-btn>
				<v-btn @click="trigger" icon v-else>
					<v-icon>arrow_right</v-icon>
				</v-btn> -->
			</div>

		</v-layout>
		<!-- <v-divider light></v-divider>
		<v-card-actions class="pa-3">
			Rate this album
			<v-spacer></v-spacer>
			<v-icon>star_border</v-icon>
			<v-icon>star_border</v-icon>
			<v-icon>star_border</v-icon>
			<v-icon>star_border</v-icon>
			<v-icon>star_border</v-icon>
		</v-card-actions> -->
	</v-card>
</template>

<script>
import TextComponent from './TextComponent';
export default {
  props: ['data', 'isSelected', 'noup', 'nodown'],
  mounted() {
  },
  methods: {
    moveup(e) {
      this.$emit('moveup');
      e.preventDefault();
      return true;
    },
    movedown(e) {
      this.$emit('movedown');
      e.preventDefault();
      return true;
    },
    trigger() {
      this.$emit('trigger');
    },
  },
  components: {
    TextComponent,
  },
}
</script>

<style scoped=true>
.title {
  max-width: 100%;
}
</style>
