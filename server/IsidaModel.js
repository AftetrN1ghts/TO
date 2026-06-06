const WeaponModel = require("./WeaponModel"),
    { getDamage } = require("./server");

class IsidaModel extends WeaponModel {

    onData(socket, args) {
        if (this.battle === null || this.user === null)
            return;

        try {
            var data = JSON.parse(args[0]),
                killer = this.user,
                victim = this.battle.getUser(data.victimId),
                damage =  socket.tank.getProperties().turret.heal_rate / 2;

            if (victim !== null) {
                var mult = 1;
                if (killer.team_type === victim.team_type && killer.team_type !== "NONE")
                    mult = -0.6;

                damage *= mult;

                if (mult < 0 && victim.hasEffect(2))
                    damage *= 2;

                if (mult > 0)
                    victim.attack(killer, damage, socket.tank.garage.mounted_turret);
                else {
                    if (killer.hasEffect(3))
                        damage *= 2;

                    var maxHealth = victim.getMaxHealth(), health = victim.getHealth();

                    if (health < maxHealth) {
                        if ((maxHealth - health) < damage) {
                            damage = maxHealth - health;
                        }

                        killer.healAmount -= damage;
                        victim.setHealth(victim.getHealth() - damage);
                        victim.sendHealth();
                    }
                }

                if (mult === 1) {
                    if (killer.hasEffect(3))
                        damage *= 2;

                    if (victim.hasEffect(2))
                        damage /= 2;

                    killer.setHealth(killer.getHealth() + damage);
                    killer.sendHealth();
                }
            }
        }
        catch (e) {
            console.log(e);
        }
    }

}

module.exports = IsidaModel;