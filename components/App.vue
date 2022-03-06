<template>
  <main>
    <Header />
    <Search @query="handleQuery($event)" />
    <CurrencyList :filter="query" />
  </main>
</template>

<style scoped>
  main {
    width: 80%;
    margin: 0 auto;
  }
</style>

<script>
import Vue from 'vue'
import Vuesax from 'vuesax'
 
import 'vuesax/dist/vuesax.css'

Vue.use(Vuesax);

export default {
  data() {
    return {
      query: ''
    }
  },
  methods: {
    handleQuery(query) {
      this.query = query;
    }
  }
}
</script>