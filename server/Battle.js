const Area = require("./Area.js");
const
{
	BattleUser
} = require("./BattleUser");
const
{
	Map
} = require("./Map");
const BonusBox = require("./BonusBox");
const BonusRegion = require("./BonusRegion");
const Garage = require("./Garage");
const
{
	mt_rand,
	send,
	isset,
	shots_data,
	sfx_data,
	oppositeTeam,
	getTankByName
} = require("./server");
const lobby = require("./Lobby");
const
{
	Mine
} = require("./Mine");

class Battle extends Area
{

	constructor(system, name, map_id, type, time, max_people, min_rank, max_rank, limit, bonuses, autoBalance, friendlyFire, pro)
	{

		super();

		////////////////////////////////////////////

		this.name = name;
		this.mapId = map_id;
		this.battleId = mt_rand(9000, 90000) + "@" + name + "@#" + lobby.battle_count++;


		this.map = new Map(map_id);
		this.countPeople = 0;
		this.maxPeople = max_people;
		this.min_rank = min_rank;
		this.max_rank = max_rank;
		this.limit = limit;
		this.bonuses = bonuses;
		this.isPaid = pro;
		this.system = system;

		////////////////////////////////////////////#battle16791@Island CTF@#2

		this.previewId = this.mapId + "_preview";

		if (this.bonuses)
		{
			this.tickingRegions = [];
			var regions = this.map.getBonusRegions(["medkit", "nitro", "damageup", "armorup"]);

			for (var i in regions)
				this.tickingRegions.push(new BonusRegion(regions[i]));

			setInterval(() =>
			{
				this.update(1);
			}, 1000);
		}

		////////////////////////////////////////////

		this.users = {};
		this.spectators = {};
		this.team = false;
		this.empty = true;
		this.emptyTime = 0;
		this.fund = 0;
		// init_effects;{"effects":[{"durationTime":60000,"itemIndex":4,"userID":"noder"},{"durationTime":60000,"itemIndex":3,"userID":"noder"},{"durationTime":60000,"itemIndex":2,"userID":"noder"},{"durationTime":60000,"itemIndex":2,"userID":"DenPLay"},{"durationTime":60000,"itemIndex":4,"userID":"DenPLay"},{"durationTime":60000,"itemIndex":2,"userID":"maks24"},{"durationTime":60000,"itemIndex":2,"userID":"canya"}]}end~
		this.effects = [];
		this.temp_leaves = [];
		this.type = type;
		try
		{
			time = parseInt(time);
		}
		catch (e)
		{
			time = 900;
		}
		this.timeLimit = time;
		this.time = time + Math.floor(Date.now() / 1000);
		this.mines = [];
		this.crystalCounter = 0;
		this.goldCounter = 0;
		this.spinCounter = 0;
		this.rubyCounter = 0;
		this.armorCounter = 0;
		this.damageCounter = 0;
		this.nitroCounter = 0;
		this.prizeCounter = 0;
		this.healthCounter = 0;
		this.bonus_dropped = [];
		this.bonuses_dropped = 0;
		this.incration_id = 0;
	}

	getPrefix()
	{
		return "battle";
	}

	getType()
	{
		return type.toLowerCase();
	}

	isDM()
	{
		return false;
	}

	isCTF()
	{
		return false;
	}

	isTDM()
	{
		return false;
	}

	isDOM()
	{
		return false;
	}

	getTeamCount()
	{
		return 1;
	}

	addFund(fund)
	{
		this.fund += fund;
		this.goldCounter += fund;
		this.spinCounter += fund;
		this.rubyCounter += fund;
		this.crystalCounter += fund;
		this.armorCounter += fund;
		this.damageCounter += fund;
		this.nitroCounter += fund;
		this.healthCounter += fund;
		this.prizeCounter += fund;
		for (; this.crystalCounter >= 22; this.crystalCounter -= 22)
        {
            this.dropBonus("crystal", mt_rand(1, 2));
        }
        for (; this.armorCounter >= 60; this.armorCounter -= 60)
        {
            this.dropBonus("armorup", 1);
        }
        for (; this.damageCounter >= 50; this.damageCounter -= 50)
        {
            this.dropBonus("damageup", 1);
        }
        for (; this.healthCounter >= 75; this.healthCounter -= 75)
        {
            this.dropBonus("medkit", 1);
        }
        for (; this.crystalCounter >= 20; this.crystalCounter -= 20)
        {
            this.dropBonus("crystal", 1);
        }
        for (; this.nitroCounter >= 50; this.nitroCounter -= 50)
        {
            this.dropBonus("nitro", 1);
        }
        var goldchance = mt_rand(925, 3800);
		var tchance = mt_rand(2000000000, 80000000000000);
		for (; this.goldCounter >= goldchance; this.goldCounter -= goldchance)
		{
			this.spawnGold();
		}
		for (; this.rubyCounter >= tchance; this.rubyCounter -= tchance)
		{
			this.spawnRuby();
		}
		this.sendFund();
	}

	sendFund()
	{
		this.send2Users("change_fund;" + this.fund);
	}

	dropBonusCommand(disappearing_time, x, y, z, bonus_id)
	{
		this.send2Users("spawn_bonus;" + JSON.stringify(
		{
			disappearing_time: disappearing_time,
			x: x,
			y: y,
			z: z,
			id: bonus_id
		}));
	}

	dropBonus(id, count = 1, position = null)
	{
		try
		{
			var box = new BonusBox(id, null);

			if (!box.isValid())
				return;

			if (position === null)
				var regions = this.map.getBonusRegions([box.getXMLName()]),
					region;

			for (var i = 0; i < count; i++)
			{
				box = new BonusBox(id, null);

				if (position === null && regions[0].length !== 0)
				{
					var region = regions[mt_rand(0, regions.length - 1)];
					var x = mt_rand(region.min.x, region.max.x);
					y = mt_rand(region.min.y, region.max.y);
					z = mt_rand(region.min.z, region.max.z);
					if (box.getXMLName() === "gold" || "ruby")
					{
						z += 600;
					}

				}
				else
					var x = position.x,
						y = position.y,
						z = position.z;

				box.updateBonusId(this.bonuses_dropped++);
				this.bonus_dropped.push(box);
				this.dropBonusCommand(box.disappearing_time, x, y, z, box.bonus_id);
			}
			return true;
		}
		catch (e)
		{
			console.error(e);
		}
	}

	removeBonus(bonus_id)
	{
		for (var i in this.bonus_dropped)
		{
			if (this.bonus_dropped[i].id === bonus_id)
			{
				this.send2Users("remove_bonus;" + bonus_id);
				this.bonus_dropped.splice(i, 1);
			}
		}
	}

	attemptTakeBonus(id, tank)
	{
		for (var i in this.bonus_dropped)
		{
			if (this.bonus_dropped[i].bonus_id === id)
			{
				var a = id.split("_");
				a.pop();
				this.bonusTaken++;
				this.onBonusTaken(tank, a.join("_"));
				this.send2Users("take_bonus_by;" + id);
				this.bonus_dropped.splice(i, 1);
				return true;
			}
		}
		console.log("return false on attemptTakeBonus()");
		return false;
	}

	update(deltaTime)
	{
		for (var i in this.bonus_dropped)
		{
			if (this.bonus_dropped[i].canDisappear())
				this.removeBonus(this.bonus_dropped[i].id);
		}

		for (var index in this.tickingRegions)
		{
			this.tickingRegions[index].update(deltaTime);
		}

		if (this.timeLeft() <= 0 && this.timeLeft() > -1000000 && !this.finished)
			this.finish();

		if (this.empty && !this.system)
		{
			this.emptyTime++;
			if (this.emptyTime >= 60)
				lobby.removeBattle(this.battleId);
		}
	}

	spawnGold()
	{
		this.send2Users("gold_spawn");
		setTimeout(() =>
		{
			this.dropBonus("crystal100", 1);
		}, mt_rand(25000, 35000));
	}
	spawnRuby()
	{
		this.send2Users("ruby_spawn");
		setTimeout(() =>
		{
			this.dropBonus("crystal500", 1);
		}, mt_rand(25000, 35000));
	}
	spawnSpin()
	{
		this.send2Users("spin_spawn");
		setTimeout(() =>
		{
			this.dropBonus("spin", 1);
		}, mt_rand(25000, 35000));
	}

	onBonusTaken(tank, bonus)
	{
		tank.updateMissionProgress("takeBonus", 1);
		if (bonus === "crystall")
		{
			tank.crystals += 10;
			tank.sendCrystals();
		}
		else if (bonus === "gold")
		{
			tank.crystals += 1000;
			tank.sendCrystals();
			tank.updateMissionProgress("takeBonusGold", 1);
			this.send2Users("user_log;" + tank.name + ";gold box");
		}
		else if (bonus === "spin")
		{
			tank.crystals += 10;
			tank.sendCrystals();
			this.send2Users("user_log;" + tank.name + ";взял спин");
		}
		else if (bonus === "ruby")
		{
			var cryss = mt_rand(500, 2500);
			tank.crystals += cryss;
			tank.sendCrystals();
			this.send2Users("user_log;" + tank.name + ";взял таинственный ящик и получил " + cryss + " кристаллов");
			this.send2Users("user_log;secret");
		}
		else if (bonus === "prize")
		{
			var udacha = 2022;
			tank.crystals += udacha;
			tank.sendCrystals();
			this.send2Users("user_log;" + tank.name + ";взял подарок и получил " + udacha + " кристаллов!");
		}
		else if (bonus === "armor")
		{
			if (tank.user !== null)
			{
				tank.user.enableEffect(2, 40000);
			}
		}
		else if (bonus === "damage")
		{
			if (tank.user !== null)
			{
				tank.user.enableEffect(3, 40000);
			}
		}
		else if (bonus === "nitro")
		{
			if (tank.user !== null)
			{
				tank.user.enableEffect(4, 40000);
				tank.user.sendSpecs();
			}
		}
		else if (bonus === "health")
		{
			if (tank.user !== null)
			{
				tank.user.enableEffect(1, 10000);
			}
		}
	}

	leave(username)
	{
		var user = this.getUser(username);
		if (user === null)
			return;

		this.countPeople--;
		this.updateCount();
		this.send2Users("remove_user;" + username);
		//user.dirty = true;
		this.removePlayer(username);
		this.removeUser(username);

		if (this.isEmpty())
			this.empty = true;
	}

	isEmpty()
	{
		return Object.keys(this.players).length === 0 && Object.keys(this.spectators).length === 0;
	}

	send2Users(message)
	{
        for (var i in this.users) {
			if(this.users[i].ready)
			{
				
				            var socket = this.users[i].tank.socket;
            if (socket !== null) {
                this.send(socket, message);
            }
		}
        }
		
	this.broadcastSpectators(message)
    }


	temp_leave(username)
	{
		var user = this.getUser(username);
		if (user !== null)
		{if (this.isCTF())
			{
			this.deathEvent(getTankByName(username))
			}
			this.broadcast("remove_user;" + username);
			user.dirty = true;
			

			setTimeout(() =>
			{
				if (user.dirty)
				{

					for (var i in this.users)
					{
						if (this.users[i].nickname === username)
						{
							this.users[i].battleId = null;
							this.users[i].battle = null;
							if (this.users[i].team_type.toLowerCase() === "blue")

								this.bluePeople--;
							else if (this.users[i].team_type.toLowerCase() === "red")
								this.redPeople--;

						}
					}
					this.removeUser(username);
					this.removePlayer(username);
					this.countPeople--;
					this.updateCount();
					lobby.broadcast("remove_player_from_battle;" + JSON.stringify(
					{
						battleId: this.battleId,
						id: username
					}));

					if (this.isEmpty())
						this.empty = true;
				}
			  
			}, 90000);
		}
	}

	rejoin(tank)
	{
		var user = this.getUser(tank.name);
		if (user !== null)
		{
			user.dirty = false;
			tank.user = user;
			user.tank = tank;
			super.addPlayer(tank);
		}
	}

	kill(nickname, killer = null)
	{
		if (killer === null)
			this.send2Users("kill_tank;" + nickname + ";suicide");
		else
			this.send2Users("kill_tank;" + nickname + ";killed;" + killer.nickname);
			if(killer !== null)
			{
			var tank = getTankByName(killer.nickname);
			tank.updateMissionProgress("killTank", 1)
			}
		if (nickname === "Hulk")
		{
			this.spawnGold();
			this.spawnGold();
			this.spawnGold();
		}
	}

	killEvent(tank)
	{
		var user = tank.user;
		if (user !== null)
		{
			var isLowRank = 1;
			if (tank.rank === 30)
			{
				isLowRank = 2;
			}

			var score = 10 * (tank.garage.hasItem("up_score") ? 1.5 : 1);



			user.kills++;
			user.score += 10;
			if (this.isDM())
			{
				this.checkLimitDM(user.score / 10);
			}
if (this.isTDM())
			{
				tank.updateMissionProgress("gainBattleScoresInTDM", 10);
				this.checkLimitDM(user.score / 10);
			}
			if (this.isCTF())
			{
				tank.updateMissionProgress("gainBattleScoresInCTF", 10);
			}
			this.updateStatisticsUser(user);
			tank.addScore(score);



			var fund = 3;
            if (tank.rank > 6)
            {
                fund = 5;
            }
            if (tank.rank > 11)
            {
                fund = 6;
                        }
            if (tank.rank > 22)
            {
                fund = 7;
            }
            this.addFund(fund);
		}
	}

	killHelpEvent(tank)
	{
		var user = tank.user;
		if (user !== null)
		{
			var isLowRank = 1;
			if (tank.rank === 30)
			{
				isLowRank = 2;
			}

			var score = 5;



		
			user.score += 5;
			
			this.updateStatisticsUser(user);
			tank.addScore(score);



			var fund = 1;
            if (tank.rank > 6)
            {
                fund = 1.5
            }
            if (tank.rank > 11)
            {
                fund = 2;
                        }
            if (tank.rank > 22)
            {
                fund = 2.5;
            }
            this.addFund(fund);
		}
	}

	deathEvent(tank, restart = false)
	{
		var user = tank.user;
		if (user !== undefined && user !== null)
		{
			this.send(tank.getSocket(), "local_user_killed");
			user.death();
			if (!restart)
				user.deaths++;
			this.updateStatisticsUser(user);
			setTimeout(() =>
			{
				if (!user.dirty) this.prepareToSpawn(user);
			}, 3000);
		}
	}

	getUser(username)
	{
		if (this.hasUser(username))
			return this.users[username]


		return null;
	}

	hasUser(username)
	{
		return typeof(this.users[username]) !== "undefined";
	}

	addUser(tank)
	{
		this.users[tank.name] = tank;
		tank.battleId = this.battleId;
	}

	removeUser(username)
	{
		if (this.hasUser(username))
			delete this.users[username];
	}

	getSpectator(username)
	{
		if (this.hasSpectator(username))
			return this.spectators[username];

		return null;
	}

	hasSpectator(username)
	{
		return typeof(this.spectators[username]) !== "undefined";
	}

	updateSpectatorsList()
	{
		this.broadcastSpectators("update_spectator_list;" + Object.keys(this.spectators).join(", "));
	}

	addSpectator(tank)
	{
		if (tank.getSocket() === null)
			return;

		this.spectators[tank.name] = tank;
		tank.spectateBattleId = this.id;
		tank.battle = this;
		this.initiate(tank.getSocket(), true);
		this.updateSpectatorsList();

		this.empty = false
		this.emptyTime = 0;
	}

	removeSpectator(username)
	{
		if (this.hasSpectator(username))
		{
			this.spectators[username].spectateBattleId = null;
			this.spectators[username].battle = null;
			delete this.spectators[username];
			this.updateSpectatorsList();
		}

		if (this.isEmpty())
			this.empty = true;
	}

	updateStatistics(username)
	{
		var user = this.getUser(username);
		if (user !== null)
			this.updateStatisticsUser(user);
	}

	updateStatisticsUser(user)
	{
		this.send2Users("update_player_statistic;" + JSON.stringify(this.getStatisticsUser(user)));
	}

	updateCount()
	{
		lobby.broadcast("update_count_users_in_dm_battle;" + this.battleId + ";" + this.countPeople);
	}

	getStatistics(nickname)
	{
		var user = this.getUser(nickname);
		if (user !== null)
			return {
				kills: user.kills,
				score: user.score,
				rank: user.rank,
				team_type: user.team_type.toUpperCase(),
				id: user.nickname,
				deaths: user.deaths
			};
		return null;
	}

	getStatisticsUser(user)
	{
		return {
			kills: user.kills,
			score: user.score,
			rank: user.rank,
			team_type: user.team_type.toUpperCase(),
			id: user.nickname,
			deaths: user.deaths
		};
	}

	prepare_to_spawn(nickname)
	{
		var user = this.getPlayer(nickname);
		if (user !== null)
		{
			this.prepareToSpawn(user);
		}
	}

	prepareToSpawn(user)
	{
		if (user.tank === null)
			return;

		var socket = user.tank.getSocket();
		if (socket !== null)
		{
			var team = user.team_type.toLowerCase();
			if (team === "none")
				team = "dm";
			var points = this.map.getSpawnPoints([team]);
			var point = points[mt_rand(0, points.length - 1)];
			if (point.position === null)
			{
				user.position = {
					x: 52.298,
					y: 70.51,
					z: 900
				};
				user.rotation = {
					z: 7.854
				};
				console.error("На карте нет респов");
			}
			else
			{
				user.position = point.position;
				user.rotation = point.rotation;
			}
			setTimeout(() =>
			{
				if (!user.dirty)
					user.spawn();
			}, 5000);
			this.send(socket, "prepare_to_spawn;" + user.nickname + ";" + point.position.x + "@" + point.position.y + "@" + point.position.z + "@" + point.rotation.z);
		}
	}

	initShotsData(socket)
	{
		this.send(socket, "init_shots_data;" + JSON.stringify(shots_data));
		this.send(socket, "init_sfx_data;" + JSON.stringify(sfx_data));
	}

	initBattleModel(socket, spectator = false)
	{
		this.send(socket, "init_battle_model;" + JSON.stringify(this.map.toObject(spectator)));
	}

	initEffects(socket)
	{
		this.send(socket, "init_effects;" + JSON.stringify(
		{
			effects: []
		}));
	}

	initCTFModel(socket)
	{
		if (this.isCTF())
			this.send(socket, "init_ctf_model;" + JSON.stringify(this.toCTFObject()));
	}

	initDOMModel(socket)
	{
		try
		{

			initdommodel:
			{

				if (this.isDOM())
				{
					try
					{
						var dataToSend = JSON.stringify(this.toDOMObject());
						this.send(socket, "init_dom_model;" + dataToSend);
						sendDOMModel = true;
						return;
					}
					catch
					{}
					break initdommodel;
				}
			}
		}
		catch
		{}
	}

	initInventory(socket, tank)
	{
		if(this.bonuses)
			{

		var inventory = tank.getInventory();
		var obj = {
			items: []
		};
		for (var i in inventory)
			obj.items.push(inventory[i].toObject());
		this.send(socket, "init_inventory;" + JSON.stringify(obj));
	}
	}

	initGraffitis(socket, tank)
	{

	}

	initiate(socket, spectator = false)
	{
		setTimeout(() =>
		{
			this.initShotsData(socket);
			this.initBattleModel(socket, spectator);
		}, 1000);
	}

	initiateLocal(socket, user, tank, spectator = false)
	{
		var nickname = tank.name;
		this.initCTFModel(socket);
		this.initDOMModel(socket);
		this.send(socket, "init_gui_model;" + JSON.stringify(this.toGUIObject(user)));
		setTimeout(() =>
		{
		for (var i in this.users)
		{
			if (i !== nickname && !this.users[i].dirty)
			{
				this.send(socket, "init_tank;" + JSON.stringify(this.users[i].toObject3()));
				this.send(socket, "update_player_statistic;" + JSON.stringify(this.getStatisticsUser(this.users[i])));
			}
		}
	}, 500);
		if (!spectator)
			this.initInventory(socket, tank);
		this.initGraffitis(socket, tank);
		this.send(socket, "init_mine_model;" + JSON.stringify((new Mine()).toObject()));
		var minesObjects = [];

		for (var i in this.mines)
		{
			minesObjects = this.mines[i].toInitObject();
		}

		var mines = {
			mines: [minesObjects]
		};
		this.send(socket, "init_mines;" + JSON.stringify(mines));
		if (!spectator)
		{
			user.init();
			this.broadcast("init_tank;" + JSON.stringify(user.toObject3(true)));
			this.updateStatisticsUser(user);
			user.ready = true
		}
		this.initEffects(socket);
		
	}

	putMine(user, position)
	{
		var mine = new Mine(user, position);
		this.mines.push(mine);
		user.addMine(mine);
		mine.put();

		this.send2Users("put_mine;" + JSON.stringify(mine.toObject()));
	}


	broadcast(message, senders = [])
	{
		super.broadcast(message, senders);

		for (var i in this.spectators)
		{
			var socket = this.spectators[i].socket;
			if (socket !== null && !senders.includes(i))
			{
				this.send(socket, message);
			}
		}
	}
	broadcastSpectators(message, senders = [])
	{
		for (var i in this.spectators)
		{
			var socket = this.spectators[i].socket;
			if (socket !== null && !senders.includes(i))
			{
				this.send(socket, message);
			}
		}
	}

	getFriendlyFire()
	{
		return this.friendlyFire
	}
	getMine(id)
	{
		for (var i in this.mines)
			if (this.mines[i].id === id)
				return this.mines[i];
		return null;
	}

	removeMine(mineId)
	{
		if (isset(this.mines[mineId]))
		{
			delete this.mines[mineId];
		}
	}

	removeMines(username)
	{
		this.send2Users("remove_mines;" + username);
	}

	sendDamage(killer, victim, damage, killed, kill)
	{
		if (!killer.dirty)
			this.send(killer.tank.getSocket(), "damage_tank;" + victim.nickname + ";" + damage + ";" + killed) + ";" + kill;
	}

	addPlayer(tank, team = null, score = 0)
	{
		if (tank.socket === null)
			return null;

		super.addPlayer(tank);
		this.countPeople++;
		this.updateCount();
		var user = BattleUser.fromTank(tank, this, (team === null ? "NONE" : team), score);

		this.users[tank.name] = user;
		tank.user = user;
		tank.battle = this;
		tank.battleId = this.battleId;

		this.empty = false;
		this.emptyTime = 0;

		this.initiate(tank.socket);

		return user;
	}
	addBot(bot)
	{
		tank = getTankByName(bot);
		super.addPlayer(tank);
		this.countPeople++;
		this.updateCount();
		var user = BattleUser.fromTank(tank, this, (team === null ? "NONE" : team), score);

		this.users[tank.name] = user;
		tank.user = user;
		tank.battle = this;
		tank.battleId = this.battleId;

		this.empty = false;
		this.emptyTime = 0;

		this.initiate(tank.socket);

		return user;
	}


	startFire(tank)
	{
		this.send2Users("start_fire;" + tank.name, [tank.name]);
	}

	stopFire(tank)
	{
		this.send2Users("stop_fire;" + tank.name, [tank.name]);
	}

	onData(socket, tank, args)
	{
		var nickname = tank.name,
			user = this.getUser(nickname),
			spectator = (this.getSpectator(nickname) !== null);
		if (user === null && !spectator)
			return;

		if (args.length === 1)
		{
			if (args[0] === "get_init_data_local_tank")
			{
				
				user.state = "suicide";
				this.initiateLocal(socket, user, tank);

				setTimeout(() =>
				{
					this.prepareToSpawn(user);
				}, 1000);

				return true;
			}
			else if (args[0] === "suicide")
			{
				this.kill(tank.name, null);
				this.deathEvent(tank);
			}
			else if (args[0] === "activate_tank")
			{
				if (user.weaponModel !== null)
				{
					user.activate();
				}
			}
			else if (args[0] === "ping")
			{
				this.send(socket, "pong")
			}
			else if (args[0] === "i_exit_from_battle")
			{
				if (!spectator)
				{
					this.leave(tank.name);
					tank.leaveBattle();
					lobby.broadcast("remove_player_from_battle;" + JSON.stringify(
					{
						battleId: this.battleId,
						id: tank.name
					}));
					tank.battleId = null;
				}
				else
				{
					this.removeSpectator(tank.name);
				}
				lobby.chat.initiate(tank);
			}
			else if (args[0] === "stop_fire")
			{
				this.stopFire(tank);

				if (user.healAmount > 0)
				{
					var score = Math.floor(user.healAmount / 10);
					if (score > 0)
					{
						user.score += score;
						
						this.updateStatisticsUser(user);
						tank.addScore(score * (tank.garage.hasItem("up_score") ? 1.5 : 1));
					}
					user.healAmount = 0;
				}
			}
			else if (args[0] === "spectator_user_init" && spectator)
			{

				this.initiateLocal(socket, null, tank, true);

				return true;
			}
		}
		else if (args.length === 3)
		{
			if (args[0] === "flag_return")
			{
				try
				{
					if (this.isCTF())
					{
						this.returnFlag(args[1], args[2]);
					}
				}
				catch (e)
				{
					console.log(e);
				}
			}
			else if (args[0] === "activate_graffiti")
			{
				this.send2Users("create_graffiti;" + args[1] + ";" + args[2])
			}
			else if (args[0] === "chat")
			{
				var message = args[1];
				if (message[0] === "/")
				{
					message = message.substr(1, message.length - 1);
					var args = message.split(" ");
					this.processCommand(tank, args.shift(), args);
				}
				else
				{
					this.processMessage(tank, message, spectator);
				}
			}
		}
		else if (args.length === 5)
		{
			if (args[0] === "move")
			{
				var data = args[1];
				var position = {},
					orient = {},
					line = {},
					angle = {},
					turretDir = 0,
					ctrlBits = 0;
				var a = data.split('@');
				if (a.length === 12)
				{
					position.x = parseFloat(a[0]);
					position.y = parseFloat(a[1]);
					position.z = parseFloat(a[2]);
					orient.x = parseFloat(a[3]);
					orient.y = parseFloat(a[4]);
					orient.z = parseFloat(a[5]);
					line.x = parseFloat(a[6]);
					line.y = parseFloat(a[7]);
					line.z = parseFloat(a[8]);
					angle.x = parseFloat(a[9]);
					angle.y = parseFloat(a[10]);
					angle.z = parseFloat(a[11]);
					turretDir = parseFloat(args[2]);
					ctrlBits = parseInt(args[3]);
					user.position = position;
					user.orient = orient;
					user.line = line;
					user.angle = angle;
					user.turretDir = turretDir;
					user.ctrlBits = ctrlBits;
					this.send2Users("move;" + JSON.stringify(
					{
						ctrlBits: ctrlBits,
						turretDir: turretDir,
						orient: orient,
						line: line,
						angle: angle,
						tank_id: tank.name,
						position: position
					}), [tank.name], false);
				}
			}
			else if (args[0] === "attempt_to_take_flag")
			{
				if (this.isCTF())
					this.attemptTakeFlag(args[1], tank);
			}
			else if (args[0] === "tank_capturing_point")
			{
				if (this.isDOM())
					this.startCapturingPoint(args[1], tank);
			}
			else if (args[0] === "activate_item")
			{
				if (!user.isActive())
					return;

				var ids = {
					"health": 1,
					"n2o": 4,
					"double_damage": 3,
					"armor": 2,
					"mine": 5
				};
				if (isset(ids[args[1]]))
				{

					if (args[1] === "mine")
						this.putMine(user,
						{
							x: args[2],
							y: args[3],
							z: args[4]
						});

					this.send(socket, "activate_item;" + args[1]);
					if (args[1] !== "mine")

						user.enableEffect(ids[args[1]], 60000);
					else
						user.enableEffect(ids[args[1]], 30000);

					if (args[1] === "n2o")
						tank.user.sendSpecs();
				}
				tank.garage.useItem(args[1])
			}
		}
		/*else if (args.length === 6){
		           
		       }*/
		else if (args.length === 2)
		{
			if (args[0] === "attempt_to_take_bonus")
			{
				try
				{
					var a = args[1].split("}");
					a.pop();
					var data = JSON.parse(a.join("}") + "}");
					this.attemptTakeBonus(data.bonus_id, tank);
				}
				catch (e)
				{
					console.log(e);
				}
			}
			else if (args[0] === "flag_drop")
			{
				try
				{
					if (this.isCTF())
						this.drop(oppositeTeam(user.team_type), JSON.parse(args[1]));

					setTimeout(() =>
					{
						this.returnFlagSystem(user.team_type);
					}, 10000);

				}
				catch (e)
				{
					console.log(e);
				}
			}
			else if (args[0] === "tank_leave_capturing_point")
			{
				if (this.isDOM())
					this.stopCapturingPoint(args[1], tank);
			}
			else if (args[0] === "fire")
			{
				this.send2Users("пздидпвд")
				if (user.weaponModel !== null)
				{
					switch (tank.garage.mounted_turret.split("_")[0].toLowerCase())
					{
						case "shafft":
							break;
						default:
							args.shift();
					}
					user.weaponModel.onData(socket, args);
				}
			}
			else if (args[0] === "quick_shot_shaft")
			{
				if (user.weaponModel !== null)
				{
					user.weaponModel.onData(socket, args);
				}
			}
			else if (args[0] === "shot_shaft")
			{
				if (user.weaponModel !== null)
				{
					user.weaponModel.onData(socket, args);
				}
			}
			else if (args[0] === "mine_hit")
			{
				var mine = this.getMine(args[1]);
				if (mine !== null && mine.user !== null)
				{
					this.send2Users("hit_mine;" + args[1] + ";" + tank.name);
					var damage = mt_rand(130, 200);

					if (mine.user.hasEffect(3))
						damage /= 2;

					user.attack(mine.user, damage, "mine_m0");
					this.removeMine(args[1]);
				}
			}
			else if (args[0] === "check_md5_map")
			{
				var hash = args[1];
				/*
				if (this.map.md5_hash !== hash)
				    this.send(socket, "kick_for_cheats");
				else
				    this.send(socket, "init_tank");*/
			}
		}
		if (args.length > 0 && args[0] === "start_fire")
		{
			if (args.length === 1)
			{
				this.startFire(tank);
			}
			else if (args.length === 2)
			{
				try
				{
					switch (tank.garage.mounted_turret.split("_")[0].toLowerCase())
					{
						case "isida":
							var target_data = JSON.parse(args[1]),
								target_name = target_data.victimId,
								target = this.getUser(target_name),
								type;
							if (target === null)
								type = "idle";
							else
							{
								if (user.team_type !== "NONE" && user.team_type === target.team_type)
									type = "heal";
								else
									type = "damage";
							}
							user.healAmount = 0;
							this.send2Users("start_fire;" + tank.name + ";" + JSON.stringify(
							{
								shooterId: tank.name,
								targetId: target_name,
								type: type
							}), [tank.name]);
							break;
						case "twins":
							this.send2Users("start_fire_twins;" + tank.name + ";" + args[1], [tank.name]);
							break;
						case "ricochet":
							this.send2Users("start_fire;" + tank.name + ";" + args[1], [tank.name]);
							break;
						case "terminator":
							this.send2Users("start_fire_terminator;" + tank.name + ";" + args[1], [tank.name]);
							break;
					}
				}
				catch (e)
				{}
			}
		}
	}

	ShaftQuickShot(socket, tank, args)
	{
		this.getUser(tank.name).weaponModel.onData(socket, args);
		console.log("Battle: ShaftQuickShot");
	}

	processMessage(tank, message, spectator = false)
	{

		if (tank.isSponsor())
		{
			var chatPerm = 10
		}
		if (tank.isModerator())
		{
			var chatPerm = 1
		}

		if (tank.isOwner())
		{
			var chatPerm = 3
		}

		if (!spectator)
		{
			if (tank.banTime < new Date().getTime())
			{
				this.send2Users("chat;" + JSON.stringify(
				{
					system: false,
					nickname: tank.name,
					rank: tank.rank,
					team_type: "NONE",
					message: message,
					chat_level: chatPerm
				}));
			}
			else
			{
				this.sendSystem(tank, "Вы отключены от чата. Вы вернётесь в ЭФИР через " + Math.round((tank.banTime - new Date().getTime()) / 1000 / 60) + " минут(ы). Причина: " + tank.banReason);
			}
		}
		else if (tank.isOwner())
		{
			this.send2Users("spectator_message;" + message);
		}
	}

	processCommand(tank, command, args)
	{
		if (tank.isModerator())
		{
			switch (command)
			{
				case "spawnbonus":
					if (tank.isAdmin())
					{
						if (args.length < 1)
						{
							this.sendSystem(tank, "Not Enough Arguments!");
							return;
						}

						var drop_type = args[0],
							amount;

						try
						{
							console.log('\x1b[35m%s\x1b[0m',' > ' + tank.name + " cбросил " + amount + " " + args[0])
							if (args.length === 1)
								amount = 1;
							else
								amount = parseInt(args[1]);
						}
						catch (e)
						{
							this.sendSystem(tank, "Invalid Amount!");
							return;
						}

						this.dropBonus(drop_type, amount);
						this.sendSystem(tank, "Dropped " + amount + " " + drop_type + "(s)");
					}
					break;
				case "ruby":
					if (tank.isAdmin())
					{
						this.spawnRuby();
						console.log('\x1b[35m%s\x1b[0m',' > ' + tank.name + " вызвал сирену ТГолда")
						return;
					}
				case "gold":
					if (tank.isAdmin())
					{
						this.spawnGold();
						console.log('\x1b[35m%s\x1b[0m',' > ' + tank.name + " вызвал сирену Голда")
						return;
					}
				case "addfund":
					if (tank.isAdmin())
					{
						if (args.length < 1)
						{
							this.sendSystem(tank, "Not Enough Arguments!");
							return;
						}

						try
						{
							amount = parseInt(args[0]);
						}
						catch (e)
						{
							this.sendSystem(tank, "Invalid Amount!");
							return;
						}

						this.addFund(amount);
						this.sendSystem(tank, "Added " + amount + " Fund.");
					}
					break;
					case "warn":

						var reason = args[1];
						for (var i = 2; i < args.length; i++)
						{
							reason += " " + args[i];
						}
						if (tank.isOwner() || tank.isSponsor() || tank.isModerator())
						{
		
							if (args.length < 2)
							{
								this.sendSystem("Чё-то не-то!!\nНадо вот так: /warm <НИК> <ПРИЧИНА>");
							}
		
							var tank = getTankByName(args[0]);
							if (tank !== null)
							{


								this.send2Users("chat;" + JSON.stringify(
								{
									system: true,
									message: "Танкист " + args[0] + " предупреждён! " + "Причина: " + reason
								}));
								return "Успешно"
							}
						}
						break;
					case "banminutes":

						var reason = args[1];
						for (var i = 2; i < args.length; i++)
						{
							reason += " " + args[i];
						}
						if (tank.isOwner() || tank.isSponsor() || tank.isModerator())
						{
		
							if (args.length < 2)
							{
								this.sendSystem("Чё-то не-то!!\nНадо вот так: /banminutes <НИК> <ПРИЧИНА>");
							}
		
							var tank = getTankByName(args[0]);
							if (tank !== null)
							{

								tank.banTime = new Date().getTime() + 300000;
								tank.banReason = reason;
								this.send2Users("chat;" + JSON.stringify(
								{
									system: true,
									message: "Танкист " + args[0] + " лишен права выхода в эфир НА 5 МИНУТ. " + "Причина: " + reason
								}));
								return "Успешно"
							}
						}
						break;
						case "banhour":

						var reason = args[1];
						for (var i = 2; i < args.length; i++)
						{
							reason += " " + args[i];
						}
						if (tank.isOwner() || tank.isSponsor() || tank.isModerator())
						{
		
							if (args.length < 2)
							{
								this.sendSystem("Чё-то не-то!!\nНадо вот так: /banhour <НИК> <ПРИЧИНА>");
							}
		
							var tank = getTankByName(args[0]);
							if (tank !== null)
							{

								tank.banTime = new Date().getTime() + 300000 * 12;
								tank.banReason = reason;
								this.send2Users("chat;" + JSON.stringify(
								{
									system: true,
									message: "Танкист " + args[0] + " лишен права выхода в эфир НА 1 ЧАС. " + "Причина: " + reason
								}));
								return "Успешно"
							}
						}
						break;
						case "banday":

						var reason = args[1];
						for (var i = 2; i < args.length; i++)
						{
							reason += " " + args[i];
						}
						if (tank.isOwner() || tank.isSponsor() || tank.isModerator())
						{
		
							if (args.length < 2)
							{
								this.sendSystem("Чё-то не-то!!\nНадо вот так: /banday <НИК> <ПРИЧИНА>");
							}
		
							var tank = getTankByName(args[0]);
							if (tank !== null)
							{

								tank.banTime = new Date().getTime() + 300000 * 12 * 24;
								tank.banReason = reason;
								this.send2Users("chat;" + JSON.stringify(
								{
									system: true,
									message: "Танкист " + args[0] + " лишен права выхода в эфир НА 1 ДЕНЬ. " + "Причина: " + reason
								}));
								return "Успешно"
							}
						}
						break;
						case "banweek":

						var reason = args[1];
						for (var i = 2; i < args.length; i++)
						{
							reason += " " + args[i];
						}
						if (tank.isOwner() || tank.isSponsor() || tank.isModerator())
						{
		
							if (args.length < 2)
							{
								this.sendSystem("Чё-то не-то!!\nНадо вот так: /banweek <НИК> <ПРИЧИНА>");
							}
		
							var tank = getTankByName(args[0]);
							if (tank !== null)
							{

								tank.banTime = new Date().getTime() + 300000 * 12 * 24 * 7;
								tank.banReason = reason;
								this.send2Users("chat;" + JSON.stringify(
								{
									system: true,
									message: "Танкист " + args[0] + " лишен права выхода в эфир НА 1 НЕДЕЛЮ. " + "Причина: " + reason
								}));
								return "Успешно"
							}
						}
						break;
				case "finish":
					if (tank.isAdmin() || tank.isModerator())
					{
						if (!this.finished)
							this.finish();
						this.sendSystem(tank, "Finished Battle Successfully.");
					}
					break;
				default:
					var result = lobby.chat.processCommand(tank, command, args);

					if (result !== null)
						this.sendSystem(tank, result);
					break;
			}
		}
	}

	sendSystem(tank, message)
	{
		if (tank.socket === null)
			return;

		this.send(tank.socket, "chat;" + JSON.stringify(
		{
			system: true,
			nickname: null,
			rank: 0,
			team_type: "NONE",
			message: message
		}));
	}

	restart()
	{
		this.time = this.timeLimit + Math.floor(Date.now() / 1000);
		this.fund = 0;
		this.mines = [];
		this.crystalCounter = 0;
		this.goldCounter = 0;
		this.rubyCounter = 0;
		this.bonuses_dropped = [];
		this.finished = false;
		this.send2Users("battle_restart;" + this.timeLimit);
		for (var i in this.users)
			this.users[i].reset(true);
	}

	finish()
	{
		var battle = lobby.findBattle(this.battleId);
		if (battle === null || battle === undefined || battle === NaN)
			return;

		console.log('\x1b[35m%s\x1b[0m', ' > ' + "Battle: finish");

		if (battle.isDM)
		{
			var
			{
				timeToRes,
				users
			} = this.toFinishObject();
		}
		else
		{
			var
			{
				timeToRes,
				users
			} = battle.TeamBattle.toFinishObject();
		}

		for (var i in users)
		{
			try
			{
				var tank = getTankByName(users[i].id);
				var prize = users[i].prize;
				console.log(users[i].id + " " + prize);
				if (prize > 0)
				{
					tank.crystals += prize;
					tank.sendCrystals();
				}
			}
			catch
			{
				continue;
			}
		}

		this.send2Users("battle_finish;" + JSON.stringify(this.toFinishObject()));
		setTimeout(() =>
		{
			this.restart();
		}, 10000);
		this.finished = true;
	}

	timeLeft()
	{
		if (this.timeLimit <= 0)
			return -1558533165;

		return this.time - Math.floor(Date.now() / 1000);
	}

	userPaid(username)
	{
		var user = this.getUser(username);

		if (user !== null)
			return user.paid;

		return false;
	}

	toUserArray(details = true)
	{
		var new_arr = [];

		for (var i in this.users)
			new_arr.push(details ? this.users[i].toObject(this.isDM()) : this.users[i].toObject2());

		return new_arr;
	}

	toMinesObject()
	{
		return {
			mines: this.mines
		};
	}

	toTDMObject()
	{}

	toDMObject()
	{}
	toDOMObject()
	{}

	toGUIObject(user)
	{
		return {
			timeLimit: this.timeLimit,
			fund: this.fund,
			name: this.name,
			score_blue: 0,
			currTime: this.timeLeft(),
			team: this.team,
			scoreLimit: this.limit,
			score_red: 0,
			users: this.toUserArray(false)
		};
	}

	toDetailedObject(tank)
	{
		return {
			paidBattle: this.isPaid,
			battleId: this.battleId,
			users_in_battle: this.toUserArray(),
			killsLimit: this.limit,
			autobalance: this.autobalance,
			frielndyFie: this.friendlyFire,
			withoutBonuses: !this.bonuses,
			type: this.type,
			fullCash: true,
			timeLimit: this.timeLimit,
			scoreRed: 0,
			scoreBlue: 0,
			timeCurrent: this.timeCurrent,
			minRank: this.min_rank,
			name: this.name,
			spectator: tank.roles.includes("owner") || tank.roles.includes("moderator"),
			userAlreadyPaid: this.userPaid(tank.name),
			maxPeople: this.maxPeople,
			previewId: this.previewId,
			maxRank: this.max_rank
		};
	}

	toFinishObject()
	{
		console.log('\x1b[35m%s\x1b[0m', ' > ' + "Battle: toFinishObject");

		var users = this.users,
			sumScore = 0,
			prizes = {};

		if (users.length <= 0)
			return {
				time_to_restart: 10000,
				users: []
			};


		for (var i in users)
			sumScore += users[i].kills;

		if (sumScore === 0)
		{
			sumScore = users.length;
			for (var i in users)
			{
				users[i].score = 1;
				users[i].scoreZero = true;
			}
		}

		for (var i in users)
			prizes[users[i].nickname] = Math.round((users[i].kills / sumScore) * this.fund);

		var userRewards = [];
		for (var i in users)
		{
			userRewards.push(
			{
				kills: users[i].kills,
				score: users[i].scoreZero ? 0 : users[i].score,
				rank: users[i].rank,
				team_type: "NONE",
				id: users[i].nickname,
				prize: isset(prizes[users[i].nickname]) ? prizes[users[i].nickname] : 0,
				deaths: users[i].deaths
			});
		}

		return {
			time_to_restart: 10000,
			users: userRewards
		};
	}

	toObject()
	{
		return {
			isPaid: this.isPaid,
			battleId: this.battleId,
			countPeople: this.countPeople,
			redPeople: 0,
			minRank: this.min_rank,
			name: this.name,
			mapId: this.mapId,
			team: this.team,
			type: this.type,
			bluePeople: 0,
			maxPeople: this.maxPeople,
			previewId: this.previewId,
			maxRank: this.max_rank
		};
	}

}

module.exports = Battle;