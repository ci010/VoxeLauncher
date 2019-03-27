<template>
    <div style="margin: 10px; background: white; user-select: none; padding: 20px 0;">
        <v-card-text style="padding-left: 40px; padding-right: 40px; padding-bottom: 0px;">
            <v-form>
                <v-select prepend-icon="language" :items="languages" item-text="name" item-value="id" v-model="selectedLanguage" label="Language" flat></v-select>
                <!-- <v-select prepend-icon="subtitles" :items="themes" v-model="selectedTheme" label="Theme" flat></v-select> -->
            </v-form>
        </v-card-text>
        <v-card-actions style="padding-left: 40px; padding-right: 40px; padding-top: 0px">
            <v-flex text-xs-center>
                <v-btn block color="green" round large style="color: white" :disabled="!dirty" @click="save">
                    Save
                </v-btn>
            </v-flex>
        </v-card-actions>
    </div>
</template>

<script>

import localMapping from 'static/locale.mapping'

export default {
    data: () => ({
        selectedTheme: 'material',
        selectedLanguage: '',
    }),
    computed: {
        dirty() {
            return this.selectedTheme !== this.$store.state.config.theme ||
                this.selectedLanguage !== this.$store.state.config.locale;
        },
        languages() {
            return this.$store.state.config.locales
                .map(l => ({ name: localMapping[l], id: l }))
        },
        // themes() { return this.$store.state.config.themes; },
    },
    mounted() {
        const win = this.$electron.remote.getCurrentWindow();
        win.setSize(400, 400, true);

        this.selectedLanguage = this.$store.state.config.locale;
    },
    methods: {
        save() {
            if (this.selectedLanguage !== this.$store.state.config.locale) {
                this.$store.commit('config/locale', this.selectedLanguage);
            }
            // if (this.selectedTheme !== this.$store.state.config.theme) {
            //     this.$store.commit('config/theme', this.selectedTheme);
            // }
        }
    },
}
</script>

<style>
.moveable {
  -webkit-app-region: drag;
  user-select: none;
}

.non-moveable {
  -webkit-app-region: no-drag;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
.input-group {
  padding-top: 5px;
}
.password {
  padding-top: 5px;
}
.input-group--text-field label {
  top: 5px;
}
</style>
