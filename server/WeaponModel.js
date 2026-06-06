class WeaponModel {

    constructor(id, user, battle, data) {
        this.id = id;
        this.user = user;
        this.battle = battle;
        this.data = data;
        this.anticheat = 0;
        this.lastTick = null;
        this.extra = {};

        try {
            var parts = id.split("_");
            this.name = parts[0];
            this.modification = parseInt(parts[1][1]);
        } catch (e) {
            console.log(e);
        }
    }

    onData(socket, args) {
    }

}

module.exports = WeaponModel;