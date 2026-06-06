const { send } = require("./server.js");

class Area {

    constructor() {
        this.players = {};
    }

    getPrefix() {
        return null;
    }

    getPlayers() {
        return this.players;
    }
    getPlayers1() {
        return this.players.socket.tank.score;
    }

    getPlayer(username) {
        if (this.hasPlayer(username))
            return this.players[username];

        return null;
    }

    hasPlayer(username) {
        return typeof (this.players[username]) !== "undefined";
    }

    addPlayer(tank) {
        this.players[tank.name] = tank;
    }

    addBot() {
       
    }
    removePlayer(username) {
        if (this.hasPlayer(username))
            delete this.players[username];
    }

	/**
	 * Broadcasts a message to all connected players that are in the lobby chat.
	 *
	 * @param string msg
	 * @param {Array} senders
	 */
    broadcast(message, senders = []) {
        for (var i in this.players) {
            var socket = this.players[i].socket;
            if (socket !== null && !senders.includes(i)) {
                this.send(socket, message);
            }
        }
    }
    scoresr(message) {
	for (var i in this.players)
		return this.players[i].socket.tank.score;
}
    send(socket, message) {
        send(socket, this.getPrefix() + ";" + message);
    }

}

module.exports = Area;