<template>
  <div class="wrapper">
    <vs-table>

      <template #thead>
        <vs-tr>
          <vs-th></vs-th>
          <vs-th>Name</vs-th>
          <vs-th>Price</vs-th>
          <vs-th>Change</vs-th>
        </vs-tr>
      </template>
      <template #tbody>
        <vs-tr v-for="currency, i in filteredCurrencies" :key="i" @click="navigateTo(currency);">
          
          <vs-td>
             <vs-avatar circle size="30">
              <img :src="currency.image_url">
            </vs-avatar>
          </vs-td>

          <vs-td>
            {{ currency.name }} <span class="grey">[{{ currency.symbol }}]</span>
          </vs-td>
          
          <vs-td>USD {{ Number(currency.latest).toFixed(2) }}</vs-td>
          <vs-td :style="{
            color: Number(currency.percent_change) >= 0 ? 'rgb(var(--vs-success))' : 'rgb(var(--vs-danger))'
          }">{{ Math.round(Number(currency.percent_change) * 1000) / 1000 }}%</vs-td>
        </vs-tr>
      </template>
      <template #notFound>
        No cryptocurrency match the entered query.
      </template>

    </vs-table>
  </div>
</template>

<style scoped>
  table tbody tr td:first-child {
    max-width: 30px;
  }

  table > tbody.vs-table_not-found > tr > td > button {
    width: 100px;
    height: 30px;
    /* background: rgb(var(--vs-background)); */
  }

  tr {
    cursor: pointer;
  }

</style>

<script>
export default {
  props: ['filter'],
  data() {
    return {
      currencies: [],
      loading: null
    }
  },
  watch: {
    currencies(val) {
      if (val.length === 0) {
        this.loading = this.$vs.loading({
          color: 'dark'
        });
      } else if (this.loading) {
        this.loading.close();
      }
    }
  },
  methods: {
    navigateTo(currency) {
      if (process.browser) {
        this.$vs.loading({
          color: 'dark'
        });
        window.location.href = `/${currency.id}`;
      }
    }
  },
  async fetch() {
    this.currencies = [];
    const response = await fetch('https://www.coinbase.com/api/v2/assets/search?base=USD&country=US&filter=all&include_prices=true&limit=100&order=asc&page=1&query=&resolution=day&sort=rank');
    const currencies = (await response.json()).data;
    this.currencies = currencies;
  },
  computed: {
    filteredCurrencies() {
      return this.currencies.filter(e => 
        e.name.toLowerCase().includes(this.$props.filter.toLowerCase()) ||
        e.symbol.toLowerCase().includes(this.$props.filter.toLowerCase())
      )
    }
  }
}
</script>