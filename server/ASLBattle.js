const TeamBattle = require("./TeamBattle"),
    { isset, oppositeTeam, getTankByName } = require("./server");

class ASLBattle extends TeamBattle
{	
    constructor(name, map_id, time, max_people, min_rank, max_rank, limit, bonuses = true, autobalance = true, friendlyFire = false, pro = false) {
        super(name, map_id, "DOM", time, max_people, min_rank, max_rank, limit, bonuses, autobalance, friendlyFire, pro);

        this.pointsStatus = [];
        this.points = [];
        this.lastTeamScoreUpdateTime = Date.now();

        this.standartScoreTimeout = 12000;

        for (var i = 0; i < this.map.getDOMPointsCount(); i++) {
            this.pointsStatus.push("NEUTRALIZED");
            this.addNewPoint(i);
        }
        setInterval(() => { this.pointsUpdate(); }, 100);
    }

    addNewPoint(id) {
        var position = this.map.getDOMPoint(id)
        var occupated_users = [];
        var point = {
            score: 0.0,
            occupated_users: occupated_users,
            x: position.x,
            y: position.y,
            z: position.z + 300,
            id: id,
            radius: 1000.0
        };
        this.points.push(point);
    }

    isASL() {
        return true;
    }

    startCapturingPoint(id, tank = null) {
        var user = tank.user;
        var point = this.points[id];
        switch (user.team_type.toLowerCase()) {
            case "red":
                {
                    this.broadcast("tank_capturing_point;" + id + ";" + tank.name, [tank.name]);
                    point.occupated_users.push(tank.user);
                    this.updatePointScore(id, point.score);
                }
                break;
            case "blue":
                {
                    this.broadcast("tank_capturing_point;" + id + ";" + tank.name, [tank.name]);
                    point.occupated_users.push(tank.user);
                    this.updatePointScore(id, point.score);
                }
                break;
        }
    }

    stopCapturingPoint(id, tank = null) {
        var user = tank.user;
        var point = this.points[id];
        switch (user.team_type.toLowerCase()) {
            case "red":
                {
                    this.broadcast("tank_leave_capturing_point;" + tank.name + ";" + id, [tank.name]);
                    for (var i = 0; i < point.occupated_users.length; i++) {
                        var user = point.occupated_users[i];
                        if (user.nickname == tank.user.nickname) {
                            point.occupated_users.splice(i, 1);
                            break;
                        }
                    }
                    this.updatePointScore(id, point.score);
                }
                break;
            case "blue":
                {
                    this.broadcast("tank_leave_capturing_point;" + tank.name + ";" + id, [tank.name]);
                    for (var i = 0; i < point.occupated_users.length; i++) {
                        var user = point.occupated_users[i];
                        if (user.nickname == tank.user.nickname) {
                            point.occupated_users.splice(i, 1);
                            break;
                        }
                    }
                    this.updatePointScore(id, point.score);
                }
                break;
        }
    }

    pointsUpdate() {
        for (var i = 0; i < this.points.length; i++) {
            var point = this.points[i];
            var currentStatus = this.pointsStatus[i];

            var redCount = this.getPointRedCapturingCount(point.id);
            var blueCount = this.getPointBlueCapturingCount(point.id);

            if (redCount > 0 || blueCount > 0) {

                if (currentStatus === "NEUTRALIZED" && point.score > -100.0 && point.score < 100.0) {
                    var addScore = (redCount * -1) + (blueCount * 1);
                    this.updatePointScore(point.id, point.score + addScore);
                }
                else if (currentStatus === "RED") {
                    var addScore = (redCount * -1) + (blueCount * 1);
                    if (redCount <= blueCount && point.score > -101) {
                        this.updatePointScore(point.id, point.score + addScore);
                    }
                }
                else if (currentStatus === "BLUE") {
                    var addScore = (redCount * -1) + (blueCount * 1);
                    if (blueCount <= redCount && point.score < 101) {
                        this.updatePointScore(point.id, point.score + addScore);
                    }
                }
            }

            this.updateScore();

            if (currentStatus === "NEUTRALIZED" && point.score >= 100) {
                this.newStatus(point.id, "BLUE");
            }
            else if (currentStatus === "NEUTRALIZED" && point.score <= -100) {
                this.newStatus(point.id, "RED");
            }
            else if (currentStatus === "BLUE" || currentStatus === "RED") {
                if (point.score === 0) {
                    this.newStatus(point.id, "NEUTRALIZED");
                }
            }

            if (redCount === 0 && blueCount === 0) {
                if (currentStatus === "NEUTRALIZED") {
                    if (point.score > 0) {
                        point.score -= 2;
                        this.updatePointScore(point.id, point.score);
                    }
                    else if (point.score < 0) {
                        point.score += 2;
                        this.updatePointScore(point.id, point.score);
                    }
                }
                else if (currentStatus === "RED") {
                    if (point.score > -100) {
                        point.score -= 2;
                        this.updatePointScore(point.id, point.score);
                    }
                }
                else if (currentStatus === "BLUE") {
                    if (point.score < 100) {
                        point.score += 2;
                        this.updatePointScore(point.id, point.score);
                    }
                }
            }
        }
    }

    newStatus(id, status) {
        var currentStatus = this.pointsStatus[id];
        switch (status) {
            case "RED":
                {
                    if (currentStatus === "NEUTRALIZED") {
                        this.capturedBy(id, "red");
                        this.extraditeScore(id, "red", "captured");
                    }
                }
                break;
            case "BLUE":
                {
                    if (currentStatus === "NEUTRALIZED") {
                        this.capturedBy(id, "blue");
                        this.extraditeScore(id, "blue", "captured");
                    }
                }
                break;
            case "NEUTRALIZED":
                {
                    if (currentStatus === "RED") {
                        this.lostBy(id, "red");
                        this.extraditeScore(id, "blue", "lost");
                    }
                    else if (currentStatus === "BLUE") {
                        this.lostBy(id, "blue");
                        this.extraditeScore(id, "red", "lost");
                    }
                }
                break;
        }
        this.pointsStatus[id] = status;
    }

    extraditeScore(id, team, action) {
        var users = this.getPointUsersByTeam(id, team);

        for (var i = 0; i < users.length; i++) {
            var user = users[i];
            var tank = getTankByName(user.nickname);
            var oppositeTeamSize = (oppositeTeam(user.team_type) == "RED") ? this.redPeople : this.bluePeople;
            var lostScore = 10 * oppositeTeamSize;
            var capturedScore = 20 * oppositeTeamSize;

            if (action === "lost") {
                console.log(user.nickname + " is getting " + lostScore + " for losing the point");
                user.score += lostScore;
                tank.addScore(lostScore * (tank.garage.hasItem("up_score") ? 1.5 : 1));
                var stats = this.getStatistics(tank.name);
                this.broadcast("update_player_statistic;" + JSON.stringify(stats));
                tank.sendScore();
				this.addFund((3 + 0.03 * user.rank) * oppositeTeamSize);
            }
            else if (action === "captured") {
                console.log(user.nickname + " is getting " + capturedScore + " for capturing the point");
                user.score += capturedScore;
                tank.addScore(capturedScore * (tank.garage.hasItem("up_score") ? 1.5 : 1));
                var stats = this.getStatistics(tank.name);
                this.broadcast("update_player_statistic;" + JSON.stringify(stats));
                tank.sendScore();
                this.addFund((5 + 0.05 * user.rank) * oppositeTeamSize);
            }
        }
    }

    updateScore() {
        for (var i = 0; i < this.points.length; i++) {
            var currentStatus = this.pointsStatus[i];
            var redPoints = this.getRedPointsCount();
            var bluePoints = this.getBluePointsCount();
            if (currentStatus === "RED") {
                if (Date.now() - this.lastTeamScoreUpdateTime >= this.standartScoreTimeout / redPoints) {
                    this.scoreRed++;
                    this.sendTeamScore("red");
                    this.lastTeamScoreUpdateTime = Date.now();
                }
            }
            else if (currentStatus === "BLUE") {
                if (Date.now() - this.lastTeamScoreUpdateTime >= this.standartScoreTimeout / bluePoints) {
                    this.scoreBlue++;
                    this.sendTeamScore("blue");
                    this.lastTeamScoreUpdateTime = Date.now();
                }
            }
        }
    }

    removePlayer(username) {
        for (var i = 0; i < this.points.length; i++) {
            var point = this.points[i];
            for (var j = 0; j < point.occupated_users.length; j++) {
                var user = point.occupated_users[j];
                if (!this.hasUser(user.nickname))
                    continue;

                if (user.nickname === username) {
                    this.broadcast("tank_leave_capturing_point;" + username + ";" + point.id, [username]);
                    point.occupated_users.splice(j, 1);
                    super.removePlayer(username);
                }
            }
        }
    }

    capturedBy(id, by) {
        this.broadcast("point_captured_by;" + by + ";" + id);
    }

    lostBy(id, by) {
        this.broadcast("point_lost_by;" + by + ";" + id);
    }

    updatePointScore(id, score) {
        this.points[id].score = score;
        this.broadcast("set_point_score;" + id + ";" + score);
    }

    getPointUsersByTeam(id, team) {
        var users = [];
        var point = this.points[id];
        for (var i = 0; i < point.occupated_users.length; i++) {
            var user = point.occupated_users[i];
            if (user.team_type.toLowerCase() === team.toLowerCase()) {
                users.push(user);
            }
        }
        return users;
    }

    getRedPointsCount() {
        var count = 0;
        for (var i = 0; i < this.points.length; i++) {
            var currentStatus = this.pointsStatus[i];
            if (currentStatus === "RED") {
                count++;
            }
        }
        return count;
    }

    getBluePointsCount() {
        var count = 0;
        for (var i = 0; i < this.points.length; i++) {
            var currentStatus = this.pointsStatus[i];
            if (currentStatus === "BLUE") {
                count++;
            }
        }
        return count;
    }

    getPointRedCapturingCount(id) {
        var point = this.points[id];
        var users = point.occupated_users;
        var redPeopleCapturing = [];
        for (var i = 0; i < users.length; i++) {
            var user = users[i];
            if (user.team_type.toLowerCase() === "red")
                redPeopleCapturing.push(user);
        }
        return redPeopleCapturing.length;
    }

    getPointBlueCapturingCount(id) {
        var point = this.points[id];
        var users = point.occupated_users;
        var bluePeopleCapturing = [];
        for (var i = 0; i < users.length; i++) {
            var user = users[i];
            if (user.team_type.toLowerCase() === "blue")
                bluePeopleCapturing.push(user);
        }
        return bluePeopleCapturing.length;
    }

    toASLObject() {
        return {
            points: this.points,
        };
    }
}

module.exports = ASLBattle;