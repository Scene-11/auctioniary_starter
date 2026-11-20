<template>
  <div class="page nf">
    <h1>404</h1>
    <p>That card couldn't be found.</p>
    <router-link to="/" class="btn">Back to auctions</router-link>
  </div>
</template>

<script>
export default {}
</script>

<style scoped>
.nf { text-align: center; padding-top: 80px; }
.nf h1 { font-size: 64px; color: var(--primary-dark); }
.nf p { color: var(--muted); font-weight: 700; margin: 6px 0 20px; }
</style>
