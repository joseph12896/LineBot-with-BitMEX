class Quote {
    constructor() {
        this.data = [];
    }

    clear() {
        this.data = [];
    }

    parse(raw) {
        // quote資料格式
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

        // 第1次接收到資料
        if (raw.action == 'partial') {
            this.data = raw.data.slice(0, raw.data.length);
        }

        // 第n>1次接收到資料
        if (raw.action == 'insert') {
            raw.data.map((ele) => {
                let idx = this.data.findIndex((quote_ele) => { return quote_ele.symbol == ele.symbol; });
                this.data[idx] = Object.assign({}, ele);  // 複製收到的資料
            })
        }
    }

    get(symbol) {
        let obj = this.data.find((ele) => {
            return ele.symbol == symbol;
        });
        return obj; // object or undefined
    }
}

module.exports = Quote;