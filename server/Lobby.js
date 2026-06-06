const
{
	market_list,
	shop_data
} = require("./server");
const Area = require("./Area.js"),
	{
		playerJson,
		battle_items,
		send
	} = require("./server");
var CTFBattle,
	TDMBattle,
	DMBattle,
	DOMBattle,
	ASLBattle,
	effect_model = {
		effects: []
	};

class Lobby extends Area
{

	constructor()
	{
		super();
		this.battles = [];
		this.chat = require("./LobbyChat");
		this.battle_count = 0;
this.anticheat = 0;


	}
	createBattles()
	{
		if (this.battles.length === 0)
		{
	    	var battle = new DMBattle(true, "Sandbox DM", "map_sandbox", 2700, 11, 1, 9, 75, false, false);
            this.battles.push(battle);
            this.broadcast("create_battle;" + JSON.stringify(battle.toObject()));

            var battle2 = new TDMBattle(true, "Arena TDM", "map_arena", 3600, 5, 1, 9, 120, false, false);
            this.battles.push(battle2);
            this.broadcast("create_battle;" + JSON.stringify(battle2.toObject()))

            var battle3 = new DMBattle(true, "Boombox DM", "map_boombox", 2700, 11, 10, 16, 75, false, false);
            this.battles.push(battle3);
            this.broadcast("create_battle;" + JSON.stringify(battle3.toObject()));

		}
	}
//battle;init_mines;{"mines":[]}

	getChat()
	{
		return this.chat;
	}

	getPrefix()
	{
		return "lobby";
	}
getBattles(socket, tank)
	{
var arr = [];

			for (var i in this.battles)
			{
				arr.push(this.battles[i].toObject());
			}

			var sub = false;
			if (tank !== null)
			{
				sub = tank.garage.hasItem("no_supplies");
				tank.garage.removePlayer(tank.name);
				this.addPlayer(tank);
			}

			setTimeout(() =>
			{
				this.send(socket, "init_battle_select;" + JSON.stringify(
				{
					haveSubscribe: sub,
					battles: arr,
					items: battle_items
				}));
			}, 100);
}
	findBattle(id)
	{
		for (var i in this.battles)
			if (this.battles[i].battleId === id)
				return this.battles[i];

		return null;
	}

	/**
	 * Removes a battle.
	 * 
	 * @param {string} battleId
	 * 
	 * @returns boolean
	 */
	removeBattle(battleId)
	{
		for (var i in this.battles)
		{
			if (this.battles[i].battleId === battleId)
			{
				this.battles.splice(i, 1);
				this.broadcast("remove_battle;" + battleId);
				this.createBattles();
				return true;

			}
		}

		return false
	}

	initEffectModel(socket)
	{
		this.send(socket, "init_effect_model;" + JSON.stringify(effect_model));
		this.createBattles();
	}

	onData(socket, args)
	{
		var battles = this.battles,
			battle_count = this.battle_count,
			tank = socket.tank;
		if (tank === null)
		{
			socket.destroy();
			return;
		}

		if (args.length === 1 && args[0] === "get_data_init_battle_select")
		{
			var arr = [];

			for (var i in this.battles)
			{
				arr.push(this.battles[i].toObject());
			}

			var sub = false;
			if (tank !== null)
			{
				sub = tank.garage.hasItem("no_supplies");
				tank.garage.removePlayer(tank.name);
				this.addPlayer(tank);
			}

			setTimeout(() =>
			{
				this.send(socket, "init_battle_select;" + JSON.stringify(
				{
					haveSubscribe: sub,
					battles: arr,
					items: battle_items
				}));
			}, 100);
		}
		if (args.length === 1 && args[0] === "get_rating")
		{
			this.send(socket, "open_rating;" + JSON.stringify(
			{
				crystalls: [
				{
					"count": tank.crystals,
					"rank": tank.rank,
					"id": tank.name
				}]
			}));

		}
		else if (args.length === 1 && args[0] === "show_quests")
		{

		
			this.send(socket, "show_quests;" + JSON.stringify(tank.getCurrentMission()));
		}
		else if (args.length === 1 && args[0] === "get_friends")
		{
			this.send(socket, "init_friends_list;" + JSON.stringify(
			{
				"incoming": [],
				"outcoming": [],
				"friends": [{"battleId":"","rank":30,"online":true,"id":"null"}]
			}));
		}
		else if (args[0] === "user_inited")
		{
			tank.getCurrentMission();
		}
		else if (args.length === 3 && args[0] === "zabrat_priz")
		{
			this.send(socket, "show_quests_bonus;" + JSON.stringify(
			{
				prizes: [
				{
					"count": args[2],
					"nameId": args[1]
				}]
			}));
			tank.crystals = Number(tank.crystals) + Number(args[2]);
			tank.sendCrystals();
		}
		else if (args[0] === "change_quest")
		{
			if(tank.crystals > 10 * tank.rank)
			{

			tank.updateMission(args[1]);
			tank.crystals = Number(tank.crystals) - Number(10 * tank.rank);
			tank.sendCrystals();
			this.send(socket, "show_new_quests;" + JSON.stringify(tank.getCurrentMission()));
			}
			else
			{this.send(socket, "server_message;Вам не хватает кристаллов на смену задания")

			}
		}
		else if (args[0] === "сlean_quest")
		{
			tank.cleanMission(args[1]);
			this.send(socket, "show_new_quests;" + JSON.stringify(tank.getCurrentMission()));
		}
		else if (args[0] === "zadanki_zdelani")
		{
			this.send(socket, "show_crystalls;3700");
			tank.crystals = Number(tank.crystals) + Number(3700);
			tank.sendCrystals();
		}
		else if (args[0] === "shop_buy_item")
		{
			this.send(socket, "navigate_url;https://www.donationalerts.com/r/kingtanksofficial");
		}
		else if (args[0] === "get_shop")
		{
			this.send(socket, "open_shop;" + JSON.stringify(shop_data));
		}
		else if (args.length === 1 && args[0] === "show_profile")
		{
			this.send(socket, "show_profile;" + JSON.stringify(
			{
				isComfirmEmail: false,
				emailNotice: false
			}));
		}
		else if (args.length === 1 && args[0] === "show_discount")
		{
			this.send(socket, "show_discount_window;mayhew, успей купить вещь Рельса ХТ со скидкой 70%\nПредложение будет действовать 30 секунд!;railgunxt_m0;70");

		}
		else if (args.length === 2 && args[0] === "try_create_battle_ctf")
		{
			if (tank.rank > 3)
			{
				try
				{
					var data = JSON.parse(args[1]);
					var battle = new CTFBattle(false, data.gameName, data.mapId, data.time, data.numPlayers, data.minRang, data.maxRang, data.numFlags, !data.inventory, data.autoBalance, data.frielndyFire, data.pay, false);
					this.battles.push(battle);
					this.broadcast("create_battle;" + JSON.stringify(battle.toObject()));
					console.log(tank.name + " создал битву " + data.gameName );
				}
				catch (e)
				{
					console.log(e);
				}
			}
			else
			{
				this.send(socket, "server_message;Создавать битвы можно со звания Капрал")
			}
		}
		else if (args.length === 2 && args[0] === "try_create_battle_dom")
		{
			if (tank.rank > 3)
			{
				try
				{
					var data = JSON.parse(args[1]);
					var battle = new DOMBattle(false, data.gameName, data.mapId, data.time, data.numPlayers, data.minRang, data.maxRang, data.numPointsScore, !data.inventory, data.autoBalance, data.frielndyFire, data.pay, false);
					this.battles.push(battle);
					this.broadcast("create_battle;" + JSON.stringify(battle.toObject()));
					console.log(tank.name + " создал битву " + data.gameName );
				}
				catch (e)
				{
					console.log(e);
				}
			}
			else
			{
				this.send(socket, "server_message;Создавать битвы можно со звания Капрал")
			}
		}

		else if (args.length === 2 && args[0] === "try_create_battle_tdm")
		{
			if (tank.rank > 3)
			{
				try
				{
					var data = JSON.parse(args[1]);
					var battle = new TDMBattle(false, data.gameName, data.mapId, data.time, data.numPlayers, data.minRang, data.maxRang, data.numKills, !data.inventory, data.autoBalance, data.frielndyFire, data.pay);
					this.battles.push(battle);
					this.broadcast("create_battle;" + JSON.stringify(battle.toObject()));
					console.log(tank.name + " создал битву " + data.gameName );
				}
				catch (e)
				{
					console.log(e);
				}
			}
			else
			{
				this.send(socket, "server_message;Создавать битвы можно со звания Капрал")
			}
		}
		else if (args[0] === "try_create_battle_dm")
		{
			if (tank.rank > 3)
			{
				try
				{
					var battle = new DMBattle(false, args[1], args[2], args[3], args[5], args[6], args[7], args[4], args[10] === "false", args[9] === "true");
					this.battles.push(battle);
					this.broadcast("create_battle;" + JSON.stringify(battle.toObject()));
					console.log(tank.name + " создал битву в режиме DM ");
				}
				catch (e)
				{
					console.log(e);
				}

			}
			else
			{
				this.send(socket, "server_message;Создавать битвы можно со звания Капрал")
			}
		}
		else if (args.length === 2 && args[0] === "get_show_battle_info")
		{
			for (var i in battles)
			{
				if (battles[i].battleId === args[1])
				{
					this.send(socket, "show_battle_info;" + JSON.stringify(battles[i].toDetailedObject(tank)));
				}

			}

		}
		else if (args.length === 2 && (args[0] === "enter_battle_spectator"))
		{
			var battle = this.findBattle(args[1]);

			if (battle !== null)
				battle.addSpectator(tank);
		}
		else if (args[3] !== "null" && args.length === 3 && (args[0] === "enter_battle_team"))
		{

			var battle = this.findBattle(args[1]);

			if (battle !== null)
			{
				this.anticheat++;
				setTimeout(() => {
				if(this.anticheat > 1)
				{
					this.send(tank.socket, "battle;kick_by_cheats");
					tank.socket.destroy();
				}
			}, 50);
			setTimeout(() => {
				this.anticheat--;
			}, 1000);
				var type = args[2] === "false" ? "BLUE" : "RED";
				send(socket, "lobby;start_battle");
				var user = battle.addPlayer(tank, type);

				if (user !== null)
					this.broadcast("add_player_to_battle;" + JSON.stringify(
					{
						kills: user.kills,
						battleId: args[2],
						name: tank.name,
						rank: tank.rank,
						id: tank.name,
						type: type
					}));

			}
		}
		else if (args[3] !== "null" && args.length === 3 && (args[0] === "enter_battle"))
		{
			var battle = this.findBattle(args[1]);
			send(socket, "lobby;start_battle");

			if (battle !== null && battle.getTeamCount() === 1)
			{
				var user = battle.addPlayer(tank);
				if (user !== null)
					this.broadcast("add_player_to_battle;" + JSON.stringify(
					{
						kills: user.kills,
						battleId: args[2],
						name: tank.name,
						rank: tank.rank,
						id: tank.name,
						type: "NONE"
					}));
			}
		}
		else if (args.length === 2 && args[0] === "check_battleName_for_forbidden_words")
		{
			send(socket, "lobby;check_battle_name;" + args[1]);
		}
		else if (args.length === 1 && args[0] === "get_garage_data")
		{
			var tank = socket.tank;
			if (tank !== null)
			{
				setTimeout(() =>
				{
					tank.garage.initiate(socket);
					this.initEffectModel(socket);

					if (this.hasPlayer(tank.name))
						this.removePlayer(tank.name);
				}, 1000);
			}
		}
	}

}

module.exports = new Lobby();

CTFBattle = require("./CTFBattle");
TDMBattle = require("./TDMBattle");
DMBattle = require("./DMBattle");
DOMBattle = require("./DOMBattle");
ASLBattle = require("./ASLBattle");