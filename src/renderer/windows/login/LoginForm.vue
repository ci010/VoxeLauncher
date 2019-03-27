<template>
    <div style="margin: 0 10px; background: white; user-select: none;">
        <v-flex text-xs-center pt-4>
            <v-avatar elevation-10 :tile="false" :size="150" style="box-shadow: 0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12);">
                <img src="https://avatars2.githubusercontent.com/u/8425057?s=460&v=4" alt="avatar">
            </v-avatar>
        </v-flex>
        <v-card-text style="padding-left: 40px; padding-right: 40px; padding-bottom: 0px;">
            <v-form v-model="valid">
                <v-select prepend-icon="router" :items="loginModes" v-model="selectedMode" :label="$t('loginMode')" flat></v-select>
                <v-text-field prepend-icon="person" :label="$t(`${selectedMode}.account`)" :rule="emailRules" required v-model="account"></v-text-field>
                <v-text-field prepend-icon="lock" :label="$t(`${selectedMode}.password`)" type="password" required :disabled="selectedMode==='offline'" v-model="password"></v-text-field>
                <v-checkbox v-model="rememberMe" label="Remember me" style="padding-top: 5px;">
                </v-checkbox>
            </v-form>
        </v-card-text>
        <v-card-actions style="padding-left: 40px; padding-right: 40px; padding-top: 0px">
            <v-flex text-xs-center>
                <v-btn block :loading="logining" color="green" round large style="color: white" @click="login">
                    {{$t('login')}}
                </v-btn>
                <div style="margin-top: 25px; margin-bottom: 25px;">
                    <a style="padding-right: 10px;">Forget Password?</a>
                    <a style="">{{$t('signup.description')}} {{$t('user.signup')}}</a>
                </div>
            </v-flex>
        </v-card-actions>
    </div>
</template>

<script>

export default {
    data: () => ({
        account: '',
        password: '',
        logining: false,
        rememberMe: false,
        valid: false,
        emailRules: [
            v => !!v || 'E-mail is required',
            v => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'E-mail must be valid'
        ],
        selectedMode: 'mojang',
    }),
    computed: {
        loginModes() { return this.$repo.getters['user/modes']; }
    },
    props: {
    },
    mounted() {
        const win = this.$electron.remote.getCurrentWindow();
        win.setSize(400, 680, true);
    },
    methods: {
        async login() {
            this.logining = true;
            await this.$repo.dispatch('user/selectLoginMode', this.selectedMode);
            await this.$repo.dispatch('user/login', {
                account: this.account,
                password: this.password,
            })
            this.logining = false;
            this.$electron.ipcRenderer.send('window-open', 'profile')
            this.$electron.remote.getCurrentWindow().close()
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
