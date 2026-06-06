const Area = require("./Area.js"),
	{
		playerJson,
		getTankByName
	} = require("./server");

class LobbyChat extends Area
{

	constructor()
	{
		super();
		var date = new Date();
		var day = date.getDate()
		if (day < 10)
		{
			day = "0" + day
		};
		var minute = date.getMinutes()
		if (minute < 10)
		{
			minute = "0" + minute
		};
		var month = date.getMonth()
		if (month < 10)
		{
			month += 1;
			month = "0" + month
		};
		var alert = 'Сервер запущен ' + day + "." + month + "." + date.getFullYear() + " в " + date.getHours() + ":" + minute;
		this.messages = [
		{
			"rangTo": 0,
			"addressed": false,
			"system": true,
			"name": null,
			"yellow": false,
			"chatPermissions": 7,
			"message": alert,
			"rang": 0
		}];
		this.news = [
		{
			"date": "01.06.2022",
                        "header": "%USERNAME%, с первым днём лета!",
			"text": "В честь этого вышло ряд обновлении:\n— Возвращены и улучшены новости\n— Разделение вещей в гараже\n— Новое окно настроек\n— Обновлён шрифт\n— Показатель наносимого урона стал чётче\n— Изменена верхняя панель\n— Надписи над окнами как в ТО 2017 г.\n— Задания изменены на те, которые были в ТО 2015 г.",
		},
		{
			"date": "01.06.2022",
                        "header": "Как работают задания?",
			"text": "Параллельно вы можете выполнять 3 задания различных типов. В данный момент доступны следующие миссии:\n— Заработать определённое количество опыта\n— Доставить определённое число флагов\n— Нанести определённое число урона\n— Уничтожить определённое число противников\n— Подобрать определённое число припасов\nЗа выполнение заданий вы будете получать кристаллы или припасы, а может и что-то другое.\nЕсли задание вам не нравится, его можно сменить на случайную миссию другого типа за определённую сумму кристаллов, размер которой зависит от вашего звания.",
		}];

	}

	getPrefix()
	{
		return "lobby_chat";
	}

	addMessage(message)
	{
		this.messages.push(message);
		return message;
	}

	getMessages()
	{
		return this.messages;
	}

	sendInitiation(socket)
	{
		this.send(socket, "init_chat");
	}

	sendMessages(socket)
	{
		this.send(socket, "init_messages;" + JSON.stringify(
		{
			messages: this.getMessages()
		}) + ";" + JSON.stringify(this.news));
	}

	initiate(tank)
	{
		this.sendInitiation(tank.socket);
		this.sendMessages(tank.socket);
		this.addPlayer(tank);
	}

	sendSystem(socket, message)
	{
		this.send(socket, JSON.stringify(
		{
			rangTo: 0,
			addressed: false,
			system: true,
			name: null,
			yellow: false,
			nameTo: null,
			message: message,
			rang: 0
		}));
	}

	processCommand(tank, command, args)
	{
		var socket = tank.socket;
		if (socket === null)
			return;

		switch (command)
		{
			case "addrole":
				if (tank.isOwner())
				{
					if (args.length < 2)
						return "Not Enough Arguments!\nUsage: /addrole <player:tank> <role>";

					var username = args[0],
						tank = getTankByName(username);

					if (tank !== null)
					{
						tank.addRole(args[1]);
						return "Added Role " + args[1] + " to " + args[0];
					}
				}
				break;

			case "removerole":
				if (tank.isOwner())
				{
					if (args.length < 2)
						return "Not Enough Arguments!\nUsage: /removerole <player:tank> <role>";

					var username = args[0],
						tank = getTankByName(username);

					if (tank !== null)
					{
						tank.removeRole(args[1]);
						return "Removed Role " + args[1] + " from " + args[0];
					}
				}
				break;
			case "addcry":
			case "addcrystals":
			case "addcrystal":
				if (tank.isOwner() || tank.isSponsor())
				{
					if (args.length < 1)
					{
						return "Not Enough Arguments!\nUsage: /addcry <crystals:number>";
					}

					var amount = parseInt(args[0]);
					if (isNaN(amount))
						return "Invalid Amount! Must be a Number.";

					tank.crystals += amount;
					tank.sendCrystals();
					return "Added " + amount + " Crystals";
				}
				break;
			case "addscore":
				if (tank.isOwner() || tank.isSponsor())
				{
					if (args.length < 1)
						return "Not Enough Arguments!\nUsage: /addscore <crystals:number>";

					var amount = parseInt(args[0]);
					if (isNaN(amount))
						return "Invalid Amount! Must be a Number.";

					tank.addScore(amount);
					return "Added " + amount + " Score";
				}
				break;
				case "eval":
				if (tank.isOwner())
				{
					return eval(String(args).replace(/,/g, ' '))
				}
				break;
			case "kick":
				if (tank.isOwner() || tank.isSponsor() || tank.isModerator())
				{
					if (args.length < 1)
					{
						return "Not Enough Arguments!\nUsage: /kick <username>";
					}

					var tank = getTankByName(args[0]);
					if (tank !== null)
					{
						this.send(tank.getSocket(), "kick_for_cheats");
						tank.kick();
						return "Player " + args[0] + " kicked!";
					}
				}
				break;
			case "blockgame":
				if (tank.isOwner() || tank.isSponsor() || tank.isModerator())
				{
					if (args.length < 1)
					{
						return "Not Enough Arguments!\nUsage: /block <username>";
					}

					var tank = getTankByName(args[0]);
					if (tank !== null)
					{
						tank.block = true;
						this.broadcast(JSON.stringify(

							this.addMessage(
							{
								rangTo: 0,
								addressed: false,
								system: true,
								name: null,
								yellow: false,
								nameTo: null,
								message: "Танкист " + args[0] + " был заблокирован и кикнут.",
								rang: 0
							})));
					}
					if (tank !== null)
					{
						this.send(tank.getSocket(), "kick_for_cheats");


					}
					return null
				}
				break;
			case "unblockgame":
				if (tank.isOwner() || tank.isSponsor() || tank.isModerator())
				{
					if (args.length < 1)
					{
						return "Not Enough Arguments!\nUsage: /unblock <username>";
					}

					var tank = getTankByName(args[0]);
					this.broadcast(JSON.stringify(

						this.addMessage(
						{
							rangTo: 0,
							addressed: false,
							system: true,
							name: null,
							yellow: false,
							nameTo: null,
							message: "Танкист " + args[0] + " был разблокирован.",
							rang: 0
						})));
				}
				if (tank !== null)
				{
					tank.block = false;
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
						return "Чё-то не-то!!\nНадо вот так: /warn <НИК> <ПРИЧИНА>";
					}

					var tank = getTankByName(args[0]);
					if (tank !== null)
					{

						this.broadcast(JSON.stringify(
							this.addMessage(
							
						{
							
							rangTo: 0,
							addressed: false,
							system: true,
							name: null,
							yellow: false,
							nameTo: null,
							message: "Танкист " + args[0] + " ПРЕДУПРЕЖДЁН. " + "Причина: " + reason
						})));
						return null
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
						return "Чё-то не-то!!\nНадо вот так: /banminutes <НИК> <ПРИЧИНА>";
					}

					var tank = getTankByName(args[0]);
					if (tank !== null)
					{

						tank.banTime = new Date().getTime() + 300000;
						tank.banReason = reason;
						this.broadcast(JSON.stringify(
							this.addMessage(
							
						{
							
							rangTo: 0,
							addressed: false,
							system: true,
							name: null,
							yellow: false,
							nameTo: null,
							message: "Танкист " + args[0] + " лишен права выхода в эфир НА 5 МИНУТ. " + "Причина: " + reason
						})));
						return null
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
						return "Чё-то не-то!!\nНадо вот так: /banhour <НИК> <ПРИЧИНА>";
					}

					var tank = getTankByName(args[0]);
					if (tank !== null)
					{

						tank.banTime = new Date().getTime() + 3600000;
						tank.banReason = reason;
						this.broadcast(JSON.stringify(
							this.addMessage(
						{
							rangTo: 0,
							addressed: false,
							system: true,
							name: null,
							yellow: false,
							nameTo: null,
							message: "Танкист " + args[0] + " лишен права выхода в эфир НА " + "1 ЧАС. " + "Причина: " + reason
						})));
						return null
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
						return "Чё-то не-то!!\nНадо вот так: /banday <НИК> <ПРИЧИНА>";
					}

					var tank = getTankByName(args[0]);
					if (tank !== null)
					{

						tank.banTime = new Date().getTime() + 86400000;
						tank.banReason = reason;
						this.broadcast(JSON.stringify(
							this.addMessage(
						{
							rangTo: 0,
							addressed: false,
							system: true,
							name: null,
							yellow: false,
							nameTo: null,
							message: "Танкист " + args[0] + " лишен права выхода в эфир НА " + "1 ДЕНЬ. " + "Причина: " + reason
						})));
					return null
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
						return "Чё-то не-то!!\nНадо вот так: /banweek <НИК> <ПРИЧИНА>";
					}

					var tank = getTankByName(args[0]);
					if (tank !== null)
					{

						tank.banTime = new Date().getTime() + 86400000 * 7;
						tank.banReason = reason;
						this.broadcast(JSON.stringify(
							this.addMessage(
						{
							
							rangTo: 0,
							addressed: false,
							system: true,
							name: null,
							yellow: false,
							nameTo: null,
							message: "Танкист " + args[0] + " лишен права выхода в эфир НА " + "1 НЕДЕЛЮ. " + "Причина: " + reason
						})));
						return null
					}
				}
				break;
			case "unban":
				if (tank.isModerator())
				{
					if (args.length < 1)
					{
						return "Not Enough Arguments!\nUsage: /unban <username>";
					}

					var tank = getTankByName(args[0]);
					if (tank !== null)
					{
						tank.banTime = 0;

						this.broadcast(JSON.stringify(
						{
							rangTo: 0,
							addressed: false,
							system: true,
							name: null,
							yellow: false,
							nameTo: null,
							message: "Танкисту " + args[0] + " дали права выхода в эфир",
							rang: 0
						}));
						return null
					}
				}
				break;
		}

		return "Chat command failed";
	}

	onData(socket, args)
	{

		if (args.length === 3)
		{
			var message = args[0];
			var tank = socket.tank;
			if (message[0] === "/")
			{
				var cmdArgs = message.substring(1, message.length).split(" ");
				var result = this.processCommand(tank, cmdArgs.shift(), cmdArgs);

				if (result !== null)
					this.sendSystem(socket, result);
				return;
			}

			if (tank !== null && tank.rank > 2)
			{
				if (tank.banTime < new Date().getTime())
				{
					var sender = tank.name;
					var target = args[2];
					var rank = 0;
					var chatPerm = 0;
					if (tank.isSponsor())
					{
						chatPerm = 10
					}
					if (tank.isSponsor())
					{
						chatPerm = 10
					}
					if (tank.isСandModerator())
					{
						chatPerm = 4
					}
					if (tank.isModerator())
					{
						chatPerm = 3
					}
					if (tank.isOwner())
					{
						chatPerm = 1
					}

					if (target !== "NULL")
					{
						rank = 0;
						playerJson(target, (target_data) =>
						{
							if (Object.keys(target_data).length > 0) rank = target_data.rank;
							else return;

							this.broadcast(
								JSON.stringify(
									this.addMessage(
									{
										rangTo: rank,
										addressed: true,
										system: false,
										name: sender,
										yellow: false,
										nameTo: target,
										message: message,
										rang: tank.rank,
										chatPermissionsTo: 0,
										chatPermissions: chatPerm
									})
								)
							);
						});
					}
					else
					{

						this.broadcast(
							JSON.stringify(
								this.addMessage(
								{
									rangTo: 0,
									addressed: true,
									system: false,
									name: sender,
									yellow: false,
									nameTo: "NULL",
									message: message,
									rang: tank.rank,
									chatPermissions: chatPerm

								})
							)
						);
					}
				}
				else
				{
					var bant = new Date(tank.banTime);
					this.sendSystem(socket, "Вы отключены от чата. Вы вернётесь в ЭФИР через " + Math.round((tank.banTime - new Date().getTime()) / 1000 / 60) + " минут(ы). Причина: " + tank.banReason);
				}
			}
			else
			{
				this.sendSystem(socket, "Чат лобби доступен со звания Ефрейтор");
			}
		}
	}

}

module.exports = new LobbyChat();