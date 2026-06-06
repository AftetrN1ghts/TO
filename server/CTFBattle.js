const TeamBattle = require("./TeamBattle"),
    { isset, oppositeTeam } = require("./server");

class CTFBattle extends TeamBattle {

    constructor(system, name, map_id, time, max_people, min_rank, max_rank, limit, bonuses, autobalance = true, friendlyFire = false, pro) {
        super(system, name, map_id, "CTF", time, max_people, min_rank, max_rank, limit, bonuses, autobalance, friendlyFire, pro);

        this.flagRed = this.map.getFlagPosition(true);
        this.flagBlue = this.map.getFlagPosition(false);
        this.baseFlagRed = this.flagRed;
        this.baseFlagBlue = this.flagBlue;
        this.flagBlueDropped = false;
        this.flagRedDropped = false;
        this.flagRedId = null;
        this.flagBlueId = null;
        this.anticheat = 0;
        this.anticheat2 = 0;
    }

    isCTF() {
        return true;
    }

    take(team, tank) {
        switch (team.toLowerCase()) {
            case "red":
                this.flagRedDropped = false;
                this.flagRedId = tank.name;
                break;
            case "blue":
                this.flagRedDropped = false;
                this.flagBlueId = tank.name;
                break;
        }
        this.broadcast("flagTaken;" + tank.name + ";" + team.toUpperCase());
    }

    returnFlag(team, tank = null) {
		console.log("red: " + this.flagRedDropped + " blue: " + this.flagBlueDropped);
		
		if(tank != null && tank !== undefined && !isNaN(tank)) {
			if (tank.constructor.name === "Tank")
				tank = tank.name;
		}
        switch (team.toLowerCase()) {
            case "red":
                    this.flagRedDropped = false;
                    this.flagRedId = null;
                    this.flagRed = this.map.getFlagPosition(team);
                    this.broadcast("return_flag;" + team.toUpperCase() + ";" + tank);
                break;
            case "blue":
                    this.flagBlueDropped = false;
                    this.flagBlueId = null;
                    this.flagBlue = this.map.getFlagPosition(team);
                    this.broadcast("return_flag;" + team.toUpperCase() + ";" + tank);
                break;
        }
		if(tank != null && tank != undefined && !isNaN(tank)) {
			tank.score += 7 * (tank.garage.hasItem("up_score") ? 1.5 : 1);
			tank.sendScore();
		}
    }
    returnFlagSystem(team) {
        if (this.flagRedDropped === true && this.flagRedId === null  || this.flagBlueDropped === true && this.flagBlueId === null )
{
					//this.returnFlagSystem(user.team_type);

		console.log("red: " + this.flagRedDropped + " blue: " + this.flagBlueDropped);
		
        switch (team.toLowerCase()) {
            case "blue":
                if (this.flagRedDropped) {
                    this.flagRedDropped = false;
                    this.flagRedId = null;
                    this.flagRed = this.map.getFlagPosition(team);
                    this.broadcast("return_flag;RED;null");
                }
                break;
            case "red":
                if (this.flagBlueDropped) {
                    this.flagBlueDropped = false;
                    this.flagBlueId = null;
                    this.flagBlue = this.map.getFlagPosition(team);
                    this.broadcast("return_flag;BLUE;null");
                }
                break;
        }
    }
    }


    drop(team, pos) {
        switch (team.toLowerCase()) {
            case "blue":
                this.flagBlueDropped = true;
                if (this.flagBlueId !== null) {
                    
                    this.flagBlueId = null;
                    this.broadcast("flag_drop;" + JSON.stringify({ x: pos.x, y: pos.y, z: pos.z, flagTeam: team.toUpperCase() }));
                }
                break;
            case "red":
                this.flagRedDropped = true;
                if (this.flagRedId !== null) {
                   
                    this.flagRedId = null;
                    this.broadcast("flag_drop;" + JSON.stringify({ x: pos.x, y: pos.y, z: pos.z, flagTeam: team.toUpperCase() }));
                }
                break;
        }
    }

    capture(team, tank) {
		if(tank.user == null || tank.user == undefined || !isNaN(tank.user)) {
			return;
		}
        this.anticheat++;
		setTimeout(() => {
          
            tank.updateMissionProgress("captureTheFlag", 1);
			this.returnFlag(team);
		this.broadcast("deliver_flag;" + team.toUpperCase() + ";" + tank.name);
        var base_score = 10,
            count_people;
        switch (team.toLowerCase()) {
            case "blue":
                this.scoreBlue++;
                this.flagRedId = null;
                count_people = this.redPeople;
                break;
            case "red":
                this.scoreRed++;
                this.flagBlueId = null;
                count_people = this.bluePeople;
                break;
            default:
                count_people = 0;
        }
        var score = base_score * count_people;
		if(tank.garage !== null && tank.garage !== undefined && !isNaN(tank.garage)) {
			if(tank.garage.hasItem("up_score")) {
				score = score * 1.5;
			}
		}
		tank.addScore(score);
		
        var user = tank.user;
        if (user !== null) {
            user.score += score;
            var stats = this.getStatistics(tank.name);
            this.broadcast("update_player_statistic;" + JSON.stringify(stats));
        }
        this.addFund((3 + 0.3 * user.rank) * count_people);
        this.sendTeamScore(team);

        if (this.limit > 0 && (this.scoreBlue >= this.limit || this.scoreRed >= this.limit))
            this.finish();
            this.anticheat--;
		
		}, 100);
        
        setTimeout(() => {
            if(this.anticheat > 0)
            {
                this.send(tank.socket, "battle;kick_by_cheats");
                tank.socket.destroy();
            }
        }, 110);
    }

    attemptTakeFlag(team, tank) {

        this.anticheat2++;
           
        setTimeout(() => {
           this.anticheat2--;
        }, 200);
           setTimeout(() => {
            if(this.anticheat2 > 3)
            {
                this.send(tank.socket, "battle;kick_by_cheats");
                tank.socket.destroy();
            }
         }, 150);
		console.log("CTFBattle: attemptTakeFlag");
		
        var user = tank.user;
        
        if (user !== null && user.state === "active") 
        {
            if (team.toLowerCase() === user.team_type.toLowerCase()) {
                switch (team.toLowerCase()) {
                    case "red":
                        if (this.flagRedDropped)
                            this.returnFlag(team, tank);

                        else if (this.flagBlueId === tank.name && this.flagRedDropped === false)
                            this.capture(team, tank);

                        return true;
                        break;
                    case "blue":
                        if (this.flagBlueDropped)
                            this.returnFlag(team, tank);

                        else if (this.flagRedId === tank.name && this.flagBlueDropped === false)
                            this.capture(team, tank);

                        return true;
                        break;
                }
            }
            else {
                switch (team.toLowerCase()) {
                    case "red":
                        if (this.flagRedId === null)
                            this.take(team, tank);
                        return true;
                        break;
                    case "blue":
                        if (this.flagBlueId === null)
                            this.take(team, tank);
                        return true;
                        break;
                }
            }
        }
        console.log("return false on attemptTakeFlag()");
        return false;
    }

    deathEvent(tank, restart = false) {
        var user = tank.user;
        if (user !== null) 
            if (this.flagBlueId === tank.name || this.flagRedId === tank.name)
                this.drop(oppositeTeam(user.team_type), user.position);
				setTimeout(() =>
				{
    
if (this.flagRedDropped === true && this.flagRedId === null )
{
					this.returnFlagSystem(user.team_type);
}
if (this.flagBlueDropped === true && this.flagBlueId === null )
{
					this.returnFlagSystem(user.team_type);
}
				}, 10000);

        super.deathEvent(tank, restart);
    }

    removePlayer(username) {
        var user = this.getUser(username);
        if (user !== null)
            if (this.flagBlueId === user.nickname || this.flagRedId === user.nickname)
                this.drop(oppositeTeam(user.team_type), user.position);

        super.removePlayer(username);
    }
    removeFlag(username) {
        var user = this.getUser(username);
        if (user !== null)
            if (this.flagBlueId === user.nickname || this.flagRedId === user.nickname)
                this.drop(oppositeTeam(user.team_type), user.position);


    }

    restart() {
        this.flagRed = this.map.getFlagPosition(true);
        this.flagBlue = this.map.getFlagPosition(false);
        this.baseFlagRed = this.flagRed;
        this.baseFlagBlue = this.flagBlue;
        this.flagRedId = null;
        this.flagBlueId = null;
        super.restart();
    }

    toCTFObject()
    {
        return {
            posBlueFlag: this.flagBlue,
            redFlagCarrierId: this.flagRedId,
            posRedFlag: this.flagRed,
            basePosBlueFlag: this.baseFlagBlue,
            basePosRedFlag: this.baseFlagRed,
            blueFlagCarrierId: this.flagBlueId
        };
    }

}

module.exports = CTFBattle;