let allMarkets;
let position;
let chart;
let exchange;
let detailsError;

function scrollControll(fixmeTop) {
    return () => {
        let currentScroll = $(window).scrollTop();

        if (currentScroll >= fixmeTop) {
            $('#top-bar').css({
                'border-bottom-width': '2px'
            });
        } else {
            $('#top-bar').css({
                'border-bottom-width': 0
            });
        }
    }
}

$(window).on('load', () => {
    $('#details').hide();
    let fixmeTop = $('#top-bar').offset().top;       // get initial position of the element
    $(window).scroll(scrollControll(fixmeTop));

    $('#refresh-icon').click(() => {
        position = 0;
        allMarkets = undefined;
        loadDataAndUpdate($("#exchanges option:selected").val());
    });

    $('#back-to-main').click(() => {
        $('#home').show();
        $('#details').hide();
        $('.overlay').show();
        $('#content').hide();
        $('#details-error').hide();
        $('#not-supported').hide();
        $('#loading-spinner').show();
        $('#refresh-details').css('z-index', '20');
        $('#back-to-main').css('z-index', '20');
        $('#last-price-details-page').text('0');
    });

    $('#refresh-details').click(() => {
        if (detailsError) {
            $('#refresh-details').css('z-index', '20');
            $('#back-to-main').css('z-index', '20');
            $('#details-error').hide();
            $('#loading-spinner').show();
        }
        loadDetailsUI(currentTicker);
    });

    $('#load-more').click(() => {
        $('#load-more').hide();
        loadDataAndUpdate();
    });

    const dropdown = $('#exchanges');

    if (chrome.storage) {
        chrome.storage.sync.get(['exchange'], onExchangeRead(dropdown));
    } else {
        onExchangeRead (dropdown)({exchange: 'gdax'})
    }
});

function onExchangeRead (dropdown){
    return (item) => {
        let savedExchange = item.exchange ? item.exchange : 'gdax';
        console.log(savedExchange);

        for (let i = 0; i < ccxt.exchanges.length; i++){
            if (!unsupportedExchanges[ccxt.exchanges[i]]) {
                const opt = $('<option>').attr('value', ccxt.exchanges[i]).text(ccxt.exchanges[i]);
                if (ccxt.exchanges[i] === savedExchange)
                    opt.attr('selected', true);
                dropdown.append(opt);
            }
        }

        position = 0;
        allMarkets = undefined;
        exchange = new ccxt[savedExchange]();
        loadDataAndUpdate();

        dropdown.change(function() {
            position = 0;
            allMarkets = undefined;
            chrome.storage.sync.set({ exchange: this.value });
            exchange = new ccxt[this.value]();
            loadDataAndUpdate();
        });
    }
}

function sortMarkets(markets) {
    console.log(markets)
    markets = markets.constructor === Array ? markets : Object.keys(markets).map(symbol => { return {symbol}});
    console.log(markets)
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

function fetchTickerFailureHandler(market) {
    return () => {
        const valueTd = $('#' + market.symbol.split('/').join('').split('.').join(''));
        valueTd.empty();
        valueTd.append($('<span>').addClass('td-font-weight').text('0'));
        const refreshClickHandler = () => {
            const valueTd = $('#' + market.symbol.split('/').join('').split('.').join(''));
            valueTd.empty();
            valueTd.append($('<span>').addClass('td-font-weight').text('0'), '&nbsp;&nbsp;');
            valueTd.append($('<div>').addClass('mdl-spinner mdl-js-spinner is-active').addClass('small-spinner'));
            componentHandler.upgradeDom();

            exchange.fetchTicker((exchange.id === '_1btcxe' || exchange.id === 'getbtc') ? market.symbol.split('/')[1] : market.symbol)
                .then((ticker) => {
                    valueTd.empty();
                    const value = ticker.last? ticker.last : ticker.close;
                    if(!value) {
                        valueTd.closest('tr').hide();
                        $('html').height($('#container').height());
                    } else {
                        valueTd.append($('<span>').addClass('td-font-weight').text(value));
                    }
                })
                .catch((err) => {
                    console.log(err);
                    valueTd.empty();
                    valueTd.append($('<span>').addClass('td-font-weight').text('0'));
                    valueTd.append($('<i>').addClass('material-icons').addClass('small-refresh').text('refresh').click(refreshClickHandler));
                });
        };
        const refresh = $('<i>').addClass('material-icons').addClass('small-refresh').text('refresh').click(refreshClickHandler);
        valueTd.append(refresh);
    };
}

function processMarkets(markets, tableBody) {
    return markets.map((market) => {
        const tr = $('<tr/>');
        const td = $('<td/>').addClass('mdl-data-table__cell--non-numeric').addClass('td-style');
        const td2 = $('<td/>').attr('id', market.symbol.split('/').join('').split('.').join('')).addClass('td-style');

        const logo = logos[market.symbol.split('/')[0]];
        if (logo)
            td.append($('<img/>').attr('src', 'logos/' + logo).addClass('logo-style'));
        else
            td.append($('<img/>').attr('src', '../img/icon.png').addClass('logo-style'));
        td.append($('<span>').append($('<a>').attr('id', 'name-' + market.symbol.split('/').join('').split('.').join('')).text(market.symbol).click(() => {
            $('#home').hide();
            $('#details').show();
            $('html').height(518);
            window.scrollTo(0, 0);
            loadDetailsUI(market.symbol);
        })));

        td2.append($('<span>').addClass('td-font-weight').text('0'), '&nbsp;&nbsp;');
        td2.append($('<div>').addClass('mdl-spinner mdl-js-spinner is-active').addClass('small-spinner'));

        tr.append(td);
        tr.append(td2);
        tableBody.append(tr);
        componentHandler.upgradeDom();
        $('html').height($('#container').height());

        return exchange.fetchTicker((exchange.id === '_1btcxe' || exchange.id === 'getbtc') ? market.symbol.split('/')[1] : market.symbol)
            .then((ticker) => {
                const valueTd = $('#' + market.symbol.split('/').join('').split('.').join(''));
                valueTd.empty();
                const value = ticker.last? ticker.last : ticker.close;
                if(!value) {
                    valueTd.closest('tr').hide();
                    $('html').height($('#container').height());
                } else {
                    valueTd.append($('<span>').addClass('td-font-weight').text(value));
                }
            })
            .catch(fetchTickerFailureHandler(market));
    });
}

function loadMarkets() {
    return exchange.fetchMarkets();
}

function loadDataAndUpdate() {
    $('#ticker-table').css('pointer-events', 'none');
    $('#exchanges').attr('disabled', true);
    $('#refresh-icon').hide();
    $('#refresh-spinner').show();
    componentHandler.upgradeDom();
    if (!allMarkets) {
        const tableBody = $('#table-body');
        $('#load-more').hide();
        tableBody.empty();
        $('html').height($('#container').height());
        loadMarkets()
            .then((markets) => {
                markets = sortMarkets(markets);
                allMarkets = markets;
                if (allMarkets.length < position + 20) {
                    updateTable(allMarkets.slice(position), false);
                    position = allMarkets.length
                } else {
                    updateTable(allMarkets.slice(position, position + 20), true);
                    position = position + 20;
                }
            })
            .catch((err) => {
                console.log(err);
                $('#exchanges').removeAttr('disabled');
                $('#refresh-icon').show();
                $('#refresh-spinner').hide();
                $('html').height($('#container').height());
            })
    } else {
        if (position === allMarkets.length)
            return;
        if (allMarkets.length < position + 20) {
            updateTable(allMarkets.slice(position), false);
            position = allMarkets.length
        } else {
            updateTable(allMarkets.slice(position, position + 20), true);
            position = position + 20;
        }
    }
}

function updateTable(markets, showLoadMore) {
    const tableBody = $('#table-body');
    if (!markets)
        return;
    if(markets.constructor !== Array) {
        markets = Object.keys(markets).map(key => markets[key]);
    }

    const promises = processMarkets(markets, tableBody);
    $('a').css({ color: '#000000', 'font-weight': 'normal' });
    Promise.all(promises)
        .then(() => {
            $('a').css({ color: '', 'font-weight': '' });
            $('#exchanges').removeAttr('disabled');
            $('#refresh-icon').show();
            $('#refresh-spinner').hide();
            $('#ticker-table').css('pointer-events', 'auto');
            componentHandler.upgradeDom();
            if (showLoadMore)
                $('#load-more').show();
            else
                $('#load-more').hide();
        })
        .catch(() => {
            $('a').css({ color: '', 'font-weight': '' });
            $('#exchanges').removeAttr('disabled');
            $('#refresh-icon').show();
            $('#refresh-spinner').hide();
            $('#ticker-table').css('pointer-events', 'auto');
            componentHandler.upgradeDom();
            if (showLoadMore)
                $('#load-more').show();
            else
                $('#load-more').hide();
        })
}