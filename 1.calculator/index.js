const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const TIMEOUT = 500;
const WINDOW_SIZE = 10;

let storedNumbers = [];

let token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ5MDE2Mjk5LCJpYXQiOjE3NDkwMTU5OTksImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImM1YTI1NDRlLTFmNDUtNDY0MC1hMTA4LWY4MWQ5NDc2YTRjMyIsInN1YiI6InVkYXZhbnRwaXl1c2g4QGdtYWlsLmNvbSJ9LCJlbWFpbCI6InVkYXZhbnRwaXl1c2g4QGdtYWlsLmNvbSIsIm5hbWUiOiJwaXl1c2ggc2F0aXNoIHVkYXZhbnQiLCJyb2xsTm8iOiJ0Y29kNDciLCJhY2Nlc3NDb2RlIjoiS1JqVVVVIiwiY2xpZW50SUQiOiJjNWEyNTQ0ZS0xZjQ1LTQ2NDAtYTEwOC1mODFkOTQ3NmE0YzMiLCJjbGllbnRTZWNyZXQiOiJaVXF3QUJWdGVlWmNqR0FzIn0.0-rNWqJ9-g9xE7Gf7GFEEFVhhq-RaHIw8ouwt_BCNRc";

const apiUrls = {
  p: "http://20.244.56.144/evaluation-service/primes",
  f: "http://20.244.56.144/evaluation-service/fibo",
  e: "http://20.244.56.144/evaluation-service/even",
  r: "http://20.244.56.144/evaluation-service/rand"
};

async function getNum(type) {
  try {
    const response = await axios.get(apiUrls[type], {
      timeout: TIMEOUT,
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Response for type '${type}':`, JSON.stringify(response.data));
    if (Array.isArray(response.data.numbers)) {
      return response.data.numbers;
    }
    return [];
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('Unauthorized or token expired - please update the token.');
      } else {
        console.error(`API error (status ${error.response.status}):`, error.response.data);
      }
    } else if (error.request) {
      console.error('No response received from API:', error.message);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return [];
  }
}

function addToWindow(newNums) {
  newNums.forEach(num => {
    if (!storedNumbers.includes(num)) {
      if (storedNumbers.length >= WINDOW_SIZE) {
        storedNumbers.shift();
      }
      storedNumbers.push(num);
    }
  });
}

function calAvg() {
  if (storedNumbers.length === 0) return 0;
  const total = storedNumbers.reduce((sum, val) => sum + val, 0);
  return Number((total / storedNumbers.length).toFixed(2));
}

app.get('/numbers/:type', async (req, res) => {
  const type = req.params.type;
  if (!apiUrls[type]) {
    return res.status(400).json({ error: 'Invalid number type provided' });
  }

  const previousWindow = [...storedNumbers];
  const newNumbers = await getNum(type);
  addToWindow(newNumbers);
  const average = calAvg();

  res.json({
    windowPrevState: previousWindow,
    windowCurrState: [...storedNumbers],
    numbers: newNumbers,
    avg: average
  });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/numbers/e`);
});
