const WeaponModel = require("./WeaponModel"),
    { getDamage } = require("./server");

class TerminatorModel extends WeaponModel {

    onData(socket, args) {
        if (this.battle === null || this.user === null)
            return;

        try {
            var data = JSON.parse(args[0]),
                damage = getDamage(this.id),
                killer = this.user;

            for (var i in data.targets) {
                var user = this.battle.getUser(data.targets[i]);
                if (user !== null) {
                    user.attack(killer, damage, socket.tank.garage.mounted_turret);
                }
            }
            this.battle.broadcast("fire;" + this.user.nickname + ";" + args[0], [this.user.nickname]);
        }
        catch (e) {
            console.log(e);
        }
    }

}

module.exports = TerminatorModel;