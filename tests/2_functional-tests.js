const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
    test("Viewing one stock: GET request to /api/stock-prices/", function (done) {
        chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: 'goog' })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body.stockData, 'stock');
                assert.property(res.body.stockData, 'price');
                assert.property(res.body.stockData, 'likes');
                assert.equal(res.body.stockData.stock, 'GOOG');
                done();
            });
    });
    test("Viewing two stocks: GET request to /api/stock-prices/", function (done) {
        chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: ['goog', 'msft'] })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, 'stockData');
                assert.isArray(res.body.stockData);
                assert.property(res.body.stockData[0], 'stock');
                assert.property(res.body.stockData[0], 'price');
                assert.property(res.body.stockData[0], 'rel_likes');
                assert.equal(res.body.stockData[0].stock, 'GOOG');
                assert.equal(res.body.stockData[1].stock, 'MSFT');
                done();
            });
    });
    test("Viewing one stock with invalid symbol: GET request to /api/stock-prices/", function (done) {
        chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: '1234' })
            .end(function (err, res) {
                assert.equal(res.status, 400);
                assert.equal(res.text, 'Unknown or invalid stock symbol');
                done();
            });
    });
    test("Viewing two stocks with invalid symbol: GET request to /api/stock-prices/", function (done) {
        chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: ['1234', '5678'] })
            .end(function (err, res) {
                assert.equal(res.status, 400);
                assert.equal(res.text, 'Unknown or invalid stock symbol');
                done();
            });
    });
    test("Viewing too many (three) stocks: GET request to /api/stock-prices/", function (done) {
        chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: ['GOOG', 'MSFT', 'NVDA'] })
            .end(function (err, res) {
                assert.equal(res.status, 400);
                assert.equal(res.text, 'Too many stocks');
                done();
            });
    });
});
