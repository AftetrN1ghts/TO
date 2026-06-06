class BonusBox {

    constructor(id, bonus_id = null) {
        this.id = id;
        this.bonus_id = bonus_id;
        this.disappearing_time = 30;

        if (this.isRare())
            this.disappearing_time = 300;

        if (this.isSpecial())
            this.disappearing_time = 10000;

        this.start_date = Date.now();
        this.disappearing_date = Date.now() + this.disappearing_time * 1000;
    }

    isSpecial() {
        return this.id === "crystal100";
    }

    isRare() {
        return this.id === "crystal";
    }

    getXMLName() {
        if (this.isSpecial())
            return "crystal_100";

        if (this.isRare())
            return "crystal";

        return this.id;
    }

    getClientName() {
        if (this.id === "crystal100")
            return "gold";

        if (this.isSpecial())
            return this.id;

        if (this.isRare())
            return "crystall";

        if (this.id === "medkit")
            return "health";

        if (this.id === "nitro")
            return "nitro";

        if (this.id === "damageup")
            return "damage";

        if (this.id === "armorup")
            return "armor";

        return null;
    }

    isValid() {
        return this.getClientName() !== null;
    }

    updateBonusId(counter) {
        this.bonus_id = this.getClientName() + "_" + counter;
    }

    setBonusId(bonus_id) {
        this.bonus_id = bonus_id;
    }

    start() {
        this.start_date = Date.now();
        this.disappearing_date = Date.now() + this.disappearing_time * 1000;
    }

    canDisappear() {
        return this.disappearing_date <= Date.now();
    }

}

module.exports = BonusBox;
