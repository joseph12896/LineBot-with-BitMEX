module.exports = {
    parse,
    reset,
    get
};

var data = [];

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
            let idx = data.findIndex((quote_ele) => { return quote_ele.symbol == ele.symbol; });
            data[idx] = Object.assign({}, ele);  // 複製收到的資料
        })
    }
}

// 資料格式
// {
//     table: 'quote',
//     types:
//         {
//             timestamp: 'timestamp',
//             symbol: 'symbol',
//             bidSize: 'long',
//             bidPrice: 'float',
//             askPrice: 'float',
//             askSize: 'long'
//         },
//     action: 'partial',
//     data:
//         [{
//             timestamp: '2017-11-17T04:04:59.096Z',
//             symbol: 'B_BLOCKSZ17',
//             bidSize: 1,
//             bidPrice: 3.88,
//             askPrice: 5,
//             askSize: 184
//         }, ...],
//      filter: {}
// }


