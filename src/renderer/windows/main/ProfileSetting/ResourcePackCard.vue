<template>
	<div>
		<v-card color="darken-1" flat hover class="resource-pack-card white--text"  style="margin-top: 10px;"
		  draggable @dragstart="onDragStart">
			<v-layout justify-center align-center fill-height>
				<v-flex xs6 style="padding: 0;">
					<v-img style="user-drag: none; user-select: none; height: 125px;" :src="data.icon" contain>
					</v-img>
				</v-flex>
				<v-flex xs6 style="padding-top: 10px;">
					<text-component style="white-space: normal; word-break: break-word;" :source="data.packName"
					  class="title"></text-component>
					<text-component style="white-space: normal; word-break: break-word;" :source="data.description"></text-component>
				</v-flex>
			</v-layout>
		</v-card>
		<v-divider></v-divider>
	</div>
</template>

<script>
export default {
  props: ['data', 'isSelected', 'index'],
  mounted() {
  },
  methods: {
    onDragStart(e) {
      e.dataTransfer.setData("Index", `${this.isSelected ? 'R' : 'L'}${this.index}`);
    },
  },
}
</script>

<style scoped=true>
.title {
  max-width: 100%;
  white-space: nowrap;
}
</style>
