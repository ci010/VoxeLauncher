<template>
	<v-card color="cyan darken-2" class="white--text" flat>
		<v-layout>
			<v-flex xs5>
				<v-img src="https://cdn.vuetifyjs.com/images/cards/foster.jpg" height="125px" contain></v-img>
			</v-flex>
			<v-flex xs7>
				<v-card-title primary-title>
					<div>
						<div class="headline">Supermodel</div>
						<div>Foster the People</div>
						<div>(2014)</div>
					</div>
				</v-card-title>
			</v-flex>
		</v-layout>
		<v-divider light></v-divider>
		<v-card-actions class="pa-3">
			Rate this album
			<v-spacer></v-spacer>
			<v-icon>star_border</v-icon>
			<v-icon>star_border</v-icon>
			<v-icon>star_border</v-icon>
			<v-icon>star_border</v-icon>
			<v-icon>star_border</v-icon>
		</v-card-actions>
	</v-card>
</template>

<script>
export default {
  props: ['data', 'isSelected'],
  methods: {
    moveup() {
      this.$emit('moveup');
    },
    movedown() {
      this.$emit('movedown');
    },
    trigger() {
      this.$emit('trigger');
    },
  },
}
</script>

<style>
</style>
