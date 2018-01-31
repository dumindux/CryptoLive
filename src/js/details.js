const info1m = {
    displayText: '1 minute',
    buttons: [{
        type: 'hour',
        count: 1,
        text: '1h'
    }, {
        type: 'hour',
        count: 6,
        text: '6h'
    }, {
        type: 'hour',
        count: 12,
        text: '12h'
    }, {
        type: 'hour',
        count: 24,
        text: '24h'
    }, {
        type: 'month',
        count: 1,
        text: '1M'
    }, {
        type: 'month',
        count: 2,
        text: '2M'
    }, {
        type: 'ytd',
        text: 'YTD'
    }, {
        type: 'all',
        text: 'All'
    }]
};

const info1d = {
    displayText: '1 day',
    buttons: [{
        type: 'week',
        count: 1,
        text: '1w'
    }, {
        type: 'week',
        count: 2,
        text: '2w'
    }, {
        type: 'month',
        count: 1,
        text: '1M'
    }, {
        type: 'month',
        count: 3,
        text: '3M'
    }, {
        type: 'month',
        count: 6,
        text: '6M'
    }, {
        type: 'year',
        count: 1,
        text: ''
    }, {
        type: 'ytd',
        text: 'YTD'
    }, {
        type: 'all',
        text: 'All'
    }]
};

const info90m = {
    displayText: '90 minute',
    buttons: [{
        type: 'hour',
        count: 1,
        text: '1h'
    }, {
        type: 'hour',
        count: 6,
        text: '6h'
    }, {
        type: 'hour',
        count: 12,
        text: '12h'
    }, {
        type: 'hour',
        count: 24,
        text: '24h'
    }, {
        type: 'month',
        count: 1,
        text: '1M'
    }, {
        type: 'month',
        count: 2,
        text: '2M'
    }, {
        type: 'ytd',
        text: 'YTD'
    }, {
        type: 'all',
        text: 'All'
    }]
};

const info15m = {
    displayText: '15 minute',
    buttons: [{
        type: 'hour',
        count: 1,
        text: '1h'
    }, {
        type: 'hour',
        count: 6,
        text: '6h'
    }, {
        type: 'hour',
        count: 12,
        text: '12h'
    }, {
        type: 'hour',
        count: 24,
        text: '24h'
    }, {
        type: 'month',
        count: 1,
        text: '1M'
    }, {
        type: 'month',
        count: 2,
        text: '2M'
    }, {
        type: 'ytd',
        text: 'YTD'
    }, {
        type: 'all',
        text: 'All'
    }]
};

const OHLCCount = {
    bitmex: 500,
    poloniex: null,
};

const OHLCStart = {
    poloniex: true,
};

const info5m = {
    displayText: '5 minute',
    buttons: [{
        type: 'hour',
        count: 1,
        text: '1h'
    }, {
        type: 'hour',
        count: 6,
        text: '6h'
    }, {
        type: 'hour',
        count: 12,
        text: '12h'
    }, {
        type: 'hour',
        count: 24,
        text: '24h'
    }, {
        type: 'month',
        count: 1,
        text: '1M'
    }, {
        type: 'month',
        count: 2,
        text: '2M'
    }, {
        type: 'ytd',
        text: 'YTD'
    }, {
        type: 'all',
        text: 'All'
    }]
};

let currentTicker;

function loadDetailsUI(ticker) {
    currentTicker = ticker;
    if (!exchange.hasFetchOHLCV || !exchange.timeframes) {
        console.log(exchange.hasFetchOHLCV, exchange.timeframes);
        $('#not-supported').show();
        $('#loading-spinner').hide();
        $('#back-to-main').css('z-index', '1500');
        return;
    }

    const timeframe = Object.keys(exchange.timeframes)[0];

    const timeframeInformation = timeframe === '1m'? info1m : (timeframe === '5m' ? info5m : (timeframe === '15m' ? info15m : (timeframe === '90m' ? info90m : info1d)));

    exchange.timeout = 20000;
    $('#details-table-heading').text(`Past ${timeframeInformation.displayText} market data`);
    console.log(ticker, timeframe);
    const limit = OHLCCount[exchange.id];
    exchange.fetchOHLCV (ticker, timeframe, OHLCStart[exchange.id] ? (Date.now() - 86400 * 1000) : undefined, limit ? limit : (limit === null ? undefined : 1000))
        .then((data) => {
            console.log(data);
            data = data.map(item => [item[0], parseFloat(item[1]), parseFloat(item[2]), parseFloat(item[3]), parseFloat(item[4])]).sort((a, b) => a[0] - b[0]);
            loadChart(ticker, data, timeframeInformation.buttons);
            $('#openValue').text(data[data.length - 1][1]);
            $('#highValue').text(data[data.length - 1][2]);
            $('#lowValue').text(data[data.length - 1][3]);
            $('#closeValue').text(data[data.length - 1][4]);
            $('#content').show();
            $('.overlay').hide();
            exchange.timeout = 10000;
        })
        .catch((e) => {
            console.log(e);
            $('#details-error').show();
            $('#loading-spinner').hide();
            $('#refresh-details').css('z-index', '1500');
            $('#back-to-main').css('z-index', '1500');
            detailsError = true;
            exchange.timeout = 10000;
        });

    exchange.fetchTicker(ticker)
        .then(data => {
            $('#last-price-details-page').text(data.last);
        })
        .catch(() => {
            $('#last-price-details-page').text('0');
        });
}

function loadChart(ticker, data, buttons) {
    chart = Highcharts.stockChart('chart', {
        exporting: { enabled: false },
        rangeSelector: {
            selected: 0,
            buttons
        },
        title: {
            text: ticker + ' - ' + exchange.name
        },

        series: [{
            type: 'ohlc',
            name: ticker + ' - ' + exchange.name,
            data,
            dataGrouping: {
                units: [[
                    'minute', // unit name
                    [1] // allowed multiples
                ], [
                    'month',
                    [1, 2, 3, 4, 6]
                ]]
            }
        }]
    });
}
