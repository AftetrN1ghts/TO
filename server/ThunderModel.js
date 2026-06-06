const WeaponModel = require("./WeaponModel"),
    { getDamage, getMinDamage } = require("./server");

class ThunderModel extends WeaponModel {

    onData(socket, args) {
        if (this.battle === null || this.user === null)
            return;

        try {
            var tank = socket.tank;
            var data = JSON.parse(args[0]),
                damage = getDamage(this.id),
                minDamage = getMinDamage(this.name, this.modification),
                killer = this.user;

            if (data.mainTargetId !== null) {
                var user = this.battle.getUser(data.mainTargetId);
                if (user !== null) {
                    user.attack(killer, damage, tank.garage.mounted_turret,  this.battle.getUser(tank.name).team_type.toUpperCase());
                }
            }

            if (data.splashTargetIds !== null) {
                for (var i in data.splashTargetIds) {
                    var user = this.battle.getUser(data.splashTargetIds[i]);
                    if (user !== null) {
                        user.attack(killer, minDamage, tank.garage.mounted_turret,  this.battle.getUser(tank.name).team_type.toUpperCase());
                    }
                }
            }
            this.battle.broadcast("fire;" + this.user.nickname + ";" + args[0], [this.user.nickname]);
        }
        catch (e) {
            console.log(e);
        }
    }

}

module.exports = ThunderModel;