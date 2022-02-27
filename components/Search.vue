<template>
  <div>
    <div class="center content-inputs">
        <vs-input 
          v-model="query"
          placeholder="Filter"
          border />
    </div>

    <div v-if="query !== ''">

    </div>

  </div>
</template>

<style>
div.center.content-inputs label {
  font-family: Shippori;
}
div.center.content-inputs input {
  width: 100%;
}
</style>

<script>
export default {
  data() {
    return {
      query: ''
    }
  },
  watch: {
    query(val) {
      this.$emit('query', this.query)
    }
  }
}
</script>