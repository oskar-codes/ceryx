<template>
  <div class="wrapper">
    <vs-table>

      <template #thead>
        <vs-tr>
          <vs-th>Currency</vs-th>
          <vs-th>Price</vs-th>
          <vs-th>Change</vs-th>
        </vs-tr>
      </template>
      <template #tbody>
        <vs-tr v-for="currency, i in $vs.getSearch(currencies, $props.filter)" :key="i" @click="navigateTo(currency);">

          <vs-td>
            <vs-row type="flex" align="center">
              <vs-col style="width: 30px;" type="flex" align="center">
                <img :src="currency.image_url">
              </vs-col>
              <vs-col style="width: fit-content" type="flex" align="center">
                <span style="margin-left: 10px;">
                  {{ currency.name }} <span class="grey">[{{ currency.symbol }}]</span>
                </span>
              </vs-col>
            </vs-row>
          </vs-td>
          
          <vs-td>USD {{ Number(currency.latest).toFixed(2) }}</vs-td>
          <vs-td :style="{
            color: Number(currency.percent_change) >= 0 ? 'rgb(var(--vs-success))' : 'rgb(var(--vs-danger))'
          }">{{ Math.round(Number(currency.percent_change) * 1000) / 1000 }}%</vs-td>
        </vs-tr>
      </template>
      <template #notFound>
        <span v-if="!loading">
          No cryptocurrency match the entered query.
        </span>
        <span v-else>

        </span>
      </template>

    </vs-table>
  </div>
</template>

<style scoped>
  table {
    white-space: nowrap;
  }

  img {
    max-width: 30px;
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
        this.loading = null;
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