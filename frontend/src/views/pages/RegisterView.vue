<template>
  <div class="page narrow">
    <div class="auth-panel">
      <h1>Create Account</h1>
      <p class="auth-sub">Join Auctionary and start buying and selling trading cards</p>

      <!-- novalidate: use the English validation messages defined below -->
      <form novalidate @submit.prevent="handleSubmit">
        <div class="field">
          <label for="first_name">First name</label>
          <input id="first_name" name="first_name" v-model="first_name" />
          <div class="err" v-show="submitted && !first_name.trim()">First name is required</div>
        </div>

        <div class="field">
          <label for="last_name">Last name</label>
          <input id="last_name" name="last_name" v-model="last_name" />
          <div class="err" v-show="submitted && !last_name.trim()">Last name is required</div>
        </div>

        <div class="field">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" v-model="email" />
          <div class="err" v-show="submitted && !email.trim()">Email is required</div>
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" v-model="password" />
          <div class="err" v-show="submitted && !password">Password is required</div>
        </div>

        <button class="btn" type="submit">Register</button>

        <div class="err" v-if="error">{{ error }}</div>
      </form>

      <p class="switch">
        Already a member?
        <router-link to="/login">Sign in</router-link>
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
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      submitted: false,
      error: ''
    }
  },
  methods: {
    handleSubmit() {
      this.submitted = true
      this.error = ''
      const { first_name, last_name, email, password } = this

      if (!(first_name.trim() && last_name.trim() && email.trim() && password)) {
        return
      }
      if (!EmailValidator.validate(email)) {
        this.error = 'Email must be a valid email address.'
        return
      }
      if (password.length < 8) {
        this.error = 'Password must be at least 8 characters.'
        return
      }
      const password_pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/
      if (!password_pattern.test(password)) {
        this.error = 'Password needs upper, lower, a number and a special character.'
        return
      }

      userService.register(first_name.trim(), last_name.trim(), email.trim(), password).then(() => {
        this.$router.push({ name: 'login', query: { registered: '1' } })
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
.switch { margin-top: 18px; color: var(--muted); font-weight: 700; font-size: 14px; text-align: center; }
button[type='submit'] { width: 100%; margin-top: 6px; }
</style>
