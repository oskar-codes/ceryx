<template>
  <div>
    <Header />
    <main>

      <div class="header">
        <vs-col type="flex" align="center" :justify="width < 750 ? 'center' : 'flex-start'">
          <img width="60" height="60" :src="metaData.image_url">
          <h2>{{ metaData.name }} [{{ metaData.symbol }}]</h2>
        </vs-col>
        <div>
          <span role="online"></span>
          <span>
            <vs-tooltip>
              USD {{ formattedPrice }}
              <template #tooltip>
                USD {{ numberWithCommas(price || metaData.latest) }}
              </template>
            </vs-tooltip>
          </span>
          <vs-tooltip>
            <span :style="{
              color: percentChange >= 0 ? 'rgb(var(--vs-success))' : 'rgb(var(--vs-danger))'
            }">({{ shortenedNumber(percentChange) }}%)</span>
            <template #tooltip>
              {{ percentChange }}%
            </template>
          </vs-tooltip>
        </div>
      </div>
      
      <div class="content" style="flex-direction: column;">

        <vs-navbar :centerCollapsed="false" v-model="chartScale">
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

        <div class="panel">
          <h3>Prediction <span v-if="predictionProgress !== 0">({{ predictionProgress.toFixed(1) }}%) ({{ remainingTime }} left)</span></h3>
          <progress max="100" :value="predictionProgress"></progress>
          <vs-row>
            <vs-col w="3" lg="3" md="6" sm="6">
              <h4>Dataset</h4>
              <vs-select state="primary" v-model="predictionConfig.dataSet" placeholder="Dataset">
                <vs-option label="Hour" value="Hour">Hour</vs-option>
                <vs-option label="Day" value="Day">Day</vs-option>
                <vs-option label="Week" value="Week">Week</vs-option>
                <vs-option label="Month" value="Month">Month</vs-option>
                <vs-option label="Year" value="Year">Year</vs-option>
                <vs-option label="All" value="All">All</vs-option>
              </vs-select>
            </vs-col>
            <vs-col w="3" lg="3" md="6" sm="6">
              <h4>Precision</h4>
              <vs-select state="primary" v-model="predictionConfig.precision" placeholder="Precision">
                <vs-option label="Low" value="low">Low (fast)</vs-option>
                <vs-option label="Medium" value="medium">Medium</vs-option>
                <vs-option label="High" value="high">High (slow)</vs-option>
              </vs-select>
            </vs-col>
            <vs-col w="3" lg="3" md="6" sm="6">
              <h4>Days predicted</h4>
              <vs-select state="primary" v-model="predictionConfig.days" placeholder="Days">
                <vs-option label="30 days" value="30">30 days</vs-option>
                <vs-option label="90 days" value="90">90 days</vs-option>
                <vs-option label="365 days" value="365">365 days</vs-option>
              </vs-select>
            </vs-col>
            <vs-col w="3" lg="3" md="6" sm="6">
              <h4>Start</h4>
              <vs-button gradient :loading="!canStartPrediction" :disabled="!canStartPrediction" primary @click="startPrediction">Start prediction</vs-button>
            </vs-col>
          </vs-row>
        </div>
        
        <div class="panel">
          <vs-row>

            <vs-col w="4" md="12" sm="12" justify="center" type="flex">
              <vs-col w="11">
                <h3>About {{ metaData.name }}</h3>
                <p class="grey justified">{{ filteredDescription }}</p>
              </vs-col>
            </vs-col>

            <vs-col w="8" md="12" sm="12" justify="center" type="flex">
              <vs-col w="11">
                <h3>Stats</h3>

                <vs-row type="flex" justify="center">

                  <vs-col w="4">
                    
                    <vs-tooltip>
                      <h4 class="grey">Market Cap</h4>
                      <template #tooltip>
                        <p>The market cap is calculated by multiplying the asset's circulating supply with its current price.</p>
                      </template>
                    </vs-tooltip>

                    <vs-tooltip>
                      <span class="grey">USD {{ shortenedNumber(metaData.market_cap) }}</span>
                      <template #tooltip>
                        USD {{ numberWithCommas(metaData.market_cap) }}
                      </template>
                    </vs-tooltip>
                  
                  </vs-col>

                  <vs-col w="4">

                    <vs-tooltip>
                      <h4 class="grey">Volume (24h)</h4>
                      <template #tooltip>
                        <p>The total dollar value of all transactions for this currency over the past 24 hours.</p>
                      </template>
                    </vs-tooltip>

                    <vs-tooltip>
                      <span class="grey">USD {{ shortenedNumber(metaData.volume_24h) }}</span>
                      <template #tooltip>
                        USD {{ numberWithCommas(metaData.volume_24h) }}
                      </template>
                    </vs-tooltip>

                  </vs-col>

                  <vs-col w="4">

                    <vs-tooltip>
                      <h4 class="grey">Circulating Supply</h4>
                      <template #tooltip>
                        <p>The number of coins or tokens that have been issued so far.</p>
                      </template>
                    </vs-tooltip>

                    <vs-tooltip>
                      <span class="grey">{{ metaData.symbol }} {{ shortenedNumber(metaData.circulating_supply) }}</span>
                      <template #tooltip>
                        {{ metaData.symbol }} {{ numberWithCommas(metaData.circulating_supply) }}
                      </template>
                    </vs-tooltip>

                  </vs-col>

                </vs-row>

                <vs-row type="flex" justify="center">

                  <vs-col w="4">
                    
                    <vs-tooltip>
                      <h4 class="grey">Price Change (1h)</h4>
                      <template #tooltip>
                        <p>The percent change in trading volume for this asset compared to 1 hour ago.</p>
                      </template>
                    </vs-tooltip>

                    <vs-tooltip>
                      <span :style="{
                        color: priceData.latestPercentChanges.hour >= 0 ? 'rgb(var(--vs-success))' : 'rgb(var(--vs-danger))'
                      }" class="grey">{{ shortenedNumber(priceData.latestPercentChanges.hour) }}%</span>
                      <template #tooltip>
                        {{ priceData.latestPercentChanges.hour }}%
                      </template>
                    </vs-tooltip>
                  
                  </vs-col>

                  <vs-col w="4">
                    
                    <vs-tooltip>
                      <h4 class="grey">Price Change (24h)</h4>
                      <template #tooltip>
                        <p>The percent change in trading volume for this asset compared to 24 hours ago.</p>
                      </template>
                    </vs-tooltip>

                    <vs-tooltip>
                      <span :style="{
                        color: priceData.latestPercentChanges.day >= 0 ? 'rgb(var(--vs-success))' : 'rgb(var(--vs-danger))'
                      }" class="grey">{{ shortenedNumber(priceData.latestPercentChanges.day) }}%</span>
                      <template #tooltip>
                        {{ priceData.latestPercentChanges.day }}%
                      </template>
                    </vs-tooltip>
                  
                  </vs-col>

                  <vs-col w="4">
                    
                    <vs-tooltip>
                      <h4 class="grey">Price Change (7d)</h4>
                      <template #tooltip>
                        <p>The percent change in trading volume for this asset compared to 7 days ago.</p>
                      </template>
                    </vs-tooltip>

                    <vs-tooltip>
                      <span :style="{
                        color: priceData.latestPercentChanges.week >= 0 ? 'rgb(var(--vs-success))' : 'rgb(var(--vs-danger))'
                      }" class="grey">{{ shortenedNumber(priceData.latestPercentChanges.week) }}%</span>
                      <template #tooltip>
                        {{ priceData.latestPercentChanges.week }}%
                      </template>
                    </vs-tooltip>
                  
                  </vs-col>

                </vs-row>

              </vs-col>
            </vs-col>

          </vs-row>
        </div>
      
      </div>
    
    </main>
  </div>
</template>

<style scoped>
main {
  width: 80%;
  margin: 0 auto;
}
.content {
  background: rgb(var(--vs-gray-3));
  padding: 20px;
  border-radius: 10px;
  display: flex;
  gap: 20px;
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
div.header > div {
  font-size: 24px;
}
div.header > div > span:first-child {
  display: block;
  width: 8px;
  height: 8px;
  background: rgb(var(--vs-success));
  border-radius: 50%;
  animation: pulse 1s infinite alternate-reverse;
}
div.about {
  flex: 1;
}
div.stats {
  flex: 2;
}
div.panel {
  background: white;
  padding: 20px;
  border-radius: 10px;
}
.vs-navbar-content {
  position: relative;
}
progress {
  width: 100%;
}
.vs-tooltip-content {
  width: fit-content;
}
@keyframes pulse {
  0% {
    opacity: 0
  }
  100% {
    opacity: 1
  }
}
@media only screen and (max-width: 750px) {
  main {
    width: 100%;
  }
  div.header img {
    margin-right: 10px;
    width: 30px;
    height: 30px;
  }
  h2 {
    font-size: 20px;
  }
  div.header > div {
    font-size: 20px;
  }
  div.header {
    width: 95%;
    margin: 10px auto;
    flex-direction: column;
  }
}
</style>

<script>

import Chart from 'chart.js/auto';
import { Tooltip } from 'chart.js';
import { Layer, Network } from 'synaptic';

export default {
  computed: {
    filteredDescription() {
      return (this.metaData.description || '').split('.').filter(e => !e.toLowerCase().includes('coinbase')).join('.');
    },
    percentChange() {
      return Number(this.priceData.latestPercentChanges[this.chartScale.toLowerCase()]);
    },
    formattedPrice() {
      return this.shortenedNumber(Number(this.price || this.metaData.latest).toFixed(4));
    },
    data() {
      return this.getData(this.chartScale);
    },
    canStartPrediction() {
      return this.predictionProgress === 0;
    },
    allTimeHigh() {
      return this.priceData.priceDataForAll.quotes.reduce((acc, v) => v > acc ? v : acc);
    },
  },
  data() {
    const width = process.browser ? window.innerWidth : 0
    return {
      price: null,
      loading: null,
      chart: null,
      predictedData: [],
      predictionProgress: 0,
      chartScale: 'All',
      startTime: null,
      remainingTime: null,
      runningTime: 0,
      width,
      timeInterval: 0,
      predictionConfig: {
        dataSet: 'All',
        precision: 'medium',
        days: 30
      }
    }
  },
  watch: {
    chartScale(val) {
      this.predictionConfig.dataSet = val;
      this.updateChart();
    }
  },
  async asyncData({ params, redirect }) {
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
  mounted() {
    setInterval(async _ => {
      const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${this.metaData.symbol}&tsyms=USD`);
      const data = await response.json();
      if (data.Response !== 'Error') {
        this.price = data.USD;
      }
    }, 1e4);

    this.$nextTick(() => {

      if (process.browser) {
        this.worker = this.$worker.createWorker();
        this.worker.addEventListener('message', this.getPredictionData);
        /* this.loading = this.$vs.loading({
          color: 'dark'
        }); */
        window.addEventListener('resize', this.onResize);
      }

      this.updateChart();
    })
  },
  methods: {
    onResize() {
      this.width = window.innerWidth;
    },
    getData(scale) {
      return [...this.priceData[`priceDataFor${scale}`].quotes].reverse();
    },
    shortenedNumber(n) {
      if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
      if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
      if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
      if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
      return n.toFixed(2);
    },
    numberWithCommas(num) {
      const parts = num.toString().split(".");
      parts[0] = parts[0].replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
      return parts.join('.');
    },
    formatTimestamp(time) {
        if (this.chartScale === 'Day' ||
            this.chartScale === 'Hour') {
              return new Date(time).toLocaleString();
            }
        return new Date(time).toLocaleDateString()
    },
    updateChart() {
      Tooltip.positioners.customPosition = function(elements, eventPosition) {
        return {
          x: eventPosition.x,
          y: this.dataPoints ? this.dataPoints[0].element.y : 0
        }
      }

      const ctx = this.$refs.chart.getContext('2d');
      
      if (!this.chart) {
        this.chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: [...this.data, ...this.predictedData].map(e => this.formatTimestamp(e.timestamp)),
            datasets: [{
              label: this.metaData.name,
              data: [...this.data, ...this.predictedData].map(e => Number(e.price)),
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
                    return 'USD ' + context.formattedValue;
                  }
                }
              }
            }
          }
        });
      } else {
        this.chart.data.labels = [...this.data, ...this.predictedData].map(e => {
          if (this.chartScale === 'Day' ||
              this.chartScale === 'Hour') {
            return new Date(e.timestamp).toLocaleString();
          }
          return new Date(e.timestamp).toLocaleDateString()
        });
        this.chart.data.datasets[0].data = [...this.data, ...this.predictedData].map(e => Number(e.price));
        this.chart.update();
      }
    },
    getPredictionData(message) {
      
      if (message.data.type === 'data-response') {
        console.log('[CLIENT] Received: ', message.data);
        if (this.loading) this.loading.close();
        this.predictedData = message.data.predictedPrices;
        
        this.predictionProgress = 0;
        this.predictionTimestamps = [];
        clearInterval(this.timeInterval);

        this.$nextTick(_ => {
          this.updateChart();
        });
      }

      if (message.data.type === 'progress') {
        const speed = message.data.percent / (this.runningTime * 1e3);
        const totalTime = 100 / speed;

        const remainingTime = Math.ceil((totalTime - this.runningTime * 1e3) * 1e-3);
        this.remainingTime = 
          `${
            String(Math.floor(remainingTime/3600)).padStart(2, '0')
          }:${
            String(Math.floor(remainingTime/60)%60).padStart(2, '0')
          }:${
            String(remainingTime%60).padStart(2, '0')}`

        this.predictionProgress = message.data.percent;
      }
    },
    startPrediction() {
      if (this.canStartPrediction) {
        this.worker.postMessage({
          type: 'data-request',
          prices: this.getData(this.predictionConfig.dataSet),
          precision: this.predictionConfig.precision,
          days: Number(this.predictionConfig.days)
        });
        this.timeInterval = setInterval(e => {
          this.runningTime++;
        }, 1e3);
      }
    },
    toBinaryArray(n) {
      const arr = n.toString(2).padStart(20, '0').split('').map(Number);
      arr.length = 20;
      return arr;
    }
  }
}
</script>