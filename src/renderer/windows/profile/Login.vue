<template>
	<div style="margin: 0 40px; ">
		<v-flex text-xs-center pt-4>
			<v-avatar elevation-10 :tile="false" :size="150" style="box-shadow: 0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12);">
				<img src="https://avatars2.githubusercontent.com/u/8425057?s=460&v=4" alt="avatar">
			</v-avatar>
		</v-flex>
		<v-card-text style="padding-left: 40px; padding-right: 40px; padding-bottom: 0px;">
			<v-form ref="form" v-model="valid">
				<v-select prepend-icon="router" :items="loginModes" v-model="selectedMode" :label="$t('loginMode')"
				  flat dark></v-select>

				<v-combobox dark prepend-icon="person" :label="$t(`${selectedMode}.account`)" :rules="accountRules"
				  :items="history" v-model="account" :error="accountError" :error-messages="accountErrors"
				  required>
				</v-combobox>

				<!-- <v-text-field dark prepend-icon="person" :label="$t(`${selectedMode}.account`)" :rules="accountRules"
				  v-model="account" :error="accountError" :error-messages="accountErrors" required @keypress="handleKey"></v-text-field> -->
				<v-text-field dark="" prepend-icon="lock" :label="$t(`${selectedMode}.password`)" type="password"
				  :rules="passworldRuls" :disabled="selectedMode==='offline'" v-model="password" :error="passwordError"
				  :error-messages="passwordErrors" required @keypress="handleKey"></v-text-field>
				<v-checkbox v-model="rememberMe" label="Remember me" style="padding-top: 5px;" dark>
				</v-checkbox>
			</v-form>
		</v-card-text>
		<v-card-actions style="padding-left: 40px; padding-right: 40px; padding-top: 0px">
			<v-flex text-xs-center>
				<v-btn block :loading="logining" color="green" round large style="color: white" dark @click="login">
					{{$t('login')}}
				</v-btn>
				<div style="margin-top: 25px; margin-bottom: 25px;">
					<a style="padding-right: 10px;">{{$t('user.forgetPassword')}}</a>
					<a style="">{{$t('user.signup.description')}} {{$t('user.signup')}}</a>
				</div>
			</v-flex>
		</v-card-actions>
	</div>
</template>

<script>

export default {
  data: function () {
    return {
      account: '',
      password: '',
      logining: false,
      rememberMe: true,
      valid: true,

      accountError: false,
      accountErrors: [],

      passwordError: false,
      passwordErrors: [],

      usernameRules: [
        v => !!v || this.$t('user.requireUsername'),
      ],
      emailRules: [
        v => !!v || this.$t('user.requireEmail'),
        v => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || this.$t('user.illegalEmail'),
      ],
      passworldRuls: [
        v => !!v || this.$t('user.requirePassword'),
      ],
      selectedMode: 'mojang',
    }
  },
  computed: {
    loginModes() { return this.$repo.getters['user/authModes'] },
    accountRules() { return this.selectedMode === 'offline' ? this.usernameRules : this.emailRules; },
    history() { return this.$repo.getters['user/history'] },
  },
  watch: {
    selectedMode() {
      this.$refs.form.resetValidation();
    },
    account() {
      console.log(this.account);
    },
  },
  props: {
  },
  mounted() {
  },
  methods: {
    handleKey(e) {
      if (e.key === 'Enter') {
        this.login();
      }
    },
    async login() {
      this.logining = true;
      await this.$repo.dispatch('user/selectLoginMode', this.selectedMode);
      try {
        await this.$repo.dispatch('user/login', {
          account: this.account,
          password: this.password,
        })
        this.logining = false;
        this.$router.replace('/');
      } catch (e) {
        this.logining = false;
        if (e.type === 'ForbiddenOperationException' && e.message === 'Invalid credentials. Invalid username or password.') {
          const msg = this.$t('user.invalidCredentials');
          this.accountError = true;
          this.accountErrors = [msg];
          this.passwordError = true;
          this.passwordErrors = [msg];
        }
        console.error(e);
      }
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
