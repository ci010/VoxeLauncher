<template>
    <v-layout row>
        <v-btn
            style="position: absolute; right: 10px; bottom: 10px; "
            flat
            fab
            dark
            large
        >
            <v-icon dark>add</v-icon>
        </v-btn>
        <v-flex>
            <v-text-field
                append-icon="search"
                label="Search"
                solo
                dark
                color="green darken-1"
            ></v-text-field>
        </v-flex>
        <v-card
            v-for="profile in profiles"
            :key="profile.id"
            class="mx-auto"
            color="#26c6da"
            dark
            @click=""
            max-width="400"
        >
            <v-card-title>
                <v-icon
                    large
                    left
                >
                    mdi-twitter
                </v-icon>
                <span class="title font-weight-light">{{ profile.name }}</span>
            </v-card-title>

            <v-card-text class="headline font-weight-bold">
                {{ profile.description }}
            </v-card-text>

            <v-card-actions>
                <v-list-tile class="grow">
                    <v-list-tile-avatar color="grey darken-3">
                        <v-img
                            class="elevation-6"
                            src="https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortCurly&accessoriesType=Prescription02&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=White&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Default&skinColor=Light"
                        ></v-img>
                    </v-list-tile-avatar>

                    <v-list-tile-content>
                        <v-list-tile-title>Evan You</v-list-tile-title>
                    </v-list-tile-content>

                    <v-layout
                        align-center
                        justify-end
                    >
                        <v-icon class="mr-1">mdi-heart</v-icon>
                        <span class="subheading mr-2">256</span>
                        <span class="mr-1">·</span>
                        <v-icon class="mr-1">mdi-share-variant</v-icon>
                        <span class="subheading">45</span>
                    </v-layout>
                </v-list-tile>
            </v-card-actions>
        </v-card>
    </v-layout>
</template>

<script>

export default {
    data: () => ({
        profiles: [
            {
                id: 'a',
                name: 'abc',
                type: 'modpack',
                description: 'description',
            },
            {
                id: 'b',
                name: 'abc',
                type: 'modpack',
                description: 'description',
            },
            {
                id: 'c',
                name: 'abc',
                type: 'modpack',
                description: 'description',
            }
        ],
    }),
    computed: {
        //   profiles() { return this.$repo.state.profile.all }
    },
    mounted() {
    },
    watch: {
    },
    methods: {
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
    transition: opacity 0.01s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
}
</style>
