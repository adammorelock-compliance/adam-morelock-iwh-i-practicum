require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Token and object type come from your .env file (never commit .env).
const PRIVATE_APP_ACCESS = process.env.PRIVATE_APP_ACCESS;
const OBJECT_TYPE = process.env.CUSTOM_OBJECT_TYPE_ID; // e.g. 2-12345678

// The three custom properties on your custom object.
// "name" must match the internal name of each property in HubSpot.
const PROPERTIES = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'species', label: 'Species', type: 'text' },
  { name: 'age', label: 'Age', type: 'number' }
];

const hubspot = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
    'Content-Type': 'application/json'
  }
});

// ROUTE 1 - Homepage: GET all custom object records and show them in a table
app.get('/', async (req, res) => {
  try {
    const response = await hubspot.get(`/crm/v3/objects/${OBJECT_TYPE}`, {
      params: {
        properties: PROPERTIES.map((p) => p.name).join(','),
        limit: 100
      }
    });

    res.render('homepage', {
      title: 'Custom Object Records | Integrating With HubSpot I Practicum',
      properties: PROPERTIES,
      records: response.data.results
    });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).send('Could not load records from HubSpot. Check the terminal for details.');
  }
});

// ROUTE 2 - Render the form for creating a new record
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
    properties: PROPERTIES
  });
});

// ROUTE 3 - POST the form data to HubSpot to create a new record, then go home
app.post('/update-cobj', async (req, res) => {
  const properties = {};
  PROPERTIES.forEach((p) => {
    properties[p.name] = req.body[p.name];
  });

  try {
    await hubspot.post(`/crm/v3/objects/${OBJECT_TYPE}`, { properties });
    res.redirect('/');
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).send('Could not create the record in HubSpot. Check the terminal for details.');
  }
});

app.listen(3000, () => console.log('Listening on http://localhost:3000'));
