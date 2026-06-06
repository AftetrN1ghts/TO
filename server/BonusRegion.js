const { mt_rand } = require("./server");

class BonusRegion {

    constructor(region) {
        this.min = region.min;
        this.max = region.max;
        this.bonus_type = region['bonus-type'];

        this.resetDropTime();
    }

    genDropPosition() {
        return { x: mt_rand(this.min.x, this.max.x), y: mt_rand(this.min.y, this.max.y), z: mt_rand(this.min.z, this.max.z) }
    }

    resetDropTime() {
        this.nextDrop = mt_rand(45, 60);
    }

    update(deltaTime) {
        this.nextDrop -= deltaTime;

        if (this.nextDrop <= 0) {
            this.resetDropTime();
            return true;
        }

        return false;
    }

}

module.exports = BonusRegion