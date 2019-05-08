<template>
	<v-container grid-list>
		<v-layout wrap style="padding: 6px; 8px;" fill-height>
			<v-flex d-flex xs12 tag="h1" style="margin-bottom: 20px; " class="white--text">
				<span class="headline">{{$tc('setting.name', 2)}}</span>
			</v-flex>
			<v-flex d-flex xs6 grow>
				<v-select dark :label="$t('setting.language')" :items="langs" v-model="selectedLang"></v-select>
			</v-flex>
			<p class="white--text" style="position: absolute; bottom: 10px; right: 300px;">
				Present by <a href="https://github.com/ci010"> CI010 </a>
			</p>
		</v-layout>
	</v-container>
</template>

<script>
export default {
  data: function () {
    return {
      selectedLang: this.$repo.state.config.locale,
    };
  },
  watch: {
    selectedLang() {
      this.$repo.commit('config/locale', this.selectedLang);
    }
  },
  computed: {
    langs() {
      return this.$repo.state.config.locales;
    }
  }
}
</script>

<style>
</style>
