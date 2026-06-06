const WeaponModel = require("./WeaponModel"),
    { getDamage, distance } = require("./server");

class FreezeModel extends WeaponModel {

    onData(socket, args) {
        if (this.battle === null || this.user === null)
            return;

        try {
            var tank = socket.tank;
            var data = JSON.parse(args[0]);
               //var damage = getDamage(this.name, this.modification);
              var damage =  tank.getProperties().turret.damage_per_second / 2;
                
              var killer = this.user;
 

  var owner = this.battle.getUser(tank.name);


            for (var i in data.victims) {
                var victim = this.battle.getUser(data.victims[i]),
                    dist = distance(killer.position, victim.position);

                if (dist < 0 || dist > 3000)
                    return;

                if (victim !== null) {
                    var ticks = 1.5 + this.modification;

                    if (killer.hasEffect(3))
                        ticks *= 2;

                    if (victim.hasEffect(2))
                        ticks = Math.floor(ticks / 2);

                    victim.startFreezeTicks(killer, ticks, owner.team_type.toUpperCase());
                    victim.attack(killer, damage, socket.tank.garage.mounted_turret,owner.team_type.toUpperCase());
                }
            }
            this.battle.send2Users("fire;" + killer.nickname + ";" + args[1], [killer.nickname]);
        }
        catch (e) {
            console.log(e);
        }
    }

}

module.exports = FreezeModel;