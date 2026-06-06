class Effect {


    static get HEALTH() {
        return 1;
    }


    static get ARMOR() {
        return 2;
    }


    static get DAMAGE() {
        return 3;
    }


    static get NITRO() {
        return 4;
    }

    constructor(id, duration) {
        this.id = id;
        this.duration = duration;
    }

    toObject(nickname) {
        return { durationTime: 60000, itemIndex: this.id, userID: nickname };
    }

}
exports.Effect = Effect;
