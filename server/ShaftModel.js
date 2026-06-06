const WeaponModel = require("./WeaponModel"),
	{
		getMaxDamage,
		getDamage
	} = require("./server");

class ShaftModel extends WeaponModel
{

	onData(socket, args)
	{
		if (this.battle === null || this.user === null) return;
		try
		{
			if (args[0] === "quick_shot_shaft" || args[0] === "shot_shaft")
			{
				var data = JSON.parse(args[1]),
					killer = this.user,
					user = this.battle.getUser(data.targets[0].target_id);
				if (args[0] === "quick_shot_shaft")
				{
					var damage = getDamage(this.name, this.modification);
					this.battle.broadcast("shaft_quick_shot;" + this.user.nickname + ";" + args[1]);
				}
				if (args[0] === "shot_shaft")
				{
					damage = getMaxDamage(this.name, this.modification) / 100 * (100 - data.energy / 10);
					this.battle.broadcast("fire;" + this.user.nickname + ";" + args[1]);
				}
			}
			if (user !== null || !isNaN(user) || user !== undefined) user.attack(killer, damage, socket.tank.garage.mounted_turret);

		}
		catch
		{}
	}
}

module.exports = ShaftModel;