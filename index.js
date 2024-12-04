const express = require('express');
const cors = require('cors');
const path = require('path');
const { handleAnalyticsRequest } = require('./controllers/analyticsController');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/getCount', handleAnalyticsRequest);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});