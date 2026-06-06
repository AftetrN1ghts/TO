const lobby = require("./Lobby"),
    {
        c,
        send,
        getNextScore,
        getNextReward,
        players,
        isset,
        sockets,
        save,
        Kick,
        mt_rand
    } = require("./server"),
    Garage = require("./Garage");

class Tank {
    static fromJSON(data) {
        var date = new Date();
        if (typeof(data.name) === "undefined")
            return null;
        var tank = new Tank(data.name, c(data.password, "default"), c(data.tester, false));
        tank.score = c(data.score, 0);
        tank.banTime = c(data.banTime, date.getTime());
        tank.banReason = c(data.banReason, "")
        tank.rank = c(data.rank, 1);
        tank.rating = c(data.rating, 1);
        tank.crystals = c(data.crystall, 500);
        tank.block = c(data.block, false);
        tank.place = c(data.place, 0);
        tank.email = c(data.email, null);
        tank.battleId = c(data.battleId, null);
        tank.roles = c(data.roles, []);
        tank.updateRankScores();
        tank.mission = c(data.mission, null);
        tank.missionProgress = c(data.missionProgress, 0);
        tank.ip = c(data.ip, "");
        tank.mission2 = c(data.mission2, null);
        tank.missionProgress2 = c(data.missionProgress2, 0);
        tank.mission3 = c(data.mission3, null);
        tank.missionProgress3 = c(data.missionProgress3, 0);
        tank.missionCount = c(data.missionCount, 0);
        tank.missionTime = c(data.missionTime, new Date().getTime() + 43200000)
        tank.n2o = c(data.n2o, 0);
        if (typeof(data.garage) === "undefined")
            tank.garage = new Garage(tank);
        else {
            data.garage.tank = tank;
            var garage = Garage.fromJSON(data.garage);
            tank.garage = garage;
        }
        return tank;
    }

    constructor(name, pw) {
        var date = new Date();
        this.name = name;
        this.password = pw;
        this.score = 0;
        this.banTime = date.getTime();
        this.banReason = "";
        this.rank = 1;
        this.maxRank = 30;
        this.rating = 1;
        this.crystals = 500;
        this.block = false;
        this.updateRankScores();
        this.place = 0;
        this.roles = ["plaer"];
        this.mission = this.getMission();
        this.missionProgress = 0;
        this.mission2 = this.getMission();
        this.missionProgress2 = 0;
        this.mission3 = this.getMission();
        this.missionProgress3 = 0;
        this.missionCount = 0;
        this.missionTime = new Date().getTime() + 43200000;
        this.email = null;
        this.ip = "";
        this.garage = new Garage(this);
        this.battleId = null;
        this.spectateBattleId = null;
        this.battle = null;
        this.user = null;
        this.socket = null;
    }

    updateMission(type)
    {
        if(type === "1")
        {
            this.mission = this.getMission();
            this.missionProgress = 0;
        }
        else if(type === "2")
        {
            this.mission2 = this.getMission();
            this.missionProgress2 = 0;
        }
        else if(type === "3")
        {
            this.mission3 = this.getMission();
            this.missionProgress3 = 0;
        }
    }
    cleanMission(type)
    {
        if(type === "1")
        {
        if (this.missionProgress >= this.mission["target_progress"]) {
            var arrayLength = this.mission["prizesId"].length;
           this.missionCount++;
    
            var obj = {
            prizes:[
            ]};



            for (var i = 0; i < arrayLength; i++) {
                obj['prizes'].push({
                    "count": this.mission["prizesCount"][i],
                    "nameId": this.mission["prizesId"][i]
                });
                if (this.mission["prizesId"][i] === "CRYSTALLS") {
                    console.log(this.mission["prizesCount"][i])
                    this.crystals += this.mission["prizesCount"][i];
                    this.sendCrystals();
                } else
                
                {
                    this.garage.addGarageItem(this.mission["prizesId"][i], this.mission["prizesCount"][i])
                } 
            }
        
        
            this.mission["id"] = null;
            this.missionProgress = null;
        }
    }
        if(type === "2")
        {
        
        if (this.missionProgress2 >= this.mission2["target_progress"]) {
          
            var arrayLength = this.mission2["prizesId"].length;
           this.missionCount++;
    
     



            for (var i = 0; i < arrayLength; i++) {
             
                if (this.mission2["prizesId"][i] === "CRYSTALLS") {
                    console.log(this.mission2["prizesCount"][i])
                    this.crystals += this.mission2["prizesCount"][i];
                    this.sendCrystals();
                } else
                
                {
                    this.garage.addGarageItem(this.mission2["prizesId"][i], this.mission2["prizesCount"][i])
                } 
            }
        
      
            this.mission2["id"] = null;
            this.missionProgress2 = null;
        }
        
        }
        if(type === "3")
        {
        
        if (this.missionProgress3 >= this.mission3["target_progress"]) {
          
            var arrayLength = this.mission3["prizesId"].length;
           this.missionCount++;
    
          



            for (var i = 0; i < arrayLength; i++) {
               
                if (this.mission3["prizesId"][i] === "CRYSTALLS") {
                    console.log(this.mission3["prizesCount"][i])
                    this.crystals += this.mission3["prizesCount"][i];
                    this.sendCrystals();
                } else
                
                {
                    this.garage.addGarageItem(this.mission3["prizesId"][i], this.mission3["prizesCount"][i])
                } 
            }
        

            this.mission3["id"] = null;
            this.missionProgress3 = null;
        }

        
    }
  
    }

    getMission() {

        return JSON.parse(require('file-system').readFileSync("public/missions/" + mt_rand(0, 16) + ".json", "utf8"));
    }
    getCurrentMission() {

        if(this.mission === null)
        {
            this.mission = this.getMission();
        }
        if(this.mission2 === null)
        {
            this.mission2 = this.getMission();
        }
        if(this.mission3 === null)
        {
            this.mission3 = this.getMission();
        }
        if(this.missionTime < new Date().getTime())
        {
            this.missionTime = new Date().getTime() + 43200000;
            if(this.missionProgress === null)
            {
            this.mission = this.getMission();
            
            this.missionProgress = 0;
            this.send("lobby;quest_new")
            }
            if(this.missionProgress2 === null)
            {
            this.mission2 = this.getMission();
            this.missionProgress2 = 0;
            this.send("lobby;quest_new")
            }
            if(this.missionProgress3 === null)
            {
            this.mission3 = this.getMission();
            this.missionProgress3 = 0;
            this.send("lobby;quest_new")
            }
        }
        return {
            changeCost: 10 * this.rank,
            quest1: {
                 description: this.mission["description"],
                 id: this.mission["id"],
                 target_progress: this.mission["target_progress"],
                 progress: this.missionProgress,
                 prizes: this.mission["prizes"],
                 },
           quest2: {
                    description: this.mission2["description"],
                    id: this.mission2["id"],
                    target_progress: this.mission2["target_progress"],
                    progress: this.missionProgress2,
                    prizes: this.mission2["prizes"]
                    },
                    quest3: {
                        description: this.mission3["description"],
                        id: this.mission3["id"],
                        target_progress: this.mission3["target_progress"],
                        progress: this.missionProgress3,
                        prizes: this.mission3["prizes"]
                        }
        };
    }
    updateMissionProgress(typeMission, count) {
        if (this.mission["id"] === typeMission) {
            this.missionProgress += count;
            if(this.missionProgress >= this.mission["target_progress"])
            {
                this.send("lobby;quest_new")
            }
            
        }
        if (this.mission2["id"] === typeMission) {
            if(this.missionProgress2 >= this.mission2["target_progress"])
            {
                this.send("lobby;quest_new")
            }
            this.missionProgress2 += count;
        }
        if (this.mission3["id"] === typeMission) {
            if(this.missionProgress3 >= this.mission3["target_progress"])
            {
                this.send("lobby;quest_new")
            }
            this.missionProgress3 += count;
        }
    }


    isOwner() {
        return this.roles.includes("owner") || this.roles.includes("programmer");
    }
    isSponsor() {
        return this.roles.includes("sponsor");
    }

    isAdmin() {
        return this.isOwner() || this.roles.includes("admin");
    }

    isModerator() {
        return this.isAdmin() || this.roles.includes("moderator");
    }

    isСandModerator() {
        return this.roles.includes("cmoderator");
    }
    isProgrammer() {
        return this.isOwner();
    }
    isSpectator() {
        return this.isModerator() || this.isSponsor();
    }

    addRole(role) {
        this.roles.push(role);
        this.save();
    }

    removeRole(role) {
        for (var i in this.roles)
            if (this.roles[i] === role)
                this.roles.splice(i, 1);
        this.save();
    }

    removeRoles() {
        this.roles = [];
        this.save();
    }

    leaveBattle() {
        this.battle = null;
        this.user = null;
        this.battleId = null;
    }

    isOnline() {
        return this.socket !== null;
    }

    isOffline() {
        return !this.isOnline();
    }

    setOnline(socket) {
        if (socket.constructor.name === "Socket")
            this.socket = socket;
    }

    setOffline() {
        this.socket = null;
    }

    getSocket() {
        return this.socket;
    }

    sendCrystals() {
        this.send("lobby;add_crystall;" + this.crystals);
        this.save();
    }

    addScore(score) {
        this.updateMissionProgress("gainScore", score);
        this.score += score;
        this.save();
        this.sendScore();
    }

    sendScore(rank = true) {
        if (this.isOffline())
            return;

        this.send("lobby;add_score;" + this.score);
        var rank = this.rank;

        while (this.score >= this.next_score && this.next_score > 0)
            this.rankup();

        for (var prev_score = getNextScore(this.rank - 1); prev_score > 0 && this.score < prev_score; prev_score = getNextScore(this.rank - 1))
            this.rankdown();

        if (rank !== this.rank)
            this.send("lobby;update_rang;" + this.rank + ";" + this.next_score);

        if (rank) {
            this.updateRankProgress();
            this.send("lobby;update_rang_progress;" + this.rank_progress);
        }

        this.save();
    }

    sendProgress() {
        if (this.isOnline()) {
            this.updateRankProgress();
            this.send("lobby;update_rang_progress;" + this.rank_progress);
        }
    }

    rankup() {
        this.rank++;
        this.updateRankScores();

        //  if (this.rank > this.maxRank) {
        this.maxRank = this.rank;
        this.crystals += getNextReward(this.rank - 1);
        this.sendCrystals();
        //  }

        if (this.user !== null)
            this.user.newrank(this.rank);
    }

    rankdown() {
        this.rank--;
        this.updateRankScores();

        if (this.user !== null)
            this.user.newrank(this.rank);
    }

    updateRankScores() {
        this.next_score = getNextScore(this.rank);
        this.updateRankProgress();
    }

    findBattle() {
        if (this.battle !== null)
            return this.battle;
        if (this.spectateBattleId === null)
            return lobby.findBattle(this.battleId);
        return lobby.findBattle(this.spectateBattleId);
    }

    findSocket() {
        for (var i in players) {
            if (players[i].name === this.name) {
                if (isset(sockets[i]))
                    return sockets[i];
            }
        }
        return null;
    }

    getProperties() {
        var properties = {
                turret: {},
                hull: {},
                paint: {}
            },
            tank_data = {
                turret: this.garage.getTurret(),
                hull: this.garage.getHull(),
                paint: this.garage.getPaint()
            };

        for (var i in tank_data.turret.properts) {
            if (isset(tank_data.turret.properts[i].property) && isset(tank_data.turret.properts[i].value))
                properties.turret[tank_data.turret.properts[i].property] = tank_data.turret.properts[i].value;
        }

        for (var j in tank_data.hull.properts) {
            if (isset(tank_data.hull.properts[j].property) && isset(tank_data.hull.properts[j].value))
                properties.hull[tank_data.hull.properts[j].property] = tank_data.hull.properts[j].value;
        }

        for (var k in tank_data.paint.properts) {
            if (isset(tank_data.paint.properts[k].property) && isset(tank_data.paint.properts[k].value))
                properties.paint[tank_data.paint.properts[k].property] = tank_data.paint.properts[k].value;
        }

        return properties;
    }

    updateRankProgress() {

        if (this.rank <= 0) {
            this.rank_progress = 10000;
            return;
        }

        var score = getNextScore(this.rank - 1);
        if (this.next_score - score > 0)
            this.rank_progress = (this.score - score) / (this.next_score - score) * 10000;
        else
            this.rank_progress = 10000;

        if (this.rank_progress > 10000)
            this.rank_progress = 10000;
    }

    sendPanel() {
        this.send("lobby;init_panel;" + JSON.stringify(this.toObject()));
    }

    send(message) {
        if (this.isOnline()) {
            send(this.getSocket(), message);
        }
    }

    save() {
        save(this.name, this.toSaveObject());
    }

    getInventory() {
        return this.garage.getInventory();
    }

    toObject() {
        return {
            name: this.name,
            tester: this.tester,
            score: this.score,
            banTime: this.banTime,
            banReason: this.banReason,
            rank: this.rank,
            rating: this.rating,
            crystall: this.crystals,
            block: this.block,
            next_score: this.next_score,
            place: this.place,
            rang: this.rank,
            email: this.email,
            ip: this.ip,
            mission: this.mission,
            missionProgress: this.missionProgress,
            mission2: this.mission2,
            missionProgress2: this.missionProgress2,
            mission3: this.mission3,
            missionProgress3: this.missionProgress3,
            missionTime: this.missionTime,
            missionCount: this.missionCount
        };
    }

    toSaveObject() {
        return {
            name: this.name,
            password: this.password,
            tester: this.tester,
            score: this.score,
            banTime: this.banTime,
            banReason: this.banReason,
            battleId: this.battleId,
            rank: this.rank,
            maxRank: this.maxRank,
            roles: this.roles,
            block: this.block,
            rating: this.rating,
            crystall: this.crystals,
            place: this.place,
            rang: this.rank,
            email: this.email,
            mission: this.mission,
            missionProgress: this.missionProgress,
            mission2: this.mission2,
            ip: this.ip,
            missionProgress2: this.missionProgress2,
            mission3: this.mission3,
            missionProgress3: this.missionProgress3,
            missionTime: this.missionTime,
            missionCount: this.missionCount,
            garage: this.garage.toSaveObject()
        };
    }

    kick() {
        Kick(this.getSocket(), this);
    }
}

exports.Tank = Tank;