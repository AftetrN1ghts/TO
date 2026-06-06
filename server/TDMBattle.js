const TeamBattle = require("./TeamBattle");

class TDMBattle extends TeamBattle {

    constructor(system, name, map_id, time, max_people, min_rank, max_rank, limit, bonuses = true, autobalance = true, friendlyFire = false, pro = false) {
        super(system, name, map_id, "TDM", time, max_people, min_rank, max_rank, limit, bonuses, autobalance, pro);
    this.limit = limit;
}

checkLimitDM(score){
      if (this.limit > 0 && this.limit <= this.scoreRed || this.limit <= this.scoreBlue)
            this.finish();
		}

    isTDM() {
        return true;
    }

    kill(nickname, killer = null) {
        super.kill(nickname, killer);

        if (killer !== null) {
            switch (killer.team_type.toLowerCase()) {
                case "red":
                    this.scoreRed++;
                    this.sendTeamScore(killer.team_type);
                    break;
                case "blue":
                    this.scoreBlue++;
                    this.sendTeamScore(killer.team_type);
                    break;
            }
        }
    }
}

module.exports = TDMBattle;