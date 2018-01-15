const buttons1m = [{
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
},{
    type: 'ytd',
    text: 'YTD'
}, {
    type: 'all',
    text: 'All'
}];

const buttons1d = [{
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
},{
    type: 'ytd',
    text: 'YTD'
}, {
    type: 'all',
    text: 'All'
}];

const buttons90m = [{
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
},{
    type: 'ytd',
    text: 'YTD'
}, {
    type: 'all',
    text: 'All'
}];

const buttons15m = [{
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
},{
    type: 'ytd',
    text: 'YTD'
}, {
    type: 'all',
    text: 'All'
}];

const buttons5m = [{
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
},{
    type: 'ytd',
    text: 'YTD'
}, {
    type: 'all',
    text: 'All'
}];

function loadDetailsUI(exchangeName, ticker) {
    const exchange = new ccxt[exchangeName]();
    if (!exchange.hasFetchOHLCV || !exchange.timeframes) {
        $('#notSupported').show();
        $('#loadingSpinner').hide();
        $('#backToMain').css('z-index', '1500');
        return;
    }

    const timeframe = Object.keys(exchange.timeframes)[0];

    const buttons = timeframe === '1m'? buttons1m : (timeframe === '5m' ? buttons5m : (timeframe === '15m' ? buttons15m : (timeframe === '90m' ? buttons90m : buttons1d)))

    exchange.fetchOHLCV (ticker, '1d').then((data) => {
        data = data.map(item => item.slice(0, 5)).sort((a, b) => a[0] - b[0]);
        console.log(data);
        loadChart(exchangeName, ticker, data, buttons);
        $('#openValue').text(data[data.length - 1][1]);
        $('#highValue').text(data[data.length - 1][2]);
        $('#lowValue').text(data[data.length - 1][3]);
        $('#closeValue').text(data[data.length - 1][4]);
        $('#content').show();
        $('.overlay').hide();
    });
}

function loadChart(exchangeName, ticker, data, buttons) {
    chart = Highcharts.stockChart('chart', {
        exporting: { enabled: false },
        rangeSelector: {
            selected: 0,
            buttons
        },
        title: {
            text: ticker + ' - ' + exchangeName
        },

        series: [{
            type: 'ohlc',
            name: ticker + ' - ' + exchangeName,
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
