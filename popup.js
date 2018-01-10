let allMarkets;
let position;
let chart;

function scrollControll(fixmeTop) {                  // assign scroll event listener
    return () => {
        let currentScroll = $(window).scrollTop(); // get current position

        if (currentScroll >= fixmeTop) {           // apply position: fixed if you
            $('#topBar').css({                      // scroll to that element or below it
                position: 'fixed',
                top: '0',
                left: '0',
                "border-bottom":'2px',
                "border-bottom-color":'rgba(0,0,0,.12)',
                "border-bottom-style":'solid'
            });
        } else {                                   // apply position: static
            $('#topBar').css({                      // if you scroll above it
                position: 'static',
                "border-bottom":'none',
            });
        }
    }
}

$(window).on('load', () => {
    let fixmeTop = $('#topBar').offset().top;       // get initial position of the element
    $(window).scroll(scrollControll(fixmeTop));

    $('#refreshIcon').click(() => {
        position = 0;
        allMarkets = undefined;
        loadDataAndUpdate($("#exchanges option:selected").val());
    });

    $('#loadMore').click(() => {
        $('#loadMore').hide();
        loadDataAndUpdate($("#exchanges option:selected").val());
    });

    const dropdown = $('#exchanges');

    for (let i = 0; i < ccxt.exchanges.length; i++){
        const opt = $('<option>').attr('value', ccxt.exchanges[i]).text(ccxt.exchanges[i]);
        if (ccxt.exchanges[i] === 'gdax')
          opt.attr('selected', true);
        dropdown.append(opt);
    }

    position = 0;
    allMarkets = undefined;
    loadDataAndUpdate('gdax');

    dropdown.change(function() {
        position = 0;
        allMarkets = undefined;
        loadDataAndUpdate(this.value);
    });
});

function sortMarkets(markets) {
    return markets.filter(market => market.active === undefined ? true : market.active).sort((a, b) => {
        const aBeginining = priority[a.symbol.split('/')[0]];
        const bBeginining = priority[b.symbol.split('/')[0]];

        if (aBeginining && bBeginining) {
            if (aBeginining < bBeginining) {
                return -1;
            }
            else if (bBeginining < aBeginining) {
                return 1;
            }
            return 0;
        } else if (aBeginining)
            return -1;
        else if (bBeginining)
            return 1;

        return 0;
    });
}

function fetchTickerFailureHandler(market, exchange) {
    return () => {
        const valueTd = $('#' + market.symbol.split('/').join('').split('.').join(''));
        valueTd.empty();
        valueTd.append($('<span>').attr('style','font-weight: 100').text('0'));
        const refreshClickHandler = () => {
            const valueTd = $('#' + market.symbol.split('/').join('').split('.').join(''));
            valueTd.empty();
            valueTd.append($('<span>').attr('style','font-weight: 100').text('0'), '&nbsp;&nbsp;');
            valueTd.append($('<div>').addClass('mdl-spinner mdl-js-spinner is-active').attr('style', 'height: 12px; width: 12px'));
            componentHandler.upgradeDom();

            exchange.fetchTicker(market.symbol)
                .then((ticker) => {
                    valueTd.empty();
                    valueTd.append($('<span>').attr('style','font-weight: 100').text(ticker.last? ticker.last : ticker.close));
                })
                .catch(() => {
                    valueTd.empty();
                    valueTd.append($('<span>').attr('style','font-weight: 100').text('0'));
                    valueTd.append($('<i>').addClass('material-icons').attr('style', 'font-size: 15px;margin-left: 3px;color: red;vertical-align: -3px; cursor: pointer;').text('refresh').click(refreshClickHandler));
                });
        };
        const refresh = $('<i>').addClass('material-icons').attr('style', 'font-size: 15px;margin-left: 3px;color: red;vertical-align: -3px;cursor: pointer;').text('refresh').click(refreshClickHandler);
        valueTd.append(refresh);
    };
}

function processMarkets(exchange, markets, tableBody) {
    return markets.map((market) => {
        const tr = $('<tr/>');
        const td = $('<td/>').addClass('mdl-data-table__cell--non-numeric').attr('style', 'padding: 12px');
        const td2 = $('<td/>').attr('id', market.symbol.split('/').join('').split('.').join('')).attr('style', 'padding: 12px');

        const logo = logos[market.symbol.split('/')[0]];
        if (logo)
            td.append($('<img/>').attr('src', 'logos/' + logo).attr('style', 'height: 15px; width: 15px; margin-right:5px;  margin-bottom:5px'));
        else
            td.append($('<img/>').attr('src', 'icon.png').attr('style', 'height: 15px; width: 15px; margin-right:5px;  margin-bottom:5px'));
        td.append($('<span>').append($('<a>').attr('id', 'name-' + market.symbol.split('/').join('').split('.').join('')).text(market.symbol).click(() => {
            $('#home').hide();
            $('#details').show();
            $('html').height($('#details').height());
            window.scrollTo(0, 0);
            loadUI('gdax', 'BTC/USD');
        })));

        td2.append($('<span>').attr('style','font-weight: 100').text('0'), '&nbsp;&nbsp;');
        td2.append($('<div>').addClass('mdl-spinner mdl-js-spinner is-active').attr('style', 'height: 12px; width: 12px'));

        tr.append(td);
        tr.append(td2);
        tableBody.append(tr);
        componentHandler.upgradeDom();
        $('html').height($('#container').height());

        return exchange.fetchTicker(market.symbol)
            .then((ticker) => {
                const valueTd = $('#' + market.symbol.split('/').join('').split('.').join(''));
                valueTd.empty();
                valueTd.append($('<span>').attr('style','font-weight: 100').text(ticker.last? ticker.last : ticker.close));
                //valueTd.append($('<i>').addClass('material-icons').attr('style', 'font-size: 15px;margin-left: 3px;color: green').text('done'));
            })
            .catch(fetchTickerFailureHandler(market, exchange));
    });
}

function loadMarkets(exchange) {
    return exchange.fetchMarkets();
}

function loadDataAndUpdate(value) {
    $('#exchanges').attr('disabled', true);
    $('#refreshIcon').hide();
    $('#refreshSpinner').show();
    componentHandler.upgradeDom();
    const exchange = new ccxt[value]();
    if (!allMarkets) {
        const tableBody = $('#tableBody');
        $('#loadMore').hide();
        tableBody.empty();
        $('html').height($('#container').height());
        loadMarkets(exchange)
            .then((markets) => {
                markets = sortMarkets(markets);
                allMarkets = markets;
                if (allMarkets.length < position + 20) {
                    updateTable(exchange, allMarkets.slice(position), false);
                    position = allMarkets.length
                } else {
                    updateTable(exchange, allMarkets.slice(position, position + 20), true);
                    position = position + 20;
                }
            })
            .catch(() => {
                $('#exchanges').removeAttr('disabled');
                $('#refreshIcon').show();
                $('#refreshSpinner').hide();
                $('html').height($('#container').height());
            })
    } else {
        if (position === allMarkets.length)
            return;
        if (allMarkets.length < position + 20) {
            updateTable(exchange, allMarkets.slice(position), false);
            position = allMarkets.length
        } else {
            updateTable(exchange, allMarkets.slice(position, position + 20), true);
            position = position + 20;
        }
    }
}

function updateTable(exchange, markets, showLoadMore) {
    const tableBody = $('#tableBody');
    if (!markets)
        return;
    if(markets.constructor !== Array) {
        markets = Object.keys(markets).map(key => markets[key]);
    }

    const promises = processMarkets(exchange, markets, tableBody);

    Promise.all(promises)
        .then(() => {
            $('#exchanges').removeAttr('disabled');
            $('#refreshIcon').show();
            $('#refreshSpinner').hide();
            componentHandler.upgradeDom();
            if (showLoadMore)
                $('#loadMore').show();
            else
                $('#loadMore').hide();
        })
        .catch((err) => {
            $('#exchanges').removeAttr('disabled');
            $('#refreshIcon').show();
            $('#refreshSpinner').hide();
            componentHandler.upgradeDom();
            if (showLoadMore)
                $('#loadMore').show();
            else
                $('#loadMore').hide();
        })
}

function loadUI(exchangeName, ticker) {
    const exchange = new ccxt[exchangeName]();
    exchange.fetchOHLCV (ticker, '1m').then((data) => {
        data = data.map(item => item.slice(0, 5)).sort((a, b) => a[0] - b[0]);
        console.log(data);
        loadChart(exchangeName, ticker, data);
        $('#openValue').text(data[data.length - 1][1]);
        $('#highValue').text(data[data.length - 1][2]);
        $('#lowValue').text(data[data.length - 1][3]);
        $('#closeValue').text(data[data.length - 1][4]);
        $('.overlay').hide();
    });
}

function loadChart(exchangeName, ticker, data) {
    chart = Highcharts.stockChart('chart', {
        exporting: { enabled: false },
        rangeSelector: {
            selected: 0,
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
            },{
                type: 'ytd',
                text: 'YTD'
            }, {
                type: 'month',
                count: 1,
                text: '1M'
            }, {
                type: 'month',
                count: 2,
                text: '2M'
            }, {
                type: 'all',
                text: 'All'
            }]
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