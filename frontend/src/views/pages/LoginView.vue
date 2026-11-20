<template>
  <div class="page narrow">
    <div class="auth-panel">
      <h1>Welcome back</h1>
      <p class="auth-sub">Sign in to Auctionary to keep bidding on the cards you are watching</p>

      <div class="ok-msg register-msg" v-if="justRegistered">
        Account created! Sign in below.
      </div>

      <!-- novalidate: keep the browser's localised messages out of the UI and
           let the English validation below be the only feedback the user sees -->
      <form novalidate @submit.prevent="handleSubmit">
        <div class="field">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" v-model="email" />
          <div class="err" v-show="submitted && !email">Email is required</div>
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" v-model="password" />
          <div class="err" v-show="submitted && !password">Password is required</div>
        </div>

        <button class="btn" type="submit">Sign In</button>

        <div class="err" v-if="error">{{ error }}</div>
      </form>

      <p class="switch">
        No account yet?
        <router-link to="/register">Register here</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import EmailValidator from 'email-validator'
import userService from '../../services/user.service.js'

export default {
  data() {
    return {
      email: '',
      password: '',
      submitted: false,
      error: '',
      justRegistered: this.$route.query.registered === '1'
    }
  },
  methods: {
    handleSubmit() {
      this.submitted = true
      this.error = ''
      const { email, password } = this

      if (!(email && password)) {
        return
      }
      if (!EmailValidator.validate(email)) {
        this.error = 'Email must be a valid email address.'
        return
      }

      userService.login(email, password).then(() => {
        this.$router.push('/')
      }).catch((err) => {
        this.error = err
      })
    }
  }
}
</script>

<style scoped>
.narrow { max-width: 440px; }
.auth-panel {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 24px;
  padding: 30px 28px;
  box-shadow: 0 12px 30px rgba(224, 43, 126, .12);
}
.auth-sub { color: var(--muted); font-size: 14px; margin: 4px 0 18px; font-weight: 700; }
.register-msg { margin-bottom: 14px; background: #e2faf2; border-radius: 12px; padding: 8px 14px; }
.switch { margin-top: 18px; color: var(--muted); font-weight: 700; font-size: 14px; text-align: center; }
button[type='submit'] { width: 100%; margin-top: 6px; }
</style>
