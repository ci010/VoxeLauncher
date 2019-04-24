<template>
	<v-card color="grey darken-1" hover class="resource-pack-card white--text" flat style="margin-top: 10px;" draggable
	  @dragstart="onDragStart">
		<v-layout fill-height>
			<v-flex style="padding: 0;">
				<img style="user-drag: none; user-select: none; height: 125px;" :src="data.icon" contain>
			</v-flex>
			<v-flex style="padding: 10px;">
				<text-component :source="data.packName" class="title"></text-component>
				<text-component :source="data.description"></text-component>
			</v-flex>
			<!-- <div style="position: absolute; z-index: 100">
				<v-btn color="green" style="position: absolute; left: 10px;" v-if="isSelected && !noup" @click="moveup"
				  icon>
					<v-icon>arrow_drop_up</v-icon>
				</v-btn>
				<v-btn color="green" style="position: absolute; left: 10px; top: 80px;" v-if="isSelected & !nodown"
				  @click="movedown" icon>
					<v-icon>arrow_drop_down</v-icon>
				</v-btn>
				<v-btn color="green" style="position: absolute; left: 70px; top: 40px" @click="trigger" icon
				  v-if="isSelected">
					<v-icon>arrow_left</v-icon>
				</v-btn>
				<v-btn color="green" style="position: absolute; left: 70px; top: 40px" @click="trigger" icon
				  v-else>
					<v-icon>arrow_right</v-icon>
				</v-btn>
			</div> -->

		</v-layout>
	</v-card>
</template>

<script>
import TextComponent from './TextComponent';
export default {
  props: ['data', 'isSelected', 'index'],
  mounted() {
  },
  methods: {
    onDragStart(e) {
			e.dataTransfer.setData("Index", `${this.isSelected ? 'R' : 'L'}${this.index}`);
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
