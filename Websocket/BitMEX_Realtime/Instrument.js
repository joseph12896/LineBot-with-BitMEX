var data = [];

module.exports = {
    parse,
    reset,
    get
};

function reset() {
    data = [];
}

function get(symbol) {
    let obj = data.find((ele) => {
        return ele.symbol == symbol;
    });
    return obj; // object or undefined
}

function parse(raw) {

    // 第1次接收到資料
    if (raw.action == 'partial') {
        data = raw.data.slice(0, raw.data.length);
    }

    // 第n>1次接收到資料
    if (raw.action == 'insert') {
        raw.data.map((ele) => {
            data.push(ele);  // 複製收到的資料
        })
    }
    if (raw.action == 'update') {
        raw.data.map((ele) => {
            let idx = data.findIndex((inst_ele) => { return inst_ele.symbol == ele.symbol; });
            data[idx] = Object.assign(data[idx], ele);  // 複製收到的資料
        })
    }
}

// 資料格式
// {
//     table: 'instrument',
//     keys: ['symbol'],
//     types:
//         {
//             symbol: 'symbol',
//             rootSymbol: 'symbol',
//             state: 'symbol',
//             typ: 'symbol',
//             listing: 'timestamp',
//             front: 'timestamp',
//             expiry: 'timestamp',
//             settle: 'timestamp',
//             relistInterval: 'timespan',
//             inverseLeg: 'symbol',
//             sellLeg: 'symbol',
//             buyLeg: 'symbol',
//             positionCurrency: 'symbol',
//             underlying: 'symbol',
//             quoteCurrency: 'symbol',
//             underlyingSymbol: 'symbol',
//             reference: 'symbol',
//             referenceSymbol: 'symbol',
//             calcInterval: 'timespan',
//             publishInterval: 'timespan',
//             publishTime: 'timespan',
//             maxOrderQty: 'long',
//             maxPrice: 'float',
//             lotSize: 'long',
//             tickSize: 'float',
//             multiplier: 'long',
//             settlCurrency: 'symbol',
//             underlyingToPositionMultiplier: 'long',
//             underlyingToSettleMultiplier: 'long',
//             quoteToSettleMultiplier: 'long',
//             isQuanto: 'boolean',
//             isInverse: 'boolean',
//             initMargin: 'float',
//             maintMargin: 'float',
//             riskLimit: 'long',
//             riskStep: 'long',
//             limit: 'float',
//             capped: 'boolean',
//             taxed: 'boolean',
//             deleverage: 'boolean',
//             makerFee: 'float',
//             takerFee: 'float',
//             settlementFee: 'float',
//             insuranceFee: 'float',
//             fundingBaseSymbol: 'symbol',
//             fundingQuoteSymbol: 'symbol',
//             fundingPremiumSymbol: 'symbol',
//             fundingTimestamp: 'timestamp',
//             fundingInterval: 'timespan',
//             fundingRate: 'float',
//             indicativeFundingRate: 'float',
//             rebalanceTimestamp: 'timestamp',
//             rebalanceInterval: 'timespan',
//             openingTimestamp: 'timestamp',
//             closingTimestamp: 'timestamp',
//             sessionInterval: 'timespan',
//             prevClosePrice: 'float',
//             limitDownPrice: 'float',
//             limitUpPrice: 'float',
//             bankruptLimitDownPrice: 'float',
//             bankruptLimitUpPrice: 'float',
//             prevTotalVolume: 'long',
//             totalVolume: 'long',
//             volume: 'long',
//             volume24h: 'long',
//             prevTotalTurnover: 'long',
//             totalTurnover: 'long',
//             turnover: 'long',
//             turnover24h: 'long',
//             prevPrice24h: 'float',
//             vwap: 'float',
//             highPrice: 'float',
//             lowPrice: 'float',
//             lastPrice: 'float',
//             lastPriceProtected: 'float',
//             lastTickDirection: 'symbol',
//             lastChangePcnt: 'float',
//             bidPrice: 'float',
//             midPrice: 'float',
//             askPrice: 'float',
//             impactBidPrice: 'float',
//             impactMidPrice: 'float',
//             impactAskPrice: 'float',
//             hasLiquidity: 'boolean',
//             openInterest: 'long',
//             openValue: 'long',
//             fairMethod: 'symbol',
//             fairBasisRate: 'float',
//             fairBasis: 'float',
//             fairPrice: 'float',
//             markMethod: 'symbol',
//             markPrice: 'float',
//             indicativeTaxRate: 'float',
//             indicativeSettlePrice: 'float',
//             settledPrice: 'float',
//             timestamp: 'timestamp'
//         },
//     data: [{ }, ...],
//     filter: {}
//  }
