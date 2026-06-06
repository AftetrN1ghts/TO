const WeaponModel = require("./WeaponModel"),
    { getDamage, distance } = require("./server");

class FirebirdModel extends WeaponModel {

    onData(socket, args) {
        if (this.battle === null || this.user === null)
            return;

        try {
            var data = JSON.parse(args[0]),
            tank = socket.tank,
                damage =  tank.getProperties().turret.damage_per_second / 2,
                killer = this.user
  var owner = this.battle.getUser(tank.name);

            for (var i in data.targetsIds) {
                var victim = this.battle.getUser(data.targetsIds[i]),
                    dist = distance(killer.position, victim.position);

                if (dist < 0 || dist > 1800)
                    return;

                if (victim !== null) {

                    if (victim.temperature !== 1 && victim.team_type !== owner.team_type) {
                        victim.temperature = 0.6;
                        victim.sendTemperature();
                    }

                    var ticks = 5;
                    if (this.modification === 1)
                        ticks = 7;

                    if (this.modification === 2)
                        ticks = 16;

                    if (this.modification === 3)
                        ticks = 20;

                    if (killer.hasEffect(3))
                        ticks *= 2;

                    if (victim.hasEffect(2))
                        ticks = Math.floor(ticks / 2);

                    victim.startFireTicks(killer, ticks, this.modification, owner.team_type.toUpperCase());

                    victim.attack(killer, damage, socket.tank.garage.mounted_turret,  owner.team_type.toUpperCase());
                }
            }
            this.battle.broadcast("fire;" + killer.nickname + ";" + args[1], [killer.nickname]);
        }
        catch (e) {
            console.log(e);
        }
    }

}

module.exports = FirebirdModel;