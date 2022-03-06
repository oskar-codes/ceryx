import { Layer, Network } from 'synaptic';

self.addEventListener('message', message => {
  console.log('[WORKER] Received: ', message.data.type);
  if (message.data.type === 'data-request') {
    const predicted = makePrediction(message.data.prices, message.data.precision, message.data.days);
    postMessage({
      type: 'data-response',
      predictedPrices: predicted
    })
  }
});

function makePrediction(data, precision, days) {
  console.log('Initializing network...');

  const index = ['low', 'medium', 'high'].indexOf(precision);

  const inputLayer = new Layer(20);
  const hiddenLayer = new Layer([4,10,20][index]);
  const outputLayer = new Layer(20);

  inputLayer.project(hiddenLayer);
  hiddenLayer.project(outputLayer);

  const network = new Network({
    input: inputLayer,
    hidden: [hiddenLayer],
    output: outputLayer
  });

  console.log('Starting learning process...');

  const learningRate = [1, .3, .1][index];
  const learningAmount = [2e3, 2e4, 2e5][index];
  for (let i = 0; i < learningAmount; i++) {
    if (i % 10 === 0) {
      postMessage({
        type: 'progress',
        percent: i/learningAmount*100,
        total: learningAmount
      });
    }
    for (const dataPoint of data) {
      const inputArray = toBinaryArray(Math.floor(new Date(dataPoint.timestamp).getTime() / 1000));
      const outputArray = toBinaryArray(Math.floor(Number(dataPoint.price)));
      
      network.activate(inputArray);
      network.propagate(learningRate, outputArray);
    }
  }

  console.log('Predicting upcoming prices...');

  const predictedData = [];
  for (let i = 0; i < days; i++) {
    const now = new Date();
    const day = new Date(now.getTime() + i * 86400000);
    const input = toBinaryArray(Math.floor(new Date(day.getTime()).getTime() / 1000));
    predictedData.push(
      {
        price: parseInt(
          network.activate(input)
        .map(Math.round).join(''),2),
        timestamp: day
      }
    );
  }
  return predictedData;
}

function toBinaryArray(n) {
  const arr = n.toString(2).padStart(20, '0').split('').map(Number);
  arr.length = 20;
  return arr;
}