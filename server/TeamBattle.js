const
    lobby = require("./Lobby"),
    Battle = require("./Battle"),
    { isset, getTankByName } = require("./server");

class TeamBattle extends Battle {

    constructor(system, name, map_id, type, time, max_people, min_rank, max_rank, limit, bonuses = true, autobalance, friendlyFire = false, pro = false) {
        super(system, name, map_id, type, time, max_people, min_rank, max_rank, limit, bonuses = true, autobalance, friendlyFire = false, pro = false);
        this.friendlyFire = friendlyFire;
        this.autobalance = autobalance;
        this.limit = limit;
        this.team = true;
        this.redPeople = 0;
        this.bluePeople = 0;
        this.scoreRed = 0;
        this.scoreBlue = 0;
    }

    getTeamCount() {
        return 2;
    }

    sendTeamScore(team_type) {
        this.broadcast("change_team_scores;" + team_type.toUpperCase() + ";" + (team_type.toLowerCase() === "red" ? this.scoreRed : this.scoreBlue));
    }

    sendTeamScores() {
        this.send2Users("change_team_scores;BLUE" + this.scoreBlue);
        this.send2Users("change_team_scores;RED;" + this.scoreRed);
if(this.limit === this.scoreBlue || this.scoreRed){
this.restart();
}
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

    leave(username) {
        for (var i in this.users) {
            if (this.users[i].nickname === username) {
                if (this.users[i].team_type.toLowerCase() === "blue")
                    this.bluePeople--;
                else
                    this.redPeople--;
            }
        }

        super.leave(username);
    }

    updateCount() {
        lobby.broadcast("update_count_users_in_team_battle;" + JSON.stringify({ battleId: this.battleId, redPeople: this.redPeople, bluePeople: this.bluePeople }));
    }

    broadcastTeam(msg, team_player, senders = [], wait = true) {
        var user = this.getUser(team_player);
        if (user !== null) {
            var team = user.team_type.toLowerCase();
            for (var i in this.users) {
                if (this.users[i].state !== null && this.users[i].team_type.toLowerCase() === team) {
                    var socket = this.users[i].tank.findSocket();
                    if (socket !== null) {
                        if (!senders.includes(this.users[i].nickname)) {
                            if (wait)
                                send(socket, msg);
                            else
                                write(socket, msg + "end~");
                        }
                    }
                }
            }
        }
        return true;
    }

    addPlayer(tank, team = null, score = 0) {

        var res = super.addPlayer(tank, team, score);

        if (res !== null) {
            switch (team.toLowerCase()) {
                case "red":
                    this.redPeople++;
                    break;
                case "blue":
                    this.bluePeople++;
                    break;
            }
        }

        this.updateCount();

        return res;
    }

  processMessage(tank, message, spectator = false) {
		 var user = tank.user;
		  if (tank.isSponsor()){ var chatPerm =  10}
		  if (tank.isModerator()){ var chatPerm =  3}

 if (tank.isOwner()){ var chatPerm =  1}

        if (!spectator)
{
			if(tank.banTime < new Date().getTime()){
            this.broadcast("chat;" + JSON.stringify({ system: false, nickname: tank.name, rank: tank.rank, team_type: user.team_type, message: message, chat_level: chatPerm }));
			}
			else
			{
				this.sendSystem(tank, "Вы отключены от чата. Вы вернётесь в ЭФИР через " + Math.round((tank.banTime - new Date().getTime()) / 1000 / 60) + " минут(ы). Причина: " + tank.banReason);
			
			}
}
        else if (tank.isOwner()){
            this.broadcast("spectator_message;" + message);}
    }

    restart() {
        this.scoreRed = 0;
        this.scoreBlue = 0;
        this.sendTeamScores();

        super.restart();
    }

    toGUIObject(user) {
        return {
            timeLimit: this.timeLimit,
            fund: this.fund,
            name: this.name,
            score_blue: this.scoreBlue,
            currTime: this.timeLeft(),
            team: this.team,
            scoreLimit: this.limit,
            score_red: this.scoreRed,
            users: this.toUserArray(false)
        };
    }

    toDetailedObject(tank) {
        var obj = {
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
            scoreRed: this.scoreRed,
            scoreBlue: this.scoreBlue,
            timeCurrent: this.timeLeft(),
            minRank: this.min_rank,
            name: this.name,

            spectator: tank.roles.includes("sponsor") || tank.roles.includes("moderator"),
            userAlreadyPaid: this.userPaid(tank.name),
            maxPeople: this.maxPeople,
            previewId: this.previewId,
            maxRank: this.max_rank
        };
        return obj;
    }

    toFinishObject() {
		console.log("TeamBattle: toFinishObject");
		
        if (this.scoreRed < 1) {
            this.scoreRed = 1;
            ++this.scoreBlue;
        }

        if (this.scoreBlue < 1) {
            this.scoreBlue = 1;
            ++this.scoreRed;
        }

        var blueTeam = this.getTeamUsers("BLUE"),
            redTeam = this.getTeamUsers("RED"),
            blueFund =  Math.round(this.scoreBlue / (this.scoreRed + this.scoreBlue) * this.fund),
            redFund =   Math.round(this.scoreRed / (this.scoreRed + this.scoreBlue) * this.fund),
            sumBlueScore = 0,
            sumRedScore = 0,
            prizes = {};

        if (blueTeam.length <= 0 && redTeam.length <= 0)
            return { time_to_restart: 10000, users: [] };

        if (blueTeam.length > 0) {
            for (var i in blueTeam)
                sumBlueScore += blueTeam[i].score;

            if (sumBlueScore === 0) {
                sumBlueScore = blueTeam.length;
                for (var i in blueTeam) {
                    blueTeam[i].score = 1;
                    blueTeam[i].scoreZero = true;
                }
            }
        }
        else
            redFund += blueFund;

        if (redTeam.length > 0) {
            for (var i in redTeam)
                sumRedScore += redTeam[i].score;

            if (sumRedScore === 0) {
                sumRedScore = redTeam.length;
                for (var i in redTeam) {
                    redTeam[i].score = 1;
                    redTeam[i].scoreZero = true;
                }
            }
        }
        else
            blueFund += redFund;

        for (var i in blueTeam)
            prizes[blueTeam[i].nickname] = Math.round((blueTeam[i].score / sumBlueScore) * blueFund);

        for (var i in redTeam)
            prizes[redTeam[i].nickname] = Math.round((redTeam[i].score / sumRedScore) * redFund);

        var users = [];
        for (var i in this.users) {
            users.push({
                kills: this.users[i].kills,
                score: this.users[i].scoreZero ? 0 : this.users[i].score,
                rank: this.users[i].rank,
                team_type: this.users[i].team_type.toUpperCase(),
                id: this.users[i].nickname,
                prize: isset(prizes[this.users[i].nickname]) ? prizes[this.users[i].nickname] : 0,
                deaths: this.users[i].deaths
            });
        }

        return { time_to_restart: 10000, users: users };
    }

    getTeamUsers(team) {
        var teamA = [];
        for (var i in this.users) {
            if (this.users[i].team_type.toLowerCase() === team.toLowerCase())
                teamA.push(this.users[i]);
        }
        return teamA;
    }

    getScore(team) {
        switch (team.toLowerCase()) {
            case "red":
                return this.scoreRed;
                break;
            case "blue":
                return this.scoreBlue;
                break;
        }
        return 0;
    }

    toObject() {
        return {
            isPaid: this.isPaid,
            battleId: this.battleId,
            countPeople: this.countPeople,
            redPeople: this.redPeople,
            minRank: this.min_rank,
            name: this.name,
            mapId: this.mapId,
            team: this.team,
            bluePeople: this.bluePeople,
            maxPeople: this.maxPeople,
            previewId: this.previewId,
            maxRank: this.max_rank
        };
    }

}

module.exports = TeamBattle;