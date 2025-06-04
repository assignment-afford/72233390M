const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const TIMEOUT = 500;
const WINDOW_SIZE = 10;

let windowData = [];

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ5MDE2Mjk5LCJpYXQiOjE3NDkwMTU5OTksImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImM1YTI1NDRlLTFmNDUtNDY0MC1hMTA4LWY4MWQ5NDc2YTRjMyIsInN1YiI6InVkYXZhbnRwaXl1c2g4QGdtYWlsLmNvbSJ9LCJlbWFpbCI6InVkYXZhbnRwaXl1c2g4QGdtYWlsLmNvbSIsIm5hbWUiOiJwaXl1c2ggc2F0aXNoIHVkYXZhbnQiLCJyb2xsTm8iOiJ0Y29kNDciLCJhY2Nlc3NDb2RlIjoiS1JqVVVVIiwiY2xpZW50SUQiOiJjNWEyNTQ0ZS0xZjQ1LTQ2NDAtYTEwOC1mODFkOTQ3NmE0YzMiLCJjbGllbnRTZWNyZXQiOiJaVXF3QUJWdGVlWmNqR0FzIn0.0-rNWqJ9-g9xE7Gf7GFEEFVhhq-RaHIw8ouwt_BCNRc";

const urls = {
  p: "http://20.244.56.144/evaluation-service/primes",
  f: "http://20.244.56.144/evaluation-service/fibo",
  e: "http://20.244.56.144/evaluation-service/even",
  r: "http://20.244.56.144/evaluation-service/rand"
};

const fetchNumbers = async (type) => {
  try {
    const res = await axios.get(urls[type], {
      timeout: TIMEOUT,
      headers: {
        Authorization: TOKEN,
        'Content-Type': 'application/json'
      }
    });
    return Array.isArray(res.data.numbers) ? res.data.numbers : [];
  } catch (err) {
    console.error(`Error fetching ${type}:`, err.message);
    return [];
  }
};

const updateWindow = (nums) => {
  nums.forEach(num => {
    if (!windowData.includes(num)) {
      if (windowData.length >= WINDOW_SIZE) windowData.shift();
      windowData.push(num);
    }
  });
};

const getAverage = () => {
  if (!windowData.length) return 0;
  const sum = windowData.reduce((a, b) => a + b, 0);
  return Number((sum / windowData.length).toFixed(2));
};

app.get('/numbers/:type', async (req, res) => {
  const type = req.params.type;
  if (!urls[type]) return res.status(400).json({ error: 'Invalid number type' });

  const prev = [...windowData];
  const newNums = await fetchNumbers(type);
  updateWindow(newNums);
  const avg = getAverage();

  res.json({
    windowPrevState: prev,
    windowCurrState: [...windowData],
    numbers: newNums,
    avg
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/numbers/e`);
});
