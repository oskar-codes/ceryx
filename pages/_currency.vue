<template>
  <div>
    <h1 class="center">CERYX</h1>
    <p class="center">A.I. powered crypto value predictions.</p>
    <main>

      <div class="header">
        <img width="60" height="60" :src="metaData.image_url">
        <h2>{{ metaData.name }} [{{ metaData.symbol }}]</h2>
        <div>
          <span></span>
          <span>
            USD {{ formattedPrice }}
          </span>
          <span :style="{
            color: percentChange >= 0 ? 'rgb(var(--vs-success))' : 'rgb(var(--vs-danger))'
          }">({{ Math.round(percentChange * 1000) / 1000 }}%)</span>
        </div>
      </div>
      
      <div class="section" style="flex-direction: column;">
        <vs-navbar center-collapsed v-model="chartScale">
          <vs-navbar-item :active="chartScale === 'Hour'" id="Hour">
            1H
          </vs-navbar-item>
          <vs-navbar-item :active="chartScale === 'Day'" id="Day">
            1D
          </vs-navbar-item>
          <vs-navbar-item :active="chartScale === 'Week'" id="Week">
            1W
          </vs-navbar-item>
          <vs-navbar-item :active="chartScale === 'Month'" id="Month">
            1M
          </vs-navbar-item>
          <vs-navbar-item :active="chartScale === 'Year'" id="Year">
            1Y
          </vs-navbar-item>
          <vs-navbar-item :active="chartScale === 'All'" id="All">
            ALL
          </vs-navbar-item>
        </vs-navbar>
        <canvas ref="chart"></canvas>
      </div>

      <div class="section">

        <div class="about">
          <h3>About {{ metaData.name }}</h3>
          <p class="grey justified">{{ filteredDescription }}</p>
        </div>

        <div class="stats">
          <h3>Stats</h3>
          <h4 class="grey">Market Cap</h4>
          <p class="grey">{{ metaData.market_cap }}</p>
        </div>

      </div>

      <div>
      </div>
    
    </main>
  </div>
</template>

<style scoped>
main {
  width: 80%;
  margin: 0 auto;
}
.section {
  background: rgb(var(--vs-gray-3));
  padding: 20px;
  border-radius: 5px;
}
h2 {
  font-size: 30px;
}
h2 img {
  max-height: 60px;
}
h4.grey {
  margin-bottom: 3px;
}
p.grey {
  margin-top: 3px;
}
div.header {
  display: flex;
  align-items: center;
  flex-direction: row;
}
div.header img {
  margin-right: 10px;
}
div.header > div {
  display: flex;
  justify-content: right;
  align-items: center;
  flex: 1;
  gap: 10px;
}
div.header > div > span:not(:first-child) {
  font-size: 24px;
}
div.header > div > span:first-child {
  display: block;
  width: 8px;
  height: 8px;
  background: rgb(var(--vs-success));
  border-radius: 50%;
  animation: pulse 2s infinite alternate-reverse;
}
div.section {
  display: flex;
  gap: 20px;
}
div.about {
  flex: 1;
}
div.stats {
  flex: 2;
}
.vs-navbar-content {
  position: relative;
}
@keyframes pulse {
  0% {
    opacity: 0
  }
  100% {
    opacity: 1
  }
}
</style>

<script>

import Chart from 'chart.js/auto';
import { Tooltip } from 'chart.js';

export default {
  computed: {
    filteredDescription() {
      return (this.metaData.description || '').split('.').filter(e => !e.toLowerCase().includes('coinbase')).join('.');
    },
    percentChange() {
      return Number(this.priceData.latestPercentChanges[this.chartScale.toLowerCase()]);
    },
    formattedPrice() {
      return Number(this.price || this.metaData.latest).toFixed(4);
    }
  },
  data() {
    return {
      price: null,
      loading: null,
      chart: null,
      chartScale: 'All'
    }
  },
  watch: {
    chartScale() {
      this.updateChart();
    }
  },
  async asyncData({ params, redirect, app }) {
    if (process.server) {
      const url = 'https://www.coinbase.com/graphql/query?operationName=useGetPricesForAssetPageQuery&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%2259282a0565bfbdc0477f69ad3ae4b687c93d75c808445386bfbfa70be7b4a976%22%7D%7D&variables=%7B%22skip%22%3Afalse%2C%22uuid%22%3A%22' + params.currency + '%22%2C%22currency%22%3A%22USD%22%7D';
      const response = await fetch(url, { mode: 'no-cors' });
      const data = await response.json();

      if (!data.errors && data.data && data.data.assetByUuid) {
        const metaData = await (async id => {
          const response = await fetch('https://www.coinbase.com/api/v2/assets/search?base=USD&country=US&filter=all&include_prices=true&limit=100&order=asc&page=1&query=&resolution=day&sort=rank');
          const currencies = (await response.json()).data;
          
          const match = currencies.find(e => e.id === id);
          if (!match) {
            redirect('/');
            return;
          }
          return match;

        })(data.data.assetByUuid.uuid);


        const obj = {
          priceData: data.data.assetByUuid,
          metaData,
          price: null
        }
        return obj;
      } else {
        redirect('/');
      }
    } else if (process.browser) {
      window.location.reload();
    }
  },
  beforeMount() {
    this.loading = this.$vs.loading({
      color: 'dark'
    });
  },
  mounted() {
    setInterval(async _ => {
      const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${this.metaData.symbol}&tsyms=USD`);
      const data = await response.json();
      if (data.Response !== 'Error') {
        this.price = data.USD;
      }
    }, 1e4);
    if (this.loading) this.loading.close();

    this.updateChart();
  },
  methods: {
    updateChart() {

      Tooltip.positioners.customPosition = function(elements, eventPosition) {
        
        return {
          x: eventPosition.x,
          y: this.dataPoints ? this.dataPoints[0].element.y : 0
        }
      }

      const ctx = this.$refs.chart.getContext('2d');
      const data = [...this.priceData[`priceDataFor${this.chartScale}`].quotes].reverse();
      
      if (!this.chart) {
        this.chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.map(e => {
              if (this.chartScale === 'Day' ||
                  this.chartScale === 'Hour') {
                    return new Date(e.timestamp).toLocaleString();
                  }
              return new Date(e.timestamp).toLocaleDateString()
            }),
            datasets: [{
              label: this.metaData.name,
              data: data.map(e => Number(e.price)),
              pointBackgroundColor: 'rgba(0,0,0,0)',
              pointBorderWidth: 0,
              borderColor: this.metaData.color,
              tension: 0
            }]
          },
          options: {
            plugins: {
              tooltip: {
                intersect: false,
                callbacks: {
                  label(context) {
                    return 'USD ' + context.formattedValue
                  }
                }
              }
            }
          }
        });
      } else {
        this.chart.data.labels = data.map(e => {
          if (this.chartScale === 'Day' ||
              this.chartScale === 'Hour') {
            return new Date(e.timestamp).toLocaleString();
          }
          return new Date(e.timestamp).toLocaleDateString()
        });
        this.chart.data.datasets[0].data = data.map(e => Number(e.price));
        this.chart.update();
      }
    }
  }
}
</script>