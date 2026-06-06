const WeaponModel = require("./WeaponModel"),
    { getDamage } = require("./server");

class RailgunModel extends WeaponModel {

    onData(socket, args) {
        if (this.battle === null || this.user === null)
            return;

        try {
            var tank = socket.tank;
            var data = JSON.parse(args[0]),
                damage = getDamage(this.id, this.modification),
                killer = this.user;

            for (var i in data.targets) {
                var user = this.battle.getUser(data.targets[i]);
                var owner = this.battle.getUser(tank.name);
                if (user !== null) {
                    user.attack(killer, damage, tank.garage.mounted_turret, owner.team_type.toUpperCase());
                }
            }
            this.battle.broadcast("fire;" + this.user.nickname + ";" + args[0], [this.user.nickname]);
        }
        catch (e) {
            console.log(e);
        }
    }

}

module.exports = RailgunModel;