const { c, market_list, getType } = require("./server");
class GarageItem {
    static get(id, m = 1) {
        return new GarageItem(id, 0, m);
    }


    static fromJSON(data) {
        var item = new GarageItem(c(data.id), c(data.modificationID, 0), c(data.count, 0));
        return item;
    }


    static getInfo(id) {
        for (var i in market_list) {
            if (market_list[i]["id"] === id)
                return market_list[i];
        }
        return null;
    }

    constructor(id, modificationID = 0, count = 0) {
        this.id = id;
        var info = GarageItem.getInfo(id);
        if (info !== null) {
            this.name = info.name;
            this.description = info.description;
            this.index = info.index;
            this.modification = info.modification;
        }
        else {
            this.name = "null";
            this.description = "";
            this.index = 3;
            this.modification = [];
        }
        this.modificationID = modificationID;
        this.type = getType(this.id);
        this.price = 0;
        this.rank = 0;
        this.properts = [];
        if (this.type > 3)
            this.count = count;

        var modifications = this.modification;
        if (typeof (modifications[modificationID]) !== "undefined") {
            this.price = modifications[modificationID].price;
            this.rank = modifications[modificationID].rank;
            this.properts = modifications[modificationID].properts;
        }
        if (modificationID >= modifications.length - 1) {
            this.next_price = this.price;
            this.next_rank = this.rank;
        }
        else {
            this.next_price = modifications[modificationID + 1].price;
            this.next_rank = modifications[modificationID + 1].rank;
        }

        this.isInventory = this.type === 4;
    }

    attempt_upgrade(tank) {
        if (this.type < 3 && this.modificationID < 3 && tank.crystals >= this.price && tank.rank >= this.rank) {
            tank.crystals -= this.next_price;
            this.modificationID++;
            var modificationID = this.modificationID,
                modifications = this.modification;
            if (typeof (modifications[modificationID]) !== "undefined") {
                this.price = modifications[modificationID].price;
                this.rank = modifications[modificationID].rank;
                this.properts = modifications[modificationID].properts;
            }
            if (modificationID >= modifications.length - 1) {
                this.next_price = this.price;
                this.next_rank = this.rank;
            }
            else {
                this.next_price = modifications[modificationID + 1].price;
                this.next_rank = modifications[modificationID + 1].rank;
            }
            return true;
        }
        return false;
    }

    toObject() {
        return { id: this.id, count: this.count, modificationID: this.modificationID };
    }

}

module.exports = GarageItem;
