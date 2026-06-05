const express = require('express');
const app = express();
app.use(express.static('dist'));
app.listen(4173, () => console.log('Server on http://localhost:4173'));
