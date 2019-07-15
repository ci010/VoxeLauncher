<template>
	<v-dialog v-model="value" persistent width="600">
		<v-card dark>
			<v-card-title primary-title>
				{{$t('diagnosis.fix')}}
			</v-card-title>
			<v-list>
				<template v-for="(option, i) in options">
					<v-list-tile :key="i" ripple @click="fixProblem(option)">
						<v-list-tile-content>
							<v-list-tile-title>
								{{ option.title }}
							</v-list-tile-title>
							<v-list-tile-sub-title>
								{{ option.message }}
							</v-list-tile-sub-title>
						</v-list-tile-content>
						<v-list-tile-action>
							<v-icon> {{ option.autofix ? 'build' : 'arrow_right' }} </v-icon>
						</v-list-tile-action>
					</v-list-tile>
				</template>
			</v-list>
			<v-card-actions>
				<v-btn flat @click="$emit('close')">
					{{$t('cancel')}}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array,
      default: () => [],
    },
  }
}
</script>

<style>
</style>
