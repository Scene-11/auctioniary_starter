<template>
  <div class="questions">
    <h3>Questions &amp; Answers</h3>

    <p v-if="questions.length === 0" class="empty">No questions yet.</p>

    <ul v-else>
      <li v-for="q in questions" :key="q.question_id" class="q">
        <p class="q-text">Q: {{ q.question_text }}</p>
        <p v-if="q.answer_text" class="a-text">A: {{ q.answer_text }}</p>
        <form v-else-if="isCreator" class="answer-form" @submit.prevent="submitAnswer(q)">
          <input
            type="text"
            v-model="answers[q.question_id]"
            placeholder="Write an answer…"
          />
          <button class="btn accent" type="submit">Answer</button>
        </form>
        <p v-else class="pending">
          Not answered yet.
          <span v-if="isLoggedIn" class="pending-hint">Only the seller can answer this question.</span>
        </p>
        <div class="err" v-if="answerErrors[q.question_id]">{{ answerErrors[q.question_id] }}</div>
      </li>
    </ul>

    <form v-if="isLoggedIn && !isCreator" class="ask-form" @submit.prevent="submitQuestion">
      <div class="field">
        <label for="question_text">Ask the seller a question</label>
        <input id="question_text" type="text" v-model="newQuestion" placeholder="e.g. Any scratches on the foil? Is grading available?" />
      </div>
      <button class="btn blue" type="submit">Ask Question</button>
      <div class="err" v-if="askError">{{ askError }}</div>
    </form>

    <p v-if="!isLoggedIn" class="signin-hint">
      <router-link to="/login">Sign in</router-link> to ask the seller a question.
    </p>
  </div>
</template>

<script>
import coreService from '../../services/core.service.js'

export default {
  props: {
    questions: {
      type: Array,
      required: true
    },
    itemId: {
      type: [Number, String],
      required: true
    },
    isLoggedIn: {
      type: Boolean,
      default: false
    },
    isCreator: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      newQuestion: '',
      askError: '',
      answers: {},
      answerErrors: {}
    }
  },
  methods: {
    submitQuestion() {
      this.askError = ''
      const text = this.newQuestion.trim()
      if (!text) {
        this.askError = 'Please enter a question.'
        return
      }
      coreService.askQuestion(this.itemId, text).then(() => {
        this.newQuestion = ''
        this.$emit('refresh')
      }).catch((err) => {
        this.askError = err
      })
    },
    submitAnswer(q) {
      this.answerErrors[q.question_id] = ''
      const text = (this.answers[q.question_id] || '').trim()
      if (!text) {
        this.answerErrors[q.question_id] = 'Please enter an answer.'
        return
      }
      coreService.answerQuestion(q.question_id, text).then(() => {
        this.answers[q.question_id] = ''
        this.$emit('refresh')
      }).catch((err) => {
        this.answerErrors[q.question_id] = err
      })
    }
  }
}
</script>

<style scoped>
.questions {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 18px;
  padding: 16px 18px;
  margin-top: 20px;
}
.questions h3 { margin-top: 0; }
.questions ul { list-style: none; margin: 0 0 16px; padding: 0; }
.q { padding: 10px 0; border-bottom: 1px solid var(--border); }
.q:last-child { border-bottom: none; }
.q-text { margin: 0 0 4px; font-weight: 700; }
.a-text { margin: 0; color: var(--ok); font-weight: 700; }
.pending { margin: 0; color: var(--muted); font-size: 13px; }
.pending-hint { display: block; margin-top: 2px; font-size: 12.5px; font-weight: 600; }
.signin-hint { margin: 12px 0 0; color: var(--muted); font-size: 13px; font-weight: 700; }
.answer-form { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
.answer-form input {
  flex: 1;
  min-width: 160px;
  padding: 8px 14px;
  border: 2px solid var(--border);
  border-radius: 999px;
  background: var(--bg);
}
.answer-form input:focus { outline: none; border-color: var(--blue); }
.ask-form { margin-top: 10px; }
.empty { color: var(--muted); font-weight: 700; }
</style>
