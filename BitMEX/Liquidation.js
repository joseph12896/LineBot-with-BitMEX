const Rekt = require('./Schema').Rekt; // model
const moment = require('moment');

class Liquidation {
    constructor() {
       this.buffer =[];
    }

    clear() {
       this.buffer = [];
    }

    async saveArr(arr) {
        await Promise.all(arr.map((ele) => {
            return new Rekt({
                symbol: ele.symbol,
                side: ele.side,
                price: Number(ele.price),
                leavesQty: Number(ele.leavesQty),
                timestamp: Number(moment().valueOf()),
            }).save();
        }));
    }

    parse(raw) {
        // liquidation資料格式
        // {
        //     table: 'liquidation',
        //     keys: ['orderID'],
        //     types:
        //         {
        //             orderID: 'guid',
        //             symbol: 'symbol',
        //             side: 'symbol',
        //             price: 'float',
        //             leavesQty: 'long'
        //         },
        //     foreignKeys: { symbol: 'instrument', side: 'side' },
        //     attributes: { orderID: 'grouped' },
        //     action: 'partial',
        //     data: [],
        //     filter: {}
        // }

        // action: insert -> (update) -> delete
        
        if (raw.action == 'insert') {

            // 儲存接收到的強平訊息
            this.saveArr(raw.data);
            // 新增至buffer
            raw.data.map(ele => {
                this.buffer.push(ele);
            });
            
        }else if (raw.action == 'update'){

            // 更新在buffer裡面所對應的資料
            raw.data.map(ele => {
                let idx = this.buffer.findIndex((bufferItem) => { return bufferItem.orderID == ele.orderID; });
                if (idx >= 0) this.buffer[idx] = Object.assign(this.buffer[idx], ele);
            });
            
        }else if (raw.action == 'delete'){

             // 移除在buffer裡面所對應的資料
             raw.data.map(ele => {
                let idx = this.buffer.findIndex((bufferItem) => { return bufferItem.orderID == ele.orderID; });
                this.buffer.splice(idx,1);
            }); 
        }
    }
}

module.exports = Liquidation;