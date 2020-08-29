const express = require('express');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const request = require('request');
const cors = require('cors');
const WEATHER_URL = 'https://www.timeanddate.com/weather/';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

const webScrape = (req, res) => {
  const location = req.params.location;
  const splittedLocationArray = location.split('+');
  const cityName = splittedLocationArray[0];
  const country = splittedLocationArray[1];
  const url = `${WEATHER_URL}/${country}/${cityName}`;
  request(url, (error, response, html) => {
    if (!error) {
      let weatherDetails = {};
      weatherDetails.city = cityName;
      weatherDetails.country = country;
      const $ = cheerio.load(html);
      const title = $('title').text();
      if (title.includes('Unknown address')) {
        res.status(400).json('Location not found, try valid input!');
        return;
      }
      let imageSrc = $('#cur-weather').attr('src');
      weatherDetails.image = imageSrc;
      $('#qlook').each((i, el) => {
        let temperature = $(el).find('div.h2').text();
        let description = $(el).find('p').first().text();
        let wind = $(el).find('br.clear').next().text().split('Wind:')[1];
        weatherDetails.temperature = temperature;
        weatherDetails.description = description;
        weatherDetails.wind = wind;
      });
      $('.bk-focus__info').each((i, el) => {
        let humidity = $(el).find('tr').last().prev().find('td').text();
        weatherDetails.humidity = humidity;
      });
      res.status(200).json(weatherDetails);
    } else {
      res.status(401).json(`ERROR happened, request failed: ${error}`);
    }
  });
};

app.get('/moveo-webcrawl/:location', (req, res) => webScrape(req, res));

const port = process.env.PORT || '3001';

app.listen(port, () => console.log(`Server Listen On Port: ${port}`));
