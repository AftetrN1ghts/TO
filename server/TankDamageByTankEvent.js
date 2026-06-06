class TankDamageByTankEvent {


    static get GUN_SMOKY() {
        return 0;
    }


    static get GUN_FIREBIRD() {
        return 1;
    }


    static get GUN_TWINS() {
        return 2;
    }


    static get GUN_RAILGUN() {
        return 3;
    }


    static get GUN_ISIDA() {
        return 4;
    }


    static get GUN_THUNDER() {
        return 5;
    }


    static get GUN_FREEZE() {
        return 6;
    }


    static get GUN_RICOCHET() {
        return 7;
    }


    static get GUN_SHAFT() {
        return "shaft";
    }

    constructor(target, damage, cause = TankDamageEvent.CAUSE_SUICIDE) {
        this.target = target;
        this.damage = damage;
    }

    getTarget() {
        return this.target;
    }

    getDamage() {
        return this.damage;
    }

    setDamage() {
        return this.damage;
    }


}
