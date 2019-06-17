<template>
	<v-tooltip top>
		<template v-slot:activator="{ on }">
			<v-card v-on="on" color="darken-1" flat hover :class="{ incompatible: !compatible }" class="draggable-card white--text"
			  style="margin-top: 10px;" draggable @dragstart="onDragStart">
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
		</template>
		{{ compatible ? $t('resourcepack.compatible', { format: data.format, version: mcversion }) : $t('resourcepack.incompatible', {
			accept: acceptedRange,
			actual: mcversion,
			format: data.format
		}) }}
		<v-divider></v-divider>
	</v-tooltip>

</template>

<script>
import { isCompatible } from 'universal/utils/versions';
import packFormatMapping from 'universal/utils/packFormatMapping.json'

export default {
  props: ['data', 'isSelected', 'index'],
  computed: {
    mcversion() {
      return this.$repo.getters['selectedProfile'].mcversion;
    },
    acceptedRange() {
      return packFormatMapping[this.data.format];
    },
    compatible() {
      return isCompatible(this.acceptedRange, this.mcversion);
    },
  },
  methods: {
    onDragStart(e) {
      e.dataTransfer.setData("Index", `${this.isSelected ? 'R' : 'L'}${this.index}`);
    },
  },
}
</script>

<style scoped=true>
.incompatible.draggable-card:hover {
  background-color: #e65100;
}
.draggable-card:hover {
  background-color: #388E3C;
}

.title {
  max-width: 100%;
  white-space: nowrap;
}
</style>
