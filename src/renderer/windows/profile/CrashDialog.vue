<template>
	<v-dialog :value="value" persistent>
		<v-toolbar dark tabs color="grey darken-3">
			<v-toolbar-title>{{location}}</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-btn icon @click="$emit('close')">
				<v-icon>arrow_drop_down</v-icon>
			</v-btn>
		</v-toolbar>
		<v-card flat style="min-height: 300px; overflow-y: auto;" dark>
			<v-textarea hide-details solo style="max-height: 400px" background-color="grey darken-4"
			  readonly auto-grow :value="content" flat>
			</v-textarea>
		</v-card>
	</v-dialog>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      default: true,
    },
    content: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
  },
}
</script>

<style>
</style>
