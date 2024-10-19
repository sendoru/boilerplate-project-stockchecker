'use strict';
const { set } = require('express/lib/application');
// const sha256 = require('sha256');
const crypto = require('crypto');

const apiUrl = "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/[SYMBOL]/quote";
const likedIPbyStock = {};
// some random short salt generated on runtime
const hashSalt = crypto.randomBytes(20).toString('hex');

const getStockData = async (symbol) => {
  const url = apiUrl.replace('[SYMBOL]', symbol);
  const response = await fetch(url);
  const data = await response.json();
  if (data === "Unknown symbol" || data === "Invalid symbol") {
    return 'Unknown or invalid stock symbol';
  }
  const ret = {};
  ret.stock = symbol;
  ret.price = data.latestPrice;
  if (likedIPbyStock[symbol]) {
    ret.likes = likedIPbyStock[symbol].size;
  }
  else {
    ret.likes = 0;
  }
  return ret;
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res) {
      const symbol = req.query.stock;
      let like = req.query.like;
      if (toString(like) === "true") {
        like = true;
      }
      else {
        like = false;
      }
      // hasing the ip address
      let ip = crypto.hash('sha1', req.ip + hashSalt);

      if (!symbol) {
        return res.status(400).send('Stock symbol is required');
      }
      // multiple stocks
      if (Array.isArray(symbol)) {
        if (symbol.length > 2) {
          return res.status(400).send('Too many stocks');
        }
        const stock1 = symbol[0].toUpperCase();
        const stock2 = symbol[1].toUpperCase();

        if (like) {
          // should use treeset or hashset for better performance
          if (!likedIPbyStock[stock1]) {
            likedIPbyStock[stock1] = new Set();
          }
          if (!likedIPbyStock[stock2]) {
            likedIPbyStock[stock2] = new Set();
          }
          if (!likedIPbyStock[stock1].has(ip)) {
            likedIPbyStock[stock1].add(ip);
          }
          if (!likedIPbyStock[stock2].has(ip)) {
            likedIPbyStock[stock2].add(ip);
          }
        }

        const stockData1 = getStockData(stock1);
        const stockData2 = getStockData(stock2);
        Promise.all([stockData1, stockData2])
          .then((values) => {
            if (values[0] === 'Unknown or invalid stock symbol' || values[1] === 'Unknown or invalid stock symbol') {
              return res.status(400).send('Unknown or invalid stock symbol');
            }
            // change likes to relative likes
            values[0].rel_likes = values[0].likes - values[1].likes;
            values[1].rel_likes = values[1].likes - values[0].likes;
            // drop likes
            delete values[0].likes;
            delete values[1].likes;
            res.json({
              stockData: values
            });
          });
      }
      else {
        const stock = symbol.toUpperCase();
        if (like) {
          if (!likedIPbyStock[stock]) {
            likedIPbyStock[stock] = new Set();
          }
          if (!likedIPbyStock[stock].has(ip)) {
            likedIPbyStock[stock].add(ip);
          }
        }
        getStockData(stock)
          .then((data) => {
            if (data === 'Unknown or invalid stock symbol') {
              return res.status(400).send('Unknown or invalid stock symbol');
            }
            res.json({
              stockData: data
            });
          });
      }
    });
};
