const Battle = require("./Battle");
const { BattleUser } = require("./BattleUser"),
    { isset } = require("./server");

class DMBattle extends Battle {

    constructor(system, name, map_id, time, max_people, min_rank, max_rank, limit, bonuses = true, pro = false) {
        super(system, name, map_id, "DM", time, max_people, min_rank, max_rank, limit, bonuses = true, pro = false);

    }

checkLimitDM(score){
      if (this.limit > 0 && score >= this.limit)
            this.finish();
		}

    isDM() {
        return true;
    }

    toFinishObject() {
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

        if (sumScore === 0) {
            sumScore = Object.keys(users).length;
            for (var i in users) {
                users[i].kills = 1;
                users[i].scoreZero = true;
            }
        }

        for (var i in users)
            prizes[users[i].nickname] = Math.round((users[i].kills / sumScore) * this.fund);

        var userRewards = [];
        for (var i in users) {
            userRewards.push({
                kills: users[i].scoreZero ? 0 : users[i].kills,
                score: users[i].scoreZero ? 0 : users[i].kills,
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

}

module.exports = DMBattle;