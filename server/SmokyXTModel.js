const WeaponModel = require("./WeaponModel"),
    { getDamage, mt_rand } = require("./server");

class SmokyXTModel extends WeaponModel {

    onData(socket, args) {
        if (this.battle === null || this.user === null)
            return;

        try {
            this.anticheat++;
            setTimeout(() => {
                this.anticheat--;
                if(this.anticheat > 1)
                {
                    this.battle.send(tank.socket, "battle;kick_by_cheats");
                    tank.socket.destroy();
                    
                }
             }, 1000);
            var data = JSON.parse(args[0]),
                damage = getDamage(this.name, this.modification),
                killer = this.user,
                user = this.battle.getUser(data.victimId),
                critical = 5 + this.modification;
        var tank = socket.tank;
                var owner = this.battle.getUser(tank.name);

            if (user !== null) {

                if (mt_rand(0, 100) < critical) {
                    damage *= 3;
                    this.battle.broadcast("create_critical_hit_effect;" + user.nickname);
                }

                user.attack(killer, damage, socket.tank.garage.mounted_turret, owner.team_type.toUpperCase(), this.battle.getFriendlyFire()	);
            }
            this.battle.send2Users("fire;" + this.user.nickname + ";" + args[0], [this.user.nickname]);
        }
        catch (e) {
            console.log(e);
        }
    }

}


module.exports = SmokyXTModel;