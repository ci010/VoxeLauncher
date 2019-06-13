<template>
	<div style="margin: 0 40px; ">
		<v-flex text-xs-center pt-4>
			<v-img :src="logo"></v-img>
		</v-flex>
		<v-card-text style="padding-left: 50px; padding-right: 50px; padding-bottom: 0px;">
			<v-form ref="form" v-model="valid">
				<v-select prepend-icon="router" :items="loginModes" v-model="selectedMode" :label="$t('login.mode')"
				  flat dark></v-select>

				<v-combobox dark prepend-icon="person" :label="$t(`login.${selectedMode}.account`)" :rules="accountRules"
				  :items="history" v-model="account" :error="accountError" :error-messages="accountErrors"
				  @input="accountError=false" required>
				</v-combobox>

				<!-- <v-text-field dark prepend-icon="person" :label="$t(`${selectedMode}.account`)" :rules="accountRules"
				  v-model="account" :error="accountError" :error-messages="accountErrors" required @keypress="handleKey"></v-text-field> -->
				<v-text-field dark prepend-icon="lock" :label="$t(`login.${selectedMode}.password`)" type="password"
				  :rules="passworldRuls" :disabled="selectedMode==='offline'" v-model="password" :error="passwordError"
				  @input="passwordError=false" :error-messages="passwordErrors" required @keypress="handleKey"></v-text-field>
				<v-checkbox v-model="rememberMe" :label="$t('login.rememberMe')" style="padding-top: 5px;" dark>
				</v-checkbox>
			</v-form>
		</v-card-text>
		<v-card-actions style="padding-left: 40px; padding-right: 40px; padding-top: 0px;">
			<v-flex text-xs-center style="z-index: 1;">
				<v-btn block :loading="logining" color="green" round large style="color: white" dark @click="login">
					{{$t('login')}}
				</v-btn>
				<div style="margin-top: 25px; margin-bottom: 25px;">
					<a style="padding-right: 10px; z-index: 20" href="https://my.minecraft.net/en-us/password/forgot/">{{$t('login.forgetPassword')}}</a>
					<a style="z-index: 20" href="https://my.minecraft.net/en-us/store/minecraft/#register">{{$t('login.signup.description')}}
						{{$t('login.signup')}}</a>
				</div>
			</v-flex>
		</v-card-actions>
	</div>
</template>

<script>
import logo from '@/assets/minecraft.logo.png'

export default {
  data: function () {
    return {
      logo,
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
        v => !!v || this.$t('login.requireUsername'),
      ],
      emailRules: [
        v => !!v || this.$t('login.requireEmail'),
        v => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || this.$t('login.illegalEmail'),
      ],
      passworldRuls: [
        v => !!v || this.$t('login.requirePassword'),
      ],
      selectedMode: this.$repo.state.user.authService,
    }
  },
  computed: {
    loginModes() { return this.$repo.getters['authServices'].map(m => ({ text: this.$t(`login.${m}.name`), value: m })) },
    accountRules() { return this.selectedMode === 'offline' ? this.usernameRules : this.emailRules; },
    history() { return this.$repo.state.user.loginHistory[this.$repo.state.user.authService] },
  },
  watch: {
    selectedMode() {
      this.$refs.form.resetValidation();
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
      await this.$nextTick(); // wait a tick to make sure this.account updated. 
      await this.$repo.dispatch('selectLoginMode', this.selectedMode);
      try {
        await this.$repo.dispatch('login', {
          account: this.account,
          password: this.password,
        })
        this.logining = false;
        this.$router.replace('/');
      } catch (e) {
        this.logining = false;
        if (e.type === 'ForbiddenOperationException' && e.message === 'Invalid credentials. Invalid username or password.') {
          const msg = this.$t('login.invalidCredentials');
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
