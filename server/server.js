/**
 * Functions
 */

/**
 * Searches through an array to find a name
 * 
 * @param {string} needle
 * @param {Array} haystack
 * 
 * @returns Object|null
 */
 function search(needle, haystack)
 {
	 for (var i in haystack)
	 {
		 if (haystack[i].name === needle)
		 {
			 return haystack[i];
		 }
	 }
	 return null;
 }
 
 function getTankByName(username)
 {
	 return search(username, players);
 }
 
 /**
  * Broadcast a message towards all connected sockets.
  * 
  * @param {string} msg
  * @param {Array} senders
  */
 function broadcast(msg, senders = [])
 {
	 var socket_ids = [];
	 for (var i in senders)
	 {
		 socket_ids.push(senders[i].id);
	 }
 
	 for (var i in sockets)
	 {
		 if (!socket_ids.includes(sockets[i]))
		 {
			 send(sockets[i], msg);
		 }
	 }
 }
 
 /**
  * Returns the opposite team's name
  * 
  * @param {string} team
  * 
  * @returns {string}
  */
 function oppositeTeam(team)
 {
	 switch (team.toLowerCase())
	 {
		 case "red":
			 return "BLUE";
			 break;
		 case "blue":
			 return "RED";
			 return;
	 }
	 return "NONE";
 }
 
 /**
  * Returns a string with an uppercase letter at the start of each word in it.
  * 
  * @param {string} str
  * 
  * @returns {string}
  */
 function ucwords(str)
 {
	 str = str.toLowerCase();
	 return str.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g,
		 function(s)
		 {
			 return s.toUpperCase();
		 });
 }
 
 /**
  * Returns a string of a position that the game protocol accepts.
  * 
  * @param {Object} data
  */
 function positionString(data)
 {
	 return data.x + "@" + data.y + "@" + data.z;
 }
 
 /**
  * Sets a tank and a socket as online in game, and links them together.
  * 
  * @param {Socket} socket
  * @param {Tank} tank
  */
 function online(socket, tank)
 {
	 try
	 {
		 players[socket.id] = tank;
		 sockets[socket.id] = socket;
		 tank.setOnline(socket);
		 socket.tank = tank;
	 }
	 catch
	 {
		 tank.kick();
	 }
 }
 
 /**
  * Sets a tank and a socket as offline, and de-links them.
  *
  * @param {Socket} socket
  * @param {Tank} tank
  */
 function offline(socket, tank)
 {
	 offlineSocket(socket);
	 tank.setOffline();
	 tank.save();
 }
 
 function offlineSocket(socket)
 {
 
	 if (isset(players[socket.id]))
		 delete players[socket.id];
	 if (isset(sockets[socket.id]))
		 delete sockets[socket.id];
	 socket.tank = null;
 }
 
 function Kick(socket, tank)
 {
	 if (typeof(players[socket.id]) !== "undefined")
	 {
		 var battle = players[socket.id].findBattle();
		 if (battle !== null)
		 {
			 battle.leave(players[socket.id].name);
		 }
		 players[socket.id].save();
		 delete players[socket.id];
		 if (typeof(sockets[socket.id]) !== "undefined") delete sockets[socket.id];
		 if (typeof(queue[socket.id]) !== "undefined") delete queue[socket.id];
		 console.log("Socket " + socket.id + " kicked!");
		 socket.destroy();
	 }
 }
 
 /**
  * Gets the socket's linked tank, if exists, Null if doesn't.
  * 
  * @param {Socket} socket
  * 
  * @returns {Tank|null}
  */
 function getTank(socket)
 {
	 return c(socket.tank, null);
 }
 
 /**
  * Saves a tank to the file system.
  * 
  * @param {string} username
  * @param {Object} data
  */
 function save(username, data)
 {
	 fs.writeFile(
		 "players/" + username + ".json",
		 JSON.stringify(data, undefined, 2),
		 'utf8',
		 () =>
		 {});
 }
 
 /**
  * Returns a random int between min and max.
  * 
  * @param {int} min
  * @param {int} max
  * 
  * @returns {int}
  */
 function mt_rand(min, max)
 {
	 var argc = arguments.length
	 if (argc === 0)
	 {
		 min = 0
		 max = 2147483647
	 }
	 else if (argc === 1)
	 {
		 max = min;
		 min = 0;
	 }
	 else
	 {
		 min = parseInt(min, 10)
		 max = parseInt(max, 10)
	 }
	 return Math.floor(Math.random() * (max - min + 1)) + min
 }
 
 /**
  * Authenticates the socket after a successful login.
  * 
  * @param {Socket} socket
  * @param {string} username
  * @param {Object|null} data
  * 
  * @returns boolean
  */
 function authenticate(socket, username, data = null)
 {
 
	 if (!isset(players[socket.id]) && search(username, players) === null)
	 {
 
		
			 var callback = (data) =>
			 {
				 if (Object.keys(data) === 0)
				 {
					 send(socket, "auth;denied");
					 return false;
				 }
				 var tank = Tank.fromJSON(data);
				 if (!tank.block)
				 {
					 send(socket, "auth;accept");
 
					 online(socket, tank);
					 tank.ip = socket.remoteAddress;
					 tank.sendPanel();
					 tank.sendProgress();
					 lobby.initEffectModel(socket);
 
					 var send_garage = false;
					 var send_lobby = true;
					 battle = tank.findBattle();
 
					 if (battle !== null)
					 {
						 var user = battle.getUser(tank.name);
						 //user.dirty = false;
						 if (user !== null)
						 {
							 send(socket, "lobby;init_battlecontroller");
							 setTimeout(() =>
							 {
								 battle.initiate(socket);
								 battle.rejoin(tank);
							 }, 2000);
							 send_garage = false;
							 send_lobby = false;
						 }
					 }
				 }
				 else
				 {
					 send(socket, "auth;ban;Ваш аккаунт был заблокирован за нарушение правил игры.");
				 }
				 if (send_garage)
				 {
					 tank.garage.initiate(socket);
					 lobby.chat.initiate(tank);
					 tank.battleId = null;
				 }
				 else if (send_lobby)
				 {
					 lobby.chat.initiate(tank);
					 lobby.getBattles(socket, tank);
				 }
				 //tank.battleId = null;
			 };
			 if (data === null)
				 playerJson(username, callback);
			 else
				 callback(data);
		
	 }
	 else
		 socket.destroy();
 
	 return true;
 }
 
 function getMinDamage(turret, m)
 {
	 switch (turret.toLowerCase())
	 {
 
		 case "thunder":
			 if (m === 1)
				 return 38;
			 if (m === 2)
				 return 52;
			 if (m === 3)
				 return 61;
			 return 24;
	 }
 }
 
 function getMaxDamage(turret, m)
 {
	 switch (turret.toLowerCase())
	 {
		 case "shaft":
			 if (m === 1)
				 return 110;
			 if (m === 2)
				 return 140;
			 if (m === 3)
				 return 180;
			 return 100;
	 }
 }
 
 /**
  * Gets the damage of the turret.
  * 
  * @param {string} turret
  * @param {int} m
  * 
  * @returns {int}
  */
 function getDamage(turret, m)
 {
	 switch (turret.toLowerCase())
	 {
		 case "smoky":
			 if (m === 1)
				 return mt_rand(22, 28);
			 if (m === 2)
				 return mt_rand(33, 42);
			 if (m === 3)
				 return mt_rand(37, 47);
			 else
				 return mt_rand(16, 20);
		 case "snowman":
			 if (m === 1)
				 return mt_rand(50, 81);
			 if (m === 2)
				 return mt_rand(81, 102);
			 if (m === 3)
				 return mt_rand(102, 120);
			 else
				 return mt_rand(30, 50);
		 case "railgun":
			 if (m === 1)
				 return mt_rand(74, 115);
			 if (m === 2)
				 return mt_rand(87, 134);
			 if (m === 3)
				 return mt_rand(108, 164);
			 else
				 return mt_rand(50, 78);
		 case "railgunxt_m0":
			 return getDamage("railgun", 3);
		 case "terminator":
			 if (m === 1)
				 return mt_rand(58, 71);
			 if (m === 2)
				 return mt_rand(65, 78);
			 if (m === 3)
				 return mt_rand(74, 85);
			 else
				 return mt_rand(40, 60);
		 case "terminator_m0":
			 return getDamage("terminator", 0);
		 case "terminator_m1":
			 return getDamage("terminator", 1);
		 case "terminator_m2":
			 return getDamage("terminator", 2);
		 case "terminator_m3":
			 return getDamage("terminator", 3);
		 case "railgun_m0":
			 return getDamage("railgun", 0);
		 case "railgun_m1":
			 return getDamage("railgun", 1);
		 case "railgun_m2":
			 return getDamage("railgun", 2);
		 case "railgun_m3":
			 return getDamage("railgun", 3);
		 case "ricochet":
			 if (m === 0)
				 return mt_rand(14, 17);
			 if (m === 1)
				 return mt_rand(17, 21);
			 if (m === 2)
				 return mt_rand(21, 26);
			 if (m === 3)
				 return mt_rand(28, 33);
 
		 case "twins":
			 if (m === 0)
				 return mt_rand(6, 7);
			 if (m === 1)
				 return mt_rand(10, 12);
			 if (m === 2)
				 return mt_rand(12, 15);
			 if (m === 3)
				 return mt_rand(14, 17); // 15, 18
		 case "hammer":
			 if (m === 1)
				 return mt_rand(10, 20);
			 if (m === 2)
				 return mt_rand(10, 20);
			 if (m === 3)
				 return mt_rand(10, 20); // 10, 20
			 return mt_rand(80, 130);
		 case "thunder":
			 if (m === 1)
				 return mt_rand(44, 65);
			 if (m === 2)
				 return mt_rand(52, 75);
			 if (m === 3)
				 return mt_rand(58, 87); // 48, 78
			 return mt_rand(26, 48);
		 case "smokyxt":
			 if (m === 1)
				 return mt_rand(200, 500);
			 if (m === 2)
				 return mt_rand(200, 500);
			 if (m === 3)
				 return mt_rand(200, 500); // 200, 500
			 return mt_rand(200, 500);
		 case "shaft":
			 if (m === 1)
				 return mt_rand(10, 20);
			 if (m === 2)
				 return mt_rand(10, 20);
			 if (m === 3)
				 return mt_rand(10, 20); // 10, 20
			 return mt_rand(80, 130);
		 case "thunder_m0":
			 return getDamage("thunder", 0);
		 case "thunder_m1":
			 return getDamage("thunder", 1);
		 case "thunder_m2":
			 return getDamage("thunder", 2);
		 case "thunder_m3":
			 return getDamage("thunder", 3);
	 }
	 return 0;
 }
 
 /**
  * Gets the next rank target score.
  *
  * @param {int} rank
  *
  * @returns {int}
  */
 function getNextScore(rank = 1)
 {
	 if (rank > 27)
		 rank = 27;
 
	 if (rank < 0)
		 rank = 0;
 
	 return [
		 0,
		 100,
		 500,
		 1500,
		 3700,
		 7100,
		 12300,
		 20000,
		 29000,
		 41000,
		 57000,
		 76000,
		 98000,
		 125000,
		 156000,
		 192000,
		 233000,
		 290000,
		 332000,
		 390000,
		 455000,
		 527000,
		 606000,
		 692000,
		 787000,
		 889000,
		 1000000,
 
		 0
	 ][rank];
 }
 
 function getNextReward(rank = 1)
 {
	 if (rank > 27)
		 rank = 27;
 
	 if (rank < 0)
		 rank = 0;
 
	 return [
		 0,
		 100,
		 200,
		 300,
		 500,
		 1000,
		 1500,
		 2000,
		 3000,
		 4000,
		 5000,
		 6000,
		 7000,
		 8000,
		 9000,
		 10000,
		 11100,
		 12000,
		 13000,
		 14000,
		 15000,
		 16000,
		 17000,
		 18000,
		 19000,
		 20000,
		 30000,
		 0
	 ][rank];
 }
 
 /**
  * Distance between 2 3d points.
  * @param {object} pos
  * @param {object} pos2
  */
 function distance(pos, pos2)
 {
	 if (pos === null || pos2 === null)
		 return -1;
 
	 return Math.sqrt(Math.pow(pos2.x - pos.x, 2) + Math.pow(pos2.y - pos.y, 2) + Math.pow(pos2.z - pos.z, 2));
 }
 
 
 /**
  * Checks if a exists, if it does, returns a, if it doesnt, return b
  * @param {any} a
  * @param {any} b
  * 
  * @returns {any}
  */
 function c(a, b = null)
 {
	 if (typeof(a) === "undefined") return b;
	 return a;
 }
 
 /**
  * Sends a message to the socket, using basic protocol syntax.
  * 
  * @param {Socket} socket
  * @param {string} msg
  */
 function send(socket, msg)
 {
	 if (isset(queue[socket.id]))
	 {
		 if (debug && msg.length <= 4000 && (msg.split(";").length < 2 || msg.split(";")[1] !== "move" && msg.split(";")[1] !== "pong")) console.log("send: " + msg);
		 queue[socket.id].send.push(msg + "end~");
	
	 }
 }
 
 /**
  * Updates the socket sending queue, and sends the next message in line.
  * 
  * @param {Socket} socket
  */
 function updateSocket(socket)
 {
	 if (isset(queue[socket.id]) && queue[socket.id].send.length > 0)
	 {
		 var str = queue[socket.id].send.shift();
		 while (queue[socket.id].send.length > 0)
			 str += queue[socket.id].send.shift();
		 write(socket, str);
	 }
 }
 
 function write(socket, str)
 {
	 if (socket === null || socket.ended || socket.writeable)
	 {
		 if (socket.tank !== null)
			 offline(socket, tank);
		 else
			 offlineSocket(socket);
		 socket.destroy();
		 return;
	 }
	 socket.write(str);
 }
 
 /**
  * Async request of the file system to retrieve the player's data in json, then provide the result in a callback function.
  * 
  * @param {any} username
  * @param {any} callback
  */
 function playerJson(username, callback)
 {
	 fs.open('players/' + username + '.json', 'r', (err, fd) =>
	 {
		 if (err)
		 {
			 if (err.code === 'ENOENT')
			 {
				 callback(
				 {});
				 return;
			 }
			 console.error(err);
		 }
 
		 fs.readFile('players/' + username + '.json', (err, data) =>
		 {
			 if (err)
				 console.error(err);
			 try
			 {
				 callback(JSON.parse(data, undefined, 2));
			 }
			 catch (e)
			 {
				 callback(
				 {});
				 console.error(e);
			 }
		 });
	 });
 }
 
 /**
  * Returns the type of the inventory item
  * 
  * @param {string} id
  * 
  * @returns {int}
  */
 function getType(id)
 {
	 if (turrets.includes(id)) return 1; // Turret Type = 1
	 else if (hulls.includes(id)) return 2; // Hull Type = 2
	 else if (inventory.includes(id)) return 4; // Inventory Type (Bonuses) = 4
	 else if (special.includes(id)) return 5; // Special Type (Score Boost) = 5
	 return 3; // Paint Type = 3
 }
 
 /**
  * Returns whether the value exists
  * 
  * @param {boolean} val
  */
 function isset(val)
 {
	 return typeof(val) !== "undefined";
 }
 
 /**
  * Returns the impact force of the shooting turret
  * 
  * @param {string} id
  */
 function getImpactForce(id)
 {
	 var turret_data = id.split("_");
	 var turret = turret_data[0];
	 if (turret_data.length === 2)
	 {
		 var modification = turret_data[1];
		 if (modification.length === 2)
		 {
			 var m = parseInt(modification.charAt(1));
			 if (!isNaN(m))
			 {
				 switch (turret.toLowerCase())
				 {
					 case "smoky":
						 if (m === 0) return 1.0;
						 if (m === 1) return 1.1;
						 if (m === 2) return 1.2;
						 if (m === 3) return 1.3;
						 break;
					 case "snowman":
						 if (m === 0) return 1.0;
						 if (m === 1) return 1.1;
						 if (m === 2) return 1.2;
						 if (m === 3) return 1.3;
						 break;
					 case "railgun":
						 if (m === 0) return 2.0;
						 if (m === 1) return 2.2;
						 if (m === 2) return 2.4;
						 if (m === 3) return 2.65;
						 break;
					 case "railgunxt":
						 if (m === 0) return 2.7;
						 break;
					 case "terminator":
						 if (m === 0) return 1.9;
						 if (m === 1) return 1.9;
						 if (m === 2) return 1.9;
						 if (m === 3) return 1.9;
						 break;
					 case "twins":
						 if (m === 0) return 0.65;
						 if (m === 1) return 0.75;
						 if (m === 2) return 0.85;
						 if (m === 3) return 0.95; // 0.95
						 break;
					 case "hammer":
						 if (m === 0) return 1.25;
						 if (m === 1) return 1.35;
						 if (m === 2) return 1.45;
						 if (m === 3) return 1.55; // 1.55
						 break;
					 case "ricochet":
						 if (m === 0) return 0.85;
						 if (m === 1) return 1.0;
						 if (m === 2) return 1.15;
						 if (m === 3) return 1.25; // 1.25
						 break;
					 case "thunder":
						 if (m === 0) return 1.1;
						 if (m === 1) return 1.2;
						 if (m === 2) return 1.3;
						 if (m === 3) return 1.4; // 2.0
						 break;
					 case "shaft":
						 if (m === 0) return 1.0;
						 if (m === 1) return 1.1;
						 if (m === 2) return 1.2;
						 if (m === 3) return 1.3; // 2.0
						 break;
				 }
			 }
		 }
	 }
	 return 0;
 }
 
 /**
  * Returns the kickback of the shooting turret.
  * 
  * @param {string} id
  */
 function getKickback(id)
 {
	 var turret_data = id.split("_");
	 var turret = turret_data[0];
	 if (turret_data.length === 2)
	 {
		 var modification = turret_data[1];
		 if (modification.length === 2)
		 {
			 var m = parseInt(modification.charAt(1));
			 if (!isNaN(m))
			 {
				 switch (turret.toLowerCase())
				 {
					 case "smoky":
						 if (m === 0) return 0.52;
						 if (m === 1) return 0.62;
						 if (m === 2) return 0.72;
						 if (m === 3) return 0.77;
						 break;
					 case "railgunxt":
						 if (m === 0) return 2.1;
						 break;
					 case "railgun":
						 if (m === 0) return 1.25;
						 if (m === 1) return 1.35;
						 if (m === 2) return 1.4;
						 if (m === 3) return 1.45;
						 break;
					 case "terminator":
						 if (m === 0) return 2;
						 if (m === 1) return 2;
						 if (m === 2) return 2.1;
						 if (m === 3) return 2.1;
						 break;
					 case "twins":
						 if (m === 0) return 0.05;
						 if (m === 1) return 0.05;
						 if (m === 2) return 0.05;
						 if (m === 3) return 0.05; // 0.05
						 break;
					 case "hammer":
						 if (m === 0) return 1.4;
						 if (m === 1) return 1.5;
						 if (m === 2) return 1.6;
						 if (m === 3) return 1.7; // 1.7
						 break;
					 case "ricochet":
						 if (m === 0) return 0.9;
						 if (m === 1) return 1.0;
						 if (m === 2) return 1.1;
						 if (m === 3) return 1.2;
						 break;
					 case "thunder":
						 if (m === 0) return 1.0;
						 if (m === 1) return 1.05;
						 if (m === 2) return 1.1;
						 if (m === 3) return 1.15;
						 break;
					 case "shaft":
						 if (m === 0) return 1.5;
						 if (m === 1) return 1.8;
						 if (m === 2) return 2;
						 if (m === 3) return 2.3;
						 break;
				 }
			 }
		 }
	 }
	 return 0;
 }
 
 /**
  * Returns the mass of the hull.
  * 
  * @param {string} id
  */
 function getMass(id)
 {
	 var hull_data = id.split("_");
	 var hull = hull_data[0];
	 if (hull_data.length === 2)
	 {
		 var modification = hull_data[1];
		 if (modification.length === 2)
		 {
			 var m = parseInt(modification.charAt(1));
			 if (!isNaN(m))
			 {
				 switch (hull.toLowerCase())
				 {
					 case "wasp":
						 if (m === 0) return 1000.0;
						 if (m === 1) return 1000.0;
						 if (m === 2) return 1000.0;
						 if (m === 3) return 1000.0;
						 break;
					 case "waspxt":
						 if (m === 0) return 1000.0;
						 break;
					 case "waspmega":
						 if (m === 0) return 1500.0;
						 if (m === 1) return 1500.0;
						 if (m === 2) return 1500.0;
						 if (m === 3) return 1500.0;
						 break;
					 case "hunter":
						 if (m === 0) return 1200.0;
						 if (m === 1) return 1200.0;
						 if (m === 2) return 1200.0;
						 if (m === 3) return 1200.0;
						 break;
					 case "hunterxt":
						 if (m === 0) return 1200.0;
						 break;
					 case "titan":
						 if (m === 0) return 1700.0;
						 if (m === 1) return 1700.0;
						 if (m === 2) return 1700.0;
						 if (m === 3) return 1700.0;
						 break;
					 case "dictator":
						 if (m === 0) return 1400.0;
						 if (m === 1) return 1400.0;
						 if (m === 2) return 1400.0;
						 if (m === 3) return 1400.0;
						 break;
					 case "ufo":
						 if (m === 0) return 1200.0;
						 if (m === 1) return 1200.0;
						 if (m === 2) return 1200.0;
						 if (m === 3) return 1200.0;
						 break;
					 case "hornet":
						 if (m === 0) return 1110.0;
						 if (m === 1) return 1110.0;
						 if (m === 2) return 1110.0;
						 if (m === 3) return 1110.0;
						 break;
					 case "hornetxt":
						 if (m === 0) return 1110.0;
						 break;
					 case "hornethell":
						 if (m === 0) return 1055.0;
						 break;
					 case "viking":
						 if (m === 0) return 1300.0;
						 if (m === 1) return 1300.0;
						 if (m === 2) return 1300.0;
						 if (m === 3) return 1300.0;
						 break;
					 case "vikingxt":
						 if (m === 0) return 1300.0;
						 break;
					 case "mammoth":
						 if (m === 0) return 2000.0;
						 if (m === 1) return 2000.0;
						 if (m === 2) return 2000.0;
						 if (m === 3) return 2000.0;
						 break;
				 }
			 }
		 }
	 }
	 return 0;
 }
 
 
 
 /**
  * Returns the powe of the hull.
  * 
  * @param {string} id
  */
 
 function getPower(id)
 {
	 var hull_data = id.split("_");
	 var hull = hull_data[0];
	 if (hull_data.length === 2)
	 {
		 var modification = hull_data[1];
		 if (modification.length === 2)
		 {
			 var m = parseInt(modification.charAt(1));
			 if (!isNaN(m))
			 {
				 switch (hull.toLowerCase())
				 {
					 case "wasp":
						 if (m === 0) return 100000.0;
						 if (m === 1) return 100000.0;
						 if (m === 2) return 100000.0;
						 if (m === 3) return 100000.0;
						 break;
					 case "hunter":
						 if (m === 0) return 140000.0;
						 if (m === 1) return 140000.0;
						 if (m === 2) return 140000.0;
						 if (m === 3) return 140000.0;
						 break;
					 case "titan":
						 if (m === 0) return 200000.0;
						 if (m === 1) return 200000.0;
						 if (m === 2) return 200000.0;
						 if (m === 3) return 200000.0;
						 break;
					 case "dictator":
						 if (m === 0) return 160000.0;
						 if (m === 1) return 160000.0;
						 if (m === 2) return 160000.0;
						 if (m === 3) return 160000.0;
						 break;
					 case "hornet":
						 if (m === 0) return 120000.0;
						 if (m === 1) return 120000.0;
						 if (m === 2) return 120000.0;
						 if (m === 3) return 120000.0;
						 break;
					 case "hornetxt":
						 if (m === 0) return 160000.0;
						 break;
					 case "waspxt":
						 if (m === 0) return 100000.0;
						 break;
					 case "hunterxt":
						 if (m === 0) return 140000.0;
						 break;
					 case "vikingxt":
						 if (m === 0) return 160000.0;
						 break;
					 case "viking":
						 if (m === 0) return 160000.0;
						 if (m === 1) return 160000.0;
						 if (m === 2) return 160000.0;
						 if (m === 3) return 160000.0;
						 break;
					 case "mammoth":
						 if (m === 0) return 260000.0;
						 if (m === 1) return 260000.0;
						 if (m === 2) return 260000.0;
						 if (m === 3) return 260000.0;
						 break;
				 }
			 }
		 }
	 }
	 return 0;
 }
 
 /*
  * Code
  */
 console.clear();
 
 /**
  * Important Imports
  */
 const app = require('express')(),
	 fs = require('file-system'),
	 readline = require('readline'),
	 net = require('net'),
	 shortid = require('shortid'),
	 publicIp = require("public-ip"),
	 notifier = require('node-notifier');
 
 /*
  * Important Initial Values
  */
 
 
 var market_list = JSON.parse(fs.readFileSync("market.json", "utf8")),
	 sfx_data = JSON.parse(fs.readFileSync("sfx_data.json", "utf8")),
	 shop_data = JSON.parse(fs.readFileSync("shop_data.json", "utf8")),
	 shots_data = JSON.parse(fs.readFileSync("shots_data.json", "utf8")),
	 battle_items = JSON.parse(fs.readFileSync("maps.json", "utf8")),
	 gun_data = {},
	 turrets = [
		 "thunder",
		 "hwthunder",
		 "twins",
		 "twinsxt",
		 "isida",
		 "isidahw",		 
		 "smoky",
		 "smokyxt",
		 "snowman",
		 "flamethrower",
		 "flamethrowerhw",
		 "pumpkingun",
		 "ricochet",
		 "bfg",
		 "frezee",
		 "frezeeny",
		 "railgun",
		 "railgunxt",
		 "shaft"
	 ],
	 hulls = [
		 "wasp",
		 "titanxt",
		 "hunterhw",
		 "titan",
		 "hunter",
		 "viking",
		 "vikingxt",
		 "hornet",
		 "hornetxt",
		 "dictatorny",
		 "dictator",
		 "ufo",
		 "praetorian",
		 "mamonthw",
		 "mamont"
		 
	 ],
	 special = [
		 "up_score_small",
		 "up_score_start",
		 "up_score",
		 "no_supplies"
	 ],
	 inventory = [
		 "double_damage",
		 "armor",
		 "mine",
		 "health",
		 "n2o",
		 "1000_scores"
	 ],
	 paints = [
		 "green",
		 "holiday",
		 "izumurud",
		 "flora",
		 "dragon",
		 "roger",
		 "khokhloma",
		 "red",
		 "white",
		 "carbon",
		 "savanna",
		 "marsh",
		 "electra",
		 "surf",
		 "standstone",
		 "python",
		 "withlove",
		 "dirt",
		 "metallic",
		 "zeus",
		 "jaguar",
		 "irbis",
		 "needles",
		 "safari",
		 "marine",
		 "foreign",
		 "clay",
		 "rock",
		 "rust",
		 "lava",
		 "forester",
		 "spark",
		 "kedr",
		 "nefrit",
		 "tina",
		 "digital",
		 "storm",
		 "flame",
		 "blizzard",
		 "taiga",
		 "black",
		 "mary",
		 "ruby",
		 "sapphire",
		 "prodigy",
		 "lead",
		 "orange",
		 "tundra",
		 "rustle",
		 "blue",
		 "urban",
		 "barkhan",
		 "graffiti",
		 "whitekhokhloma",
		 "inferno",
		 "picasso",
		 "godmode",
		 "redl",
		 "acid",
		 "ufocolor",
		 "ufocolor2",
		 "flash",
		 "impulse",
		 "tester",
		 "flow",
		 "atom",
		 "afrika",
		 "vihry",
		 "visnya",
		 "drovocek",
		 "zahvatchik",
		 "izlom",
		 "kolichuga",
		 "kyznec",
		 "magma",
		 "mars",
		 "nosorog",
		 "partizan",
		 "tiger",
		 "reporter", 
		 "moderator",
		 "tester",
		 "besthelper",
		 "tot",
		 "flow",
		 "flame",
		 "helios",
		 "spectator",
		 "virus",
		 "flash",
		 "alimia", 
		 "acid",
		 "champion",
		 "uley"
	 ];
 
 /*
  * Exports
  */
 
 exports.market_list = market_list;
 exports.shots_data = shots_data;
 exports.sfx_data = sfx_data;
 exports.shop_data = shop_data;
 exports.battle_items = battle_items;
 exports.gun_data = gun_data;
 exports.maps = maps;
 exports.search = search;
 exports.players = players;
 exports.sockets = sockets;
 exports.queue = queue;
 exports.broadcast = broadcast;
 exports.positionString = positionString;
 exports.oppositeTeam = oppositeTeam;
 exports.getTankByName = getTankByName;
 exports.distance = distance;
 exports.getDamage = getDamage;
 exports.getMinDamage = getMinDamage;
 exports.getMaxDamage = getMaxDamage;
 exports.playerJson = playerJson;
 exports.save = save;
 exports.mt_rand = mt_rand;
 exports.getNextScore = getNextScore;
 exports.getNextReward = getNextReward;
 exports.c = c;
 exports.send = send;
 exports.write = write;
 exports.getType = getType;
 exports.isset = isset;
 exports.getImpactForce = getImpactForce;
 exports.getKickback = getKickback;
 exports.getMass = getMass;
 exports.getPower = getPower;
 exports.turrets = turrets;
 exports.hulls = hulls;
 exports.special = special;
 exports.inventory = inventory;
 exports.paints = paints;
 exports.Kick = Kick;
 
 
 const
 {
	 trace
 } = require('console');
 /*
  * Imports
  */
 
 const
 {
	 Tank
 } = require("./Tank"),
	 {
		 Command
	 } = require("./Command"),
	 lobby = require("./Lobby");
 /*
  * Initial Values
  */
 var port = 15050,
	 client_port = 30,
	 debug = false,
	 rl = readline.createInterface(
	 {
		 input: process.stdin
	 }),
	 sale = 0,
	 maps = {},
	 xml = fs.readFileSync("crossdomain.xml", "utf8"),
	 players = {},
	 sockets = {},
	 queue = {},
	 server;
 
 /*
  * Setup
  */
 
 (async() =>
 {
	 var my_ip = await publicIp.v4();
	 var obj = {
		 ip: my_ip,
		 port: port
	 };
	 fs.writeFile("public/socket.cfg", JSON.stringify(obj), 'utf8', () =>
	 {});
 })();
 for (var i in market_list)
 {
	 if (market_list[i].discount !== 0)
	 {
		 market_list[i].price *= (100 - market_list[i].discount) / 100;
		 market_list[i].next_price *= (100 - market_list[i].discount) / 100;
	 }
 }
 if (sale !== 1)
 {
	 for (var i in market_list)
	 {
		 if (isset(market_list[i].modification))
		 {
			 for (var j in market_list[i].modification)
			 {
				 market_list[i].modification[j].price *= (100 - sale) / 100;
			 }
		 }
		 if (market_list[i].discount === 0 && market_list[i].type !== 6)
		 {
			 market_list[i].price *= (100 - sale) / 100;
			 market_list[i].discount = sale;
			 market_list[i].next_price *= (100 - sale) / 100;
 
		 }
	 }
 }
 for (var i in market_list)
 {}
 
 for (var i in shots_data.weapons)
 {
	 var shot_data = shots_data.weapons[i];
	 gun_data[shot_data.id] = shot_data.special_entity;
 }
 
 /*
  * Console
  */
 
 rl.on("line", (data) =>
 {
	 var args = data.split(" "),
		 command = new Command(args[0]);
	 args.splice(0, 1);
 
	 if (command.match("addcry") && args.length === 2)
	 {
		 var name = args[0];
		 var amount = parseInt(args[1]);
		 if (!isNaN(amount))
		 {
			 for (var i in players)
			 {
				 if (players[i].name === name && typeof(sockets[i]) !== "undefined")
				 {
					 players[i].crystals += amount;
					 players[i].save();
					 players[i].sendCrystals();
					 console.log("Tank " + name + " has gained " + amount + " crystals");
					 return true;
				 }
			 }
 
			 console.log("Player not found.");
		 }
		 else console.log("Please provide a valid number in argument #2");
		 return false;
	 }
	 else if (command.match("addfund"))
	 {
		 var arr = args;
		 var amount = parseInt(arr.pop());
		 var battleId = arr.join(" ");
		 if (!isNaN(amount))
		 {
			 var battle = lobby.findBattle(battleId);
			 if (battle !== null)
			 {
				 battle.addFund(amount);
				 console.log("Battle " + battle.name + "'s fund was raised by" + amount + " crystals");
				 return true;
			 }
			 console.log("Battle not found.");
		 }
		 else console.log("Please provide a valid number in argument #2");
		 return false;
	 }
	 else if (command.match("addscore"))
	 {
		 var name = args[0];
		 var amount = parseInt(args[1]);
		 if (!isNaN(amount))
		 {
			 for (var i in players)
			 {
				 if (players[i].name === name && typeof(sockets[i]) !== "undefined")
				 {
					 players[i].score += amount;
					 players[i].save();
					 players[i].sendScore();
					 console.log("Tank " + name + "'s score was raised by " + amount);
					 return true;
				 }
			 }
			 console.log("Player not found.");
		 }
		 else console.log("Please provide a valid number in argument #2");
		 return false;
	 }
	 else if (command.match("eval"))
	 {
		 eval(data.split("eval")[1])
	 }
	 else if (command.alias(["restart", "stop"]))
		 restart(command.match("restart"));
	 else if (command.match("debug"))
	 {
		 debug = !debug;
		 if (debug)
			 console.log("debug ENABLED");
		 else
			 console.log("debug DISABLED");
	 }
	 else if (command.match("kick") && args.length === 1)
	 {
		 var tank = getTankByName(args[0]);
		 if (tank === null)
		 {
			 console.log("Player not found");
			 return false;
		 }
 
		 tank.kick();
		 return true;
	 }
 });
 
 function restart(peaceful = false)
 {
	 for (var i in sockets)
	 {
		 try
		 {
			 for (var i in lobby.battles)
			 {
				 lobby.battles[i].finish();
			 }
		 }
		 catch
		 {}
	 }
 
	 broadcast("lobby;server_halt");
	 setTimeout(() =>
	 {
		 //var restart = new restartGame();
	 }, 50000);
 }
 
 function broadcast(message)
 {
	 for (var i in sockets)
		 send(sockets[i], message);
 }
 
 /*
  * Server
  */
 function decrypt(encrypted, num = 1)
 {
 
	 var withend = encrypted.split('end~')
	 var key = parseInt(withend[0].toString(), 10);
	 var array = withend[0].split('')
	 array.shift()
 
	 var massiv = array.map(value => value.charCodeAt(0) - (key + num));
	 var packet = "";
	 for (var i in massiv)
	 {
 
		 packet += String.fromCharCode(massiv[i])
	 }
	 return packet + "end~"
 }
 
 server = net.createServer(function(socket)
 {
	 socket.id = shortid.generate();
	 queue[socket.id] = {
		 interval: setInterval(() =>
		 {
			 updateSocket(socket);
		 }, 75),
		 send: []
	 };
	 var blackIPs = ["127.0.0.5",
	 "127.0.0.2"]
	 console.log('Socket with the ID ' + socket.id + " has connected");
	 console.log(socket.remoteAddress + ":" + socket.remotePort);
	 for (var i in blackIPs )
	 {
		 
  if(socket.remoteAddress === blackIPs[i])
  {
	  socket.destroy();
  }
}
	 var oldRequest = "";
	 var num = 1;
	 socket.on('data', function(data)
	 {
		 var data_string = data.toString();
 
		 if (data_string === '<policy-file-request/>\u0000')
		 {
			 if (socket && socket.readyState == 'open')
			 {
				 socket.end(xml);
				 // if(!secured.includes(socket.remoteAddress + ":" + socket.remotePort)) secured.push(socket.remoteAddress + ":" + socket.remotePort);
				 // socket.end();
				 return;
			 }
		 }
		 data_string = decrypt(data_string, num);
	//	 oldRequest = decrypt(oldRequest, num);
		 var msgs = (oldRequest + data_string).split("end~"),
			 msg;

		 oldRequest = msgs.pop();
// console.log(msgs)
		 for (var msgInd in msgs)
		 {
			 
			 msg = msgs[msgInd];
			 var args = msg.split(";");
			// log(msg)

		
			 
			



			 if (args[1] !== "move" && debug && args[1] !== "ping" && args[1] !== "pong") console.log("receive: " + msg);
			 if (args[0] === "auth")
			 {
				 if (args.length >= 3)
				 {
					 var username = args[1];
					 if (username === "recovery_account")
						 return;
					 var pw = args[2];
					 var json = playerJson(username, (data) =>
					 {
						 if (data.password === pw)
						 {
							 authenticate(socket, username, data);
						 }
						 else
						 {
							 send(socket, "auth;denied");
						 }
					 });
				 }
			 }
			 else if (args[0] === "system")
			 {
				 if (args[1] === "get_aes_data")
				 {
					 num = 12
					 send(socket, "system;set_aes_data;67,87,83,32,60,6,0,0,120,-100,125,83,75,111,-29,84,20,-66,15,63,-30,52,-81,54,109,50,73,103,58,25,106,-90,60,-102,-40,73,-85,-103,105,-90,19,77,-44,76,97,64,51,-123,-23,2,52,106,20,57,-50,117,-30,54,-79,45,-5,-90,105,86,-116,-40,-16,3,88,-79,43,18,-65,-128,37,27,-40,-80,98,-109,-86,72,-4,5,36,22,13,59,118,-27,-38,9,125,-127,-80,116,-81,125,-50,-7,-50,119,-65,115,-49,-15,17,16,71,0,-92,29,0,-106,32,-88,-51,102,0,0,95,36,127,-127,0,108,-70,45,-93,-4,-86,-74,-99,59,-22,117,45,-81,-52,-84,39,43,29,74,-99,-78,-94,12,6,-125,-62,96,-83,96,-69,109,-91,-72,-79,-79,-95,-88,37,-91,84,-54,51,68,-34,27,90,84,59,-54,91,-34,-14,74,37,32,-88,17,79,119,77,-121,-102,-74,-107,-13,109,-83,105,-9,-23,-109,-107,-107,41,107,75,-65,32,117,-6,110,55,-96,108,-23,10,-23,-110,30,-79,-88,-89,20,11,69,70,-44,-46,-53,-122,-19,-10,52,90,-47,28,-89,107,-22,-102,79,-89,28,-27,-67,-114,-83,31,12,-76,67,-110,55,-70,-102,-41,-39,84,46,-127,126,14,53,105,-105,84,-86,45,-69,73,114,-37,93,114,-108,91,-49,85,47,-13,3,-12,4,-30,-125,91,-105,66,43,87,-54,-44,-4,-20,-126,110,-9,20,-57,-75,91,125,-99,105,50,24,85,-112,124,53,-59,-89,112,-6,-51,-82,-23,117,-120,91,-23,91,7,-106,61,-104,28,113,-23,-11,49,-70,75,52,106,95,71,-4,-29,-13,-29,93,-51,106,-9,-75,54,-87,60,123,25,-60,46,-20,64,-93,70,73,-27,-123,54,-52,-107,30,-82,-26,74,106,113,99,34,-61,-9,110,42,55,110,123,-22,97,13,-84,-128,88,-94,-97,121,-71,-109,-1,-92,-70,-69,-5,-39,-50,-85,26,24,-59,-63,-115,-89,-106,-8,29,111,-126,45,116,126,126,-2,58,-116,-103,67,96,-117,19,-66,125,61,9,127,-6,-51,15,127,-19,-77,-103,-8,57,-4,66,51,45,-16,-29,-4,31,12,-61,108,16,-104,9,80,0,24,34,0,-34,-25,2,123,117,-85,-68,-41,27,54,-40,-123,-19,19,118,97,123,39,95,-115,-66,63,-7,114,79,119,-121,14,-91,-60,-93,123,-98,-85,63,126,-20,67,11,-102,-57,49,-7,26,-42,-120,-121,15,-56,80,104,104,-82,-85,13,-95,41,-78,126,-46,-113,-55,-112,99,78,79,-24,18,-85,77,59,-68,-57,122,71,-17,77,-101,115,-39,-104,-22,-18,-102,82,82,-43,7,74,-77,111,118,-87,105,-15,85,-97,67,-40,-91,-82,105,-75,-61,122,71,115,-73,-20,22,-87,-46,-120,-31,-38,-67,-83,-87,41,77,-113,-105,-43,-7,96,118,10,45,-109,-47,107,-61,-14,-82,-29,-102,-108,-56,-41,-99,-75,-55,123,-89,-23,23,-76,101,-77,25,55,45,-30,-34,-67,14,122,110,81,-30,106,58,53,15,-55,4,-72,-8,63,36,-73,39,49,114,-24,-113,121,-7,-103,-1,-14,-29,26,-43,-39,-92,112,-5,-74,105,69,124,-123,10,-79,-126,107,11,-28,42,-2,-106,110,52,-38,118,-125,-38,-115,22,49,76,-53,-12,91,-35,-24,-112,-82,-125,29,-37,-61,-59,7,-113,-80,105,81,92,90,91,23,-89,-103,-72,-12,112,61,122,77,-120,48,41,81,-104,8,-119,-33,56,59,114,85,88,-12,-102,-26,-39,127,85,-104,-6,-17,-117,-63,-59,-46,-93,89,30,-90,80,40,-54,-49,-91,-47,45,-104,-123,-39,100,118,62,-69,-112,77,101,-45,-87,-73,82,-9,83,40,-123,80,4,34,-52,-15,-126,24,-110,-62,51,-111,121,17,74,34,12,-117,104,70,-60,17,17,-59,68,20,23,113,66,-60,-77,-117,80,-60,-73,68,-76,36,-94,-100,-120,-96,24,93,22,-111,44,-58,-34,22,-93,43,98,-12,29,49,-6,46,7,0,2,72,16,-124,-52,27,-114,7,32,11,124,-101,91,-124,-73,-17,-80,117,-105,-83,123,108,-67,7,-93,49,73,0,8,-93,-89,-128,103,-125,11,-97,-126,25,-124,33,-116,84,1,-12,7,23,98,24,-83,49,55,-26,-104,29,-110,-16,72,-3,-128,57,5,65,10,127,13,-1,-60,-29,-8,72,61,-125,28,-120,-97,65,30,-78,77,64,-119,51,-90,42,125,6,67,92,102,-100,24,25,80,-122,-57,35,3,25,-8,59,-17,-73,-15,-36,-87,12,-94,-20,-9,25,39,101,-56,-52,-123,-47,105,7,-114,-45,39,-85,104,-101,-125,111,120,-99,27,103,100,-32,-23,124,98,25,0,105,-68,-40,-28,-102,124,93,48,-124,-109,38,-65,45,-62,83,57,114,124,-68,29,-126,-102,52,-50,52,-7,-97,24,-84,-55,-97,24,120,-31,-41,-13,-13,-15,-46,105,-109,99,36,97,120,-4,33,43,113,6,74,-31,-5,35,-107,-119,-117,-116,-22,-68,12,101,36,99,-103,-109,121,89,-112,69,57,36,75,31,-15,82,7,-115,-98,-125,-79,-52,42,-63,-120,85,-75,17,-96,-61,4,-44,-29,70,92,-83,39,-116,-124,90,-97,53,102,-43,-6,-100,49,-89,-42,-109,70,82,-83,-57,-116,88,-80,125,14,-18,4,79,39,-54,50,56,70,32,37,47,126,-10,-89,-20,-29,111,-5,39,-54,-99")
				 }
			 }
			 else if (args[0] === "registration")
			 {
				 if (args.length === 3 && args[1] === "check_name")
				 {
					 fs.open("players/" + args[2] + ".json", 'r', (err, fd) =>
					 {
						 if (err && err.code === 'ENOENT')
							 send(socket, "registration;check_name_result;not_exist");
						 else
							 send(socket, "registration;check_name_result;nickname_exist");
					 });
				 }
				 else
				 {
					 fs.open("players/" + args[1] + ".json", 'r', (err, fd) =>
					 {
						 if (/^[a-zA-Z0-9-_]+$/.test(args[1]) === true)
						 {
							 if (err && err.code === 'ENOENT')
							 {
								 var tank = new Tank(args[1], args[2]);
								  
								 if (args[3] !== "null") tank.email = args[3];
								 tank.ip = socket.remoteAddress;
								 tank.save();
								 send(socket, "registration;info_done");
								 authenticate(socket, args[1]);
							 }
						 }
					 });
				 }
			 }
			 else if (args[0] === "garage")
			 {
				 var tank = getTank(socket);
				 args.shift();
				 if (tank !== null && tank.garage !== null)
					 tank.garage.onData(socket, args);
			 }
			 else if (args[0] === "lobby")
			 {
				 args.shift();
				 lobby.onData(socket, args);
			 }
			 else if (args[0] === "battle")
			 {
				 args.shift();
				 var tank = getTank(socket);
				 if (tank !== null)
				 {
					 var battle = tank.findBattle();
 
					 if (battle !== null)
						 battle.onData(socket, tank, args);
				 }
			 }
			 else if (args[0] === "lobby_chat")
			 {
				 args.shift();
				 lobby.chat.onData(socket, args);
			 }
 
		 }
	 });
 
	 socket.on('error', (e) =>
	 {
		 console.log(e);
		 if (typeof(players[socket.id]) !== "undefined")
		 {
			 var battle = players[socket.id].findBattle();
			 if (battle !== null)
			 {
				 battle.temp_leave(players[socket.id].name);
			 }
			 players[socket.id].save();
			 delete players[socket.id];
			 if (typeof(sockets[socket.id]) !== "undefined") delete sockets[socket.id];
			 if (typeof(queue[socket.id]) !== "undefined") delete queue[socket.id];
			 console.log("Socket " + socket.id + " has left");
			 socket.destroy();
		 }
	 });
	 socket.on('end', () =>
	 {
		 if (typeof(players[socket.id]) !== "undefined")
		 {
			 var battle = players[socket.id].findBattle();
			 if (battle !== null)
			 {
				 battle.temp_leave(players[socket.id].name);
			 }
			 players[socket.id].save();
			 delete players[socket.id];
		 }
		 if (typeof(sockets[socket.id]) !== "undefined") delete sockets[socket.id];
		 if (typeof(queue[socket.id]) !== "undefined") delete queue[socket.id];
		 console.log("Socket " + socket.id + " has left");
	 });
 });
 
 /*
  * Client
  */
 
 app.all('*', (req, res) =>
 {
	 if (req.url === "/")
		 res.sendFile(__dirname + "/public/index.html");
	 else
	 {
		 var path = __dirname + "/public/" + req.url;
		 path = path.split("?")[0];
		 fs.access(path, fs.F_OK, (err) =>
		 {
			 if (err)
				 return;
			 res.sendFile(path);
		 })
	 }
 });
 
 app.listen(client_port, () =>
 {
	 console.log("Client Running on port " + client_port);
 });
 
 server.listen(port, "0.0.0.0", () =>
 {
	 console.log("Server started on port " + port);
	 notifier.notify(
	 {
		 title: "GTanks",
		 message: "Server started on port " + port
	 });
 });