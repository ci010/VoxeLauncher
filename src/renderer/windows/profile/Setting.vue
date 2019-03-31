<template>
	<v-layout fill-height column>
		<v-btn style="position: absolute; left: 10px; top: 10px; " flat icon dark @click="goBack">
			<v-icon dark>arrow_back</v-icon>
		</v-btn>
	</v-layout>
</template>

<script>
export default {
  methods: {
    goBack() {
      this.$router.replace('/');
    }
  }
}
</script>

<style>
</style>
