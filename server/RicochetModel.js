const WeaponModel = require("./WeaponModel"),
    { getDamage } = require("./server");

class RicochetModel extends WeaponModel {

    onData(socket, args) {
        if (this.battle === null || this.user === null)
            return;

        try {
            var data = JSON.parse(args[0]),
                damage = getDamage(this.name, this.modification),
                killer = this.user,
                user = this.battle.getUser(data.victimId);
  var tank = socket.tank;
  var owner = this.battle.getUser(tank.name);

            if (user !== null) {
                user.attack(killer, damage, socket.tank.garage.mounted_turret, owner.team_type.toUpperCase());
            }
            this.battle.broadcast("fire;" + this.user.nickname + ";" + args[0], [this.user.nickname]);
        }
        catch (e) {
            console.log(e);
        }
    }

}

module.exports = RicochetModel;