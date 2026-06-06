const { c } = require("./server");
class InventoryItem {


    static fromGarageItem(item) {
        return new InventoryItem(c(item.id, "health"), c(item.count, 0));
    }

    constructor(id, count) {
        this.id = id;
        this.count = count;
        this.time = (id === "health" ? 20 : 55);
        this.rest = 10;
        this.slot_id = 6;
        if (id === "health")
            this.slot_id = 1;
        else if (id === "armor")
            this.slot_id = 2;
        else if (id === "double_damage")
            this.slot_id = 3;
        else if (id === "n2o")
            this.slot_id = 4;
        else if (id === "mine")
            this.slot_id = 5;
		else if (id === "gold")
            this.slot_id = 6;
    }

    toObject() {
        return { itemEffectTime: this.time, count: this.count, slotId: this.slot_id, id: this.id, itemRestSec: this.rest };
    }
}

module.exports = InventoryItem;
