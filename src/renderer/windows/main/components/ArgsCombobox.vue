<template>
	<v-combobox hide-details outline :label="label" :items="items" @input="byPassInput" :value="value"
	  multiple :search-input.sync="creating" :hide-no-data="!creating">
		<template v-slot:no-data>
			<v-list-tile>
				<span class="subheading">{{createHint}}</span>
				<v-chip label small>
					{{ creating }}
				</v-chip>
			</v-list-tile>
		</template>
		<template v-slot:selection="{ item, parent, selected, index }">
			<v-chip v-if="item === Object(item)" :selected="selected" label outline small style="margin: 10px 5px;">
				<span class="pr-2">
					{{ item.text }}
				</span>
				<v-icon small @click="parent.selectItem(item); item.index = index;">close</v-icon>
			</v-chip>
		</template>
		<template v-slot:item="{ item }">
			<v-list-tile-content>
				<v-text-field v-if="editing === item" v-model="editing.text" autofocus flat background-color="transparent"
				  hide-details solo @keyup.enter="edit(index, item)"></v-text-field>
				<v-chip v-else dark label small>
					{{ item.text }}
				</v-chip>
			</v-list-tile-content>
			<v-spacer></v-spacer>
			<v-list-tile-action @click.stop>
				<v-btn icon @click.stop.prevent="edit(index, item)">
					<v-icon>{{ editing !== item ? 'edit' : 'check' }}</v-icon>
				</v-btn>
			</v-list-tile-action>
			<v-list-tile-action @click.stop>
				<v-btn color="red" flat icon @click.stop.prevent="deleteItem(item)">
					<v-icon> close </v-icon>
				</v-btn>
			</v-list-tile-action>
		</template>
	</v-combobox>
</template>

<script>
import Vue from 'vue';

export default {
  props: ['create-hint', 'value', 'hint', 'label'],
  data() {
    return {
      editing: null,
      index: -1,
      items: [
        { header: this.hint }
      ],
      creating: null,
    }
  },
  methods: {
    byPassInput(val) {
      this.$emit('input', val.map((v) => {
        if (typeof v === 'string') {
          this.items.push({ text: v });
        }
        return v
      }))
    },
    edit(index, item) {
      if (!this.editing) {
        this.editing = item
        this.index = index
      } else {
        this.editing = null
        this.index = -1
      }
    },
    deleteItem(item) {
      Vue.delete(this.items, this.items.indexOf(item));
    },
    filter() {

    },
  }
}
</script>

<style>
</style>
