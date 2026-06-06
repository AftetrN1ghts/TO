const
{
	Effect
} = require("./Effect");
const
{
	mt_rand,
	c,
	send,
	isset,
	getKickback,
	getMass,
	getPower,
	getImpactForce,
	positionString,
	gun_data,
	getTankByName
} = require("./server"),
	RicochetModel = require("./RicochetModel"),
	FreezeModel = require("./FreezeModel"),
	RailgunModel = require("./RailgunModel"),
	TerminatorModel = require("./TerminatorModel"),
	IsidaModel = require("./IsidaModel"),
	ThunderModel = require("./ThunderModel"),
	SmokyModel = require("./SmokyModel"),
	TwinsModel = require("./TwinsModel"),
	FirebirdModel = require("./FirebirdModel");
ShaftModel = require("./ShaftModel"),
	SnowmanModel = require("./SnowmanModel"),
	SmokyXTModel = require("./SmokyXTModel");

class BattleUser
{


	static fromTank(tank, battle, team_type, score = 0)
	{
		return new BattleUser(tank, battle, tank.name, tank.rank, score, team_type);
	}

	constructor(tank, battle, nickname, rank, score, team_type, paid = false)
	{
		this.tank = tank;
		this.properties = tank.getProperties();
		this.health = this.getMaxHealth();
		this.incration = battle.incration_id++;
		this.battle = battle;
		this.nickname = nickname;
		this.rank = rank;
		this.score = score;
		this.helpersInKill = []
		this.team_type = team_type === null ? "NONE" : team_type;
		this.team = this.team_type.toLowerCase() === "blue";
		this.paid = paid;
		this.finished = false;
		this.position = {
			x: -500,
			y: -4500,
			z: 500
		};
		this.ready = false;
		this.state = null;
		this.kills = 0;
		this.deaths = 0;
		this.mines = {};
		this.healAmount = 0;
		this.mineCount = 0;
		this.rotation = {
			z: 0
		};
		this.effects = [];
		this.disable_effects = {};
		this.healEffect = {
			heal: 0,
			healPer: 0,
			ticks: 0,
			interval: null
		};
		this.fireEffect = {
			ticks: 0,
			killer: null,
			interval: null
		};
		this.freezeEffect = {
			ticks: 0,
			interval: null
		};
		this.temperature = 0;
		this.weaponModel = null;
		var socket = this.tank.getSocket();
		if (socket !== null)
		{
			/* var team = this.team_type.toLowerCase();
			 var points = this.battle.map.getSpawnPoints([team]);
			 var point = points[mt_rand(0, points.length - 1)];
			 this.position = point.position;
			 this.rotation = point.rotation;*/
		}

		this.dirty = false;
	}

	init()
	{
		if (this.battle === null)
			return false;

		var turret = this.tank.garage.mounted_turret,
			turret_parts = turret.split("_");

		if (!isset(gun_data[turret]))
			return false;

		if (turret_parts.length !== 2 || turret_parts[1].length !== 2)
			return false;

		var turret_id = turret_parts[0],
			turret_mod = parseInt(turret_parts[1][1]),
			data = gun_data[turret];
			

		switch (turret_id)
		{
			case "ricochet":
				this.weaponModel = new RicochetModel(turret, this, this.battle, data);
				break;
			case "frezee":
				this.weaponModel = new FreezeModel(turret, this, this.battle, data);
				break;
			case "railgun":
				this.weaponModel = new RailgunModel(turret, this, this.battle, data);
				break;
			case "railgunxt":
				this.weaponModel = new RailgunModel(turret, this, this.battle, data);
				break;
			case "terminator":
				this.weaponModel = new TerminatorModel(turret, this, this.battle, data);
				break;
			case "isida":
				this.weaponModel = new IsidaModel(turret, this, this.battle, data);
				break;
			case "thunder":
				this.weaponModel = new ThunderModel(turret, this, this.battle, data);
				break;
			case "smoky":
				this.weaponModel = new SmokyModel(turret, this, this.battle, data);
				break;
			case "twins":
				this.weaponModel = new TwinsModel(turret, this, this.battle, data);
				break;
			case "snowman":
				this.weaponModel = new SnowmanModel(turret, this, this.battle, data);
				break;
			case "flamethrower":
				this.weaponModel = new FirebirdModel(turret, this, this.battle, data);
				break;
			case "flamethrowerhell":
				this.weaponModel = new FirebirdModel(turret, this, this.battle, data);
				break;
			case "shaft":
				this.weaponModel = new ShaftModel(turret, this, this.battle, data);
				break;
			case "smokyxt":
				this.weaponModel = new SmokyXTModel(turret, this, this.battle, data);
				break;
		}
	}

	sendTemperature()
	{
		this.battle.send2Users("change_temperature_tank;" + this.nickname + ";" + this.temperature);
		if (this.temperature < 0)
			this.sendSpecs();
	}

	sendPacket()
	{
		return this.ready;
	}
	sendSpecs()
	{
		var props = this.properties,
			speed = c(props.hull.speed, 4.5),
			turnSpeed = c(props.hull.turn_speed, 1),
			turretRotationSpeed = c(props.turret.turret_turn_speed, 100) / 60;
		if (this.temperature < 0.1)
		{
			var freeze_multiplier = 1.1 + this.temperature;

			speed *= freeze_multiplier;
			turnSpeed *= freeze_multiplier;
			turretRotationSpeed *= freeze_multiplier;
		}
		if (this.hasEffect(4))
			speed *= 1.3;
		this.battle.broadcast("change_spec_tank;" + this.nickname + ";" + JSON.stringify(
		{
			turnSpeed: turnSpeed,
			turretRotationSpeed: turretRotationSpeed,
			speed: speed
		}));
	}

	newrank(rank)
	{
		this.rank = rank;
		if (this.battle !== null)
		{
			this.battle.broadcast("create_levelup_effect;" + this.nickname + ";" + rank);
			this.battle.updateStatisticsUser(this);
		}
	}

	reset(respawn)
	{
		if (this.tank === null)
		{
			if (this.battle !== null)
				this.battle.leave(this.nickname);

			return;
		}

		this.score = 0;
		this.kills = 0;
		this.deaths = 0;
		if (!respawn)
			this.battle.updateStatistics(this.nickname);
		var socket = this.tank.findSocket();
		if (respawn && socket !== null)
			send(socket, "local_user_killed");
		if (respawn)
			setTimeout(() =>
			{
				this.battle.prepareToSpawn(this);
			}, 2000);
	}

	getMaxHealth()
	{
		return parseFloat(this.properties.hull.armor);
	}

	getHealth()
	{
		return this.health;
	}

	getHealthProperty()
	{
		return (this.health / this.getMaxHealth()) * 10000;
	}

	setHealth(hp, limit = true)
	{
		this.health = hp;
		if (limit && this.health > this.getMaxHealth())
			this.health = this.getMaxHealth();

	}

	damage(hp)
	{
		this.health -= hp;
		if (hp <= 0)
		{
			this.kill();
		}
	}

	sendHealth()
	{
		this.battle.broadcast("change_health;" + this.nickname + ";" + this.getHealthProperty());
	}

	addMine(mine)
	{
		this.mines[mine.id] = mine;
	}

	removeMines()
	{
		if (this.battle === null)
			return;

		for (var i in this.mines)
			this.battle.removeMine(i);

		this.mines = {};
		this.battle.removeMines(this.nickname);
	}

	attack(killer, damage, turret, owner, friendlyFire = false)
	{

if(this.team_type.toUpperCase() !== owner || this.team_type.toUpperCase() === "NONE" && owner === "NONE" || killer.nickname === this.nickname || friendlyFire)

{
		if (this.battle === null || !this.isActive())
			return;

		if (this.hasEffect(2))
			damage /= 2;

		if (killer.hasEffect(3))
		{
			damage *= 2;
		}
		var props = this.properties;
		var turretId = turret.split("_");
		if (turretId[0] === "shaft" && c(props.paint.shaft_resistance, 100) !== 100)
		{
			damage = damage / 100 * (100 - c(props.paint.shaft_resistance, 100));
		}
		if (turretId[0] === "terminator" && c(props.paint.terminator_resistance, 100) !== 100)
		{
			damage = damage / 100 * (100 - c(props.paint.terminator_resistance, 100));
		}
		if (turretId[0] === "railgun" && c(props.paint.railgun_resistance, 100) !== 100)
		{
			damage = damage / 100 * (100 - c(props.paint.railgun_resistance, 100));
		}
		if (turretId[0] === "thunder" && c(props.paint.thunder_resistance, 100) !== 100)
		{
			damage = damage / 100 * (100 - c(props.paint.thunder_resistance, 100));
		}
		if (turretId[0] === "smoky" && c(props.paint.mech_resistance, 100) !== 100)
		{
			damage = damage / 100 * (100 - c(props.paint.mech_resistance, 100));
		}
		if (turretId[0] === "ricochet" && c(props.paint.ricochet_resistance, 100) !== 100)
		{
			damage = damage / 100 * (100 - c(props.paint.ricochet_resistance, 100));
		}
		if (turretId[0] === "twins" && c(props.paint.plasma_resistance, 100) !== 100)
		{
			damage = damage / 100 * (100 - c(props.paint.plasma_resistance, 100));
		}
		if (turretId[0] === "isida" && c(props.paint.vampire_resistance, 100) !== 100)
		{
			damage = damage / 100 * (100 - c(props.paint.vampire_resistance, 100));
		}
		if (turretId[0] === "frezee" && c(props.paint.freeze_resistance, 100) !== 100)
		{
			damage = damage / 100 * (100 - c(props.paint.freeze_resistance, 100));
		}
		if (turretId[0] === "flamethrower" && c(props.paint.fire_resistance, 100) !== 100)
		{
			damage = damage / 100 * (100 - c(props.paint.fire_resistance, 100));
		}
		if (turretId[0] === "mine" && c(props.paint.mine_resistance, 100) !== 100)
		{
			damage = damage / 100 * (100 - c(props.paint.mine_resistance, 100));
		}
				if (c(props.paint.armor, 100) !== 100)
		{
			damage = damage / 100 * (100 - c(props.paint.armor, 100));
		}
		this.setHealth(this.getHealth() - damage);
	 killer.tank.updateMissionProgress("damage", damage)
	        var killed = 0;
		this.sendHealth();
 var kill = 0;
		if (this.getHealth() <= 0 && killer.tank !== null)
		{
			this.battle.kill(this.nickname, killer);
			if (killer.nickname !== this.nickname)
				this.battle.killEvent(killer.tank);
			this.battle.deathEvent(this.tank);
                        killed = 1;
						kill = 1;
		}
		this.helpersInKill.push(killer.nickname);
		//console.log(this.helpersInKill);
		
	//	for (var i in this.helpersInKill)
	//	{
	//		console.log(i)
	//		this.battle.killHelpEvent(getTankByName(i))
	//	}
                this.battle.sendDamage(killer, this, damage, killed, kill);
	}}

	death()
	{
		this.state = "suicide";
		this.effects = [];
		for (var i in this.disable_effects)
		{
			clearTimeout(this.disable_effects[i]);
		}

		this.disable_effects = {};
		this.stopFireTick();
		if (this.temperature < 0)
		{
			this.temperature = 0;
			this.sendTemperature();
			this.sendSpecs();
		}
		if (Object.keys(this.mines).length !== 0)
			this.removeMines();
	}

	enableEffect(id, duration)
	{
		var effect = new Effect(id, duration);
		if (this.hasEffect(id))
			this.disableEffect(id);
		var battle = this.battle;
		if (battle !== null)
		{
			battle.effects.push(effect.toObject(this.nickname));
			this.effects.push(effect);
			this.disable_effects[id] = setTimeout(() =>
			{
				this.disableEffect(id);
			}, duration);
			battle.broadcast("enable_effect;" + this.nickname + ";" + id + ";" + duration);
			if (id === 4)
				this.sendSpecs();

			if (id === 1)
				this.startHeal();
		}
	}

	disableEffect(id)
	{
		var battle = this.battle;
		var effect = this.getEffect(id);
		if (battle !== null && effect !== null)
		{
			battle.broadcast("disnable_effect;" + this.nickname + ";" + id);
			for (var i in this.effects)
				if (this.effects[i].id === id)
					this.effects.splice(i, 1);
			if (isset(this.disable_effects[id]))
			{
				clearTimeout(this.disable_effects[id]);
				delete this.disable_effects[id];
			}

			if (id === 4)
				this.sendSpecs();

		}
	}

	startFreezeTicks(killer, ticks, owner)
	{
		if(this.team_type.toUpperCase() !== owner || this.team_type.toUpperCase() === "NONE" && owner === "NONE" || killer.nickname === this.nickname)

		{
		this.freezeEffect.ticks += ticks;

		if (this.freezeEffect.ticks > 10)
			this.freezeEffect.ticks = 10;

		this.stopFireTick();

		if (this.freezeEffect.interval === null)
		{
			this.freezeTick();
			this.freezeEffect.interval = setInterval(() =>
			{
				this.freezeTick();
			}, 1000);
		}
	}
	}

	stopFreezeTick()
	{
		if (this.freezeEffect.interval !== null)
		{
			clearInterval(this.freezeEffect.interval);
			this.freezeEffect.interval = null;
			this.freezeEffect.ticks = 0;
			if (this.temperature < 0)
			{
				this.temperature = 0;
				this.sendTemperature();
				this.sendSpecs();
			}
		}
	}

	freezeTick()
	{
		if (this.freezeEffect.ticks <= 0)
		{
			this.stopFreezeTick();
			return;
		}

		this.temperature = -0.1 * this.freezeEffect.ticks;
		this.sendTemperature();
		this.sendSpecs();

		--this.freezeEffect.ticks;
	}

	startFireTicks(killer, ticks, modification, owner)
	{
		if(this.team_type.toUpperCase() !== owner || this.team_type.toUpperCase() === "NONE" && owner === "NONE" || killer.nickname === this.nickname)

		{
		this.fireEffect.ticks += ticks;
		this.fireEffect.modification = modification;
		this.fireEffect.killer = killer;

		var maxTicks = 10;

		if (modification === 1)
			maxTicks = 14;
		else if (modification === 2)
			maxTicks = 16;
		else if (modification === 3)
			maxTicks = 20;

		if (this.fireEffect.ticks > maxTicks)
			this.fireEffect.ticks = maxTicks;

		this.stopFreezeTick();

		this.temperature = 0.04 * this.fireEffect.ticks;
		this.sendTemperature();

		if (this.fireEffect.interval === null)
		{
			this.fireTick();
			this.fireEffect.interval = setInterval(() =>
			{
				this.fireTick();
			}, 500);
		}
	}}

	stopFireTick()
	{
		if (this.fireEffect.interval !== null)
		{
			clearInterval(this.fireEffect.interval);
			this.fireEffect.interval = null;
			this.fireEffect.killer = null;
			this.fireEffect.modification = -1;
			if (this.temperature > 0)
			{
				this.temperature = 0;
				this.sendTemperature();
			}
		}
	}

	fireTick()
	{
		if (this.fireEffect.ticks <= 0 || this.fireEffect.killer.dirty || this.temperature <= 0)
		{
			this.stopFireTick()
			return;
		}

		var damage = 1;

		if (this.fireEffect.modification === 1)
			damage = 2;
		else if (this.fireEffect.modification === 2)
			damage = 3;
		else if (this.fireEffect.modification === 3)
			damage = 4;

		this.attack(this.fireEffect.killer, damage, "flamethrower_m4");

		--this.fireEffect.ticks;
	}

	startHeal()
	{
		var maxHealth = this.getMaxHealth();

		this.healEffect.heal = maxHealth;
		this.healEffect.healPer = 30;
		this.healEffect.ticks = Math.ceil(maxHealth / 30);

		if (this.healEffect.interval === null)
		{
			this.healTick();
			this.healEffect.interval = setInterval(() =>
			{
				this.healTick();
			}, 750);
		}
	}

	stopHeal()
	{
		if (this.healEffect.interval !== null)
		{
			clearInterval(this.healEffect.interval);
			this.healEffect.interval = null;
			this.disableEffect(1);
		}
	}

	healTick()
	{
		if (this.healEffect.heal <= 0 || this.healEffect.ticks <= 0)
		{
			this.stopHeal();
			return;
		}

		this.setHealth(this.getHealth() + this.healEffect.healPer);
		this.sendHealth();

		this.healEffect.heal -= this.healPer;

		if (this.getHealth() >= this.getMaxHealth())
			this.healEffect.heal = 0;

		--this.healEffect.ticks;
	}

	getEffect(id)
	{
		for (var i in this.effects)
			if (this.effects[i].id === id)
				return this.effects[i];
		return null;
	}

	hasEffect(id)
	{
		return this.getEffect(id) !== null;
	}

	spawn()
	{
		if (this.battle == null)
			return;
		var obj = this.toObject3();
		this.state = "invisible";
		this.setHealth(this.getMaxHealth());
		this.battle.send2Users("change_health;" + this.nickname + ";" + this.getHealthProperty());
		this.battle.send2Users("spawn;" + JSON.stringify(
		{
			turn_speed: obj.turn_speed,
			rot: this.rotation.z,
			x: this.position.x,
			tank_id: this.nickname,
			health: this.getHealthProperty(),
			y: this.position.y,
			incration_id: this.incration,
			team_type: this.team_type.toUpperCase(),
			z: this.position.z,
			turret_rotation_speed: obj.turret_turn_speed,
			speed: obj.speed
		}));
		setTimeout(() =>
		{
			//this.activate();
		}, 3500);
	}

	activate()
	{
		this.state = "active";
		this.battle.send2Users("activate_tank;" + this.nickname);
	}

	isActive()
	{
		return this.state === "active";
	}

	toObject(param1 = false)
	{
if(param1)
{
		return {
			kills: this.score / 10,
			nickname: this.nickname,
			rank: this.rank,
			team_type: this.team_type
		};
	}
	else
	return {
		kills: this.score,
		nickname: this.nickname,
		rank: this.rank,
		team_type: this.team_type
	};
	}

	toObject1()
	{
		return this.team_type;
	}

	toObject2()
	{
		return {
			nickname: this.nickname,
			rank: this.rank,
			teamType: this.team_type
		};
	}

	toObject3(state_null = false)
	{
		var props = this.properties;
                var hull =this.tank.garage.mounted_hull;

		return {
			kickback: getKickback(this.tank.garage.mounted_turret),
			turn_speed: c(props.hull.turn_speed, 1),
			battleId: this.battle.id,
			turret_turn_speed: c(props.turret.turret_turn_speed, 100) / 60,
			mass: getMass(this.tank.garage.mounted_hull),
			tank_id: this.nickname,
			health: this.getHealthProperty(),
			turret_id: this.tank.garage.mounted_turret,
			speed: c(props.hull.speed, 4.5),
			incration: this.incration,
			impact_force: getImpactForce(this.tank.garage.mounted_turret),
			nickname: this.nickname,
			rank: this.rank,
			state_null: state_null,
			team_type: this.team_type.toUpperCase(),
			position: positionString(this.position) + "@" + this.rotation.z,
			state: this.state,
			power: getPower(this.tank.garage.mounted_hull),
			turret_rotation_accel: 0,
			colormap_id: this.tank.garage.mounted_paint,
			hull_id: hull,
        
                      
    

		};
	}

}

exports.BattleUser = BattleUser;