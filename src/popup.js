let allMarkets;
let position;
let chart;
let exchange;
let detailsError;

function scrollControll(fixmeTop) {
    return () => {
        let currentScroll = $(window).scrollTop();

        if (currentScroll >= fixmeTop) {
            $('#topBar').css({
                "border-bottom-width":'2px'
            });
        } else {
            $('#topBar').css({
                "border-bottom-width":'0px'
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

    $('#backToMain').click(() => {
        position = 0;
        allMarkets = undefined;
        $('#home').show();
        $('#details').hide();
        $('.overlay').show();
        $('#content').hide();
        $('#detailsError').hide();
        $('#notSupported').hide();
        $('#loadingSpinner').show();
        $('#refreshDetails').css('z-index', '20');
        $('#backToMain').css('z-index', '20');
        $('#lastPriceDetailsPage').text('0');

        loadDataAndUpdate();
    });

    $('#refreshDetails').click(() => {
        if (detailsError) {
            $('#refreshDetails').css('z-index', '20');
            $('#backToMain').css('z-index', '20');
            $('#detailsError').hide();
            $('#loadingSpinner').show();
        }
        loadDetailsUI(currentTicker);
    });

    $('#loadMore').click(() => {
        $('#loadMore').hide();
        loadDataAndUpdate();
    });

    const dropdown = $('#exchanges');

    chrome.storage.sync.get(['exchange'], function(item){
        let savedExchange = item.exchange ? item.exchange : 'gdax';
        console.log(savedExchange);

        for (let i = 0; i < ccxt.exchanges.length; i++){
            const opt = $('<option>').attr('value', ccxt.exchanges[i]).text(ccxt.exchanges[i]);
            if (ccxt.exchanges[i] === savedExchange)
                opt.attr('selected', true);
            dropdown.append(opt);
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

function fetchTickerFailureHandler(market) {
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

function processMarkets(markets, tableBody) {
    return markets.map((market) => {
        const tr = $('<tr/>');
        const td = $('<td/>').addClass('mdl-data-table__cell--non-numeric').attr('style', 'padding: 12px');
        const td2 = $('<td/>').attr('id', market.symbol.split('/').join('').split('.').join('')).attr('style', 'padding: 12px');

        const logo = logos[market.symbol.split('/')[0]];
        if (logo)
            td.append($('<img/>').attr('src', 'logos/' + logo).attr('style', 'height: 15px; width: 15px; margin-right:5px;  margin-bottom:5px'));
        else
            td.append($('<img/>').attr('src', '../img/icon.png').attr('style', 'height: 15px; width: 15px; margin-right:5px;  margin-bottom:5px'));
        td.append($('<span>').append($('<a>').attr('id', 'name-' + market.symbol.split('/').join('').split('.').join('')).text(market.symbol).click(() => {
            $('#home').hide();
            $('#details').show();
            $('html').height(518);
            window.scrollTo(0, 0);
            loadDetailsUI(market.symbol);
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
            .catch(fetchTickerFailureHandler(market));
    });
}

function loadMarkets() {
    return exchange.fetchMarkets();
}

function loadDataAndUpdate() {
    $('#tickerTable').css('pointer-events', 'none');
    $('#exchanges').attr('disabled', true);
    $('#refreshIcon').hide();
    $('#refreshSpinner').show();
    componentHandler.upgradeDom();
    if (!allMarkets) {
        const tableBody = $('#tableBody');
        $('#loadMore').hide();
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
            updateTable(allMarkets.slice(position), false);
            position = allMarkets.length
        } else {
            updateTable(allMarkets.slice(position, position + 20), true);
            position = position + 20;
        }
    }
}

function updateTable(markets, showLoadMore) {
    const tableBody = $('#tableBody');
    if (!markets)
        return;
    if(markets.constructor !== Array) {
        markets = Object.keys(markets).map(key => markets[key]);
    }

    const promises = processMarkets(markets, tableBody);
    $('a').css('color', '#000000');
    $('a').css('font-weight', 'normal');
    Promise.all(promises)
        .then(() => {
            $('a').css('color', '');
            $('a').css('font-weight', '');
            $('#exchanges').removeAttr('disabled');
            $('#refreshIcon').show();
            $('#refreshSpinner').hide();
            $('#tickerTable').css('pointer-events', 'auto');
            componentHandler.upgradeDom();
            if (showLoadMore)
                $('#loadMore').show();
            else
                $('#loadMore').hide();
        })
        .catch((err) => {
            $('a').css('color', '');
            $('a').css('font-weight', '');
            $('#exchanges').removeAttr('disabled');
            $('#refreshIcon').show();
            $('#refreshSpinner').hide();
            $('#tickerTable').css('pointer-events', 'auto');
            componentHandler.upgradeDom();
            if (showLoadMore)
                $('#loadMore').show();
            else
                $('#loadMore').hide();
        })
}