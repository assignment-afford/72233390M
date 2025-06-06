const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;
const BASE_URL = 'http://20.244.56.144/evaluation-service/stocks';

const API_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ5MDE2Mjk5LCJpYXQiOjE3NDkwMTU5OTksImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImM1YTI1NDRlLTFmNDUtNDY0MC1hMTA4LWY4MWQ5NDc2YTRjMyIsInN1YiI6InVkYXZhbnRwaXl1c2g4QGdtYWlsLmNvbSJ9LCJlbWFpbCI6InVkYXZhbnRwaXl1c2g4QGdtYWlsLmNvbSIsIm5hbWUiOiJwaXl1c2ggc2F0aXNoIHVkYXZhbnQiLCJyb2xsTm8iOiJ0Y29kNDciLCJhY2Nlc3NDb2RlIjoiS1JqVVVVIiwiY2xpZW50SUQiOiJjNWEyNTQ0ZS0xZjQ1LTQ2NDAtYTEwOC1mODFkOTQ3NmE0YzMiLCJjbGllbnRTZWNyZXQiOiJaVXF3QUJWdGVlWmNqR0FzIn0.0-rNWqJ9-g9xE7Gf7GFEEFVhhq-RaHIw8ouwt_BCNRc';

async function getData(ticker, minutes) {
  try {
    const response = await axios.get(`${BASE_URL}/${ticker}?minutes=${minutes}`, {
      headers: {
        Authorization: API_TOKEN
      }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.log('API error:', error.response.status, error.response.data);
    } else {
      console.log('Network or other error:', error.message);
    }
    return [];
  }
}

function calAvg(prices) {
  if (!prices.length) return 0;
  const sum = prices.reduce((acc, p) => acc + p.price, 0);
  return sum / prices.length;
}

function relateCalculation(data1, data2) {
  const n = Math.min(data1.length, data2.length);
  if (n < 2) return 0;

  const x = data1.slice(0, n).map(p => p.price);
  const y = data2.slice(0, n).map(p => p.price);

  const avgX = x.reduce((a, b) => a + b, 0) / n;
  const avgY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0, denomX = 0, denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - avgX;
    const dy = y[i] - avgY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;
  return numerator / denominator;
}

app.get('/stocks/:ticker', async (req, res) => {
  const ticker = req.params.ticker;
  const minutes = parseInt(req.query.minutes);
  const aggregation = req.query.aggregation;

  if (aggregation !== 'average') {
    return res.status(400).json({ error: 'Only average aggregation is supported' });
  }

  if (isNaN(minutes) || minutes <= 0) {
    return res.status(400).json({ error: 'Please provide a valid positive number for minutes' });
  }

  const prices = await getData(ticker, minutes);
  const averagePrice = calAvg(prices);

  res.json({
    averageStockPrice: averagePrice,
    priceHistory: prices
  });
});

app.get('/stockcorrelation', async (req, res) => {
  const { ticker1, ticker2, minutes } = req.query;

  if (!ticker1 || !ticker2) {
    return res.status(400).json({ error: 'Both ticker1 and ticker2 are required' });
  }

  const minValue = parseInt(minutes);
  if (isNaN(minValue) || minValue <= 0) {
    return res.status(400).json({ error: 'Please provide a valid positive number for minutes' });
  }

  const data1 = await getData(ticker1, minValue);
  const data2 = await getData(ticker2, minValue);

  const correlation = relateCalculation(data1, data2);
  const avg1 = calAvg(data1);
  const avg2 = calAvg(data2);

  res.json({
    correlation,
    stocks: {
      [ticker1]: {
        averagePrice: avg1,
        priceHistory: data1
      },
      [ticker2]: {
        averagePrice: avg2,
        priceHistory: data2
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
