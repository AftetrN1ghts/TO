class Mine {

    constructor(user, position) {

        this.activationTime = 2000;
        this.min_damage = 120;
        this.max_damage = 160;
        this.visible_radius = 5;
        this.far_visible_radius = 15;
        this.impact_force = 2.0;
        this.min_dist_from_base = 5;
        this.radius = 1;

        if (user !== undefined && position !== undefined) {
            this.id = user.nickname + "_" + user.mineCount++;
            this.activated = false;
            this.user = user;
            this.position = position;
            this.model = false;
        } else {
            this.model = true;
        }
    }

    put() {
        if (this.model)
            return;

        setTimeout(() => {
            if (this.user.battle !== null) {
                this.user.battle.broadcast("activate_mine;" + this.id);
                this.activated = true;
            }
            
        }, this.activationTime);
    }

    toInitObject() {
        if (!this.model)
            return { mineId: this.id, x: this.position.x, y: this.position.y, z: this.position.z, ownerId: this.user.nickname };

        return {};
    }

    toObject() {
        if (!this.model)
            return {mineId: this.id, x: this.position.x, y: this.position.y, z: this.position.z, userId: this.user.nickname};

        return { activationTimeMsec: this.activationTime, maxDamage: this.max_damage, nearVisibilityRadius: this.visible_radius, impactForce: this.impact_force, minDistanceFromBase: this.min_dist_from_base, radius: this.radius, farVisibilityRadius: this.far_visible_radius, minDamage: this.min_damage };
    }

}
exports.Mine = Mine;
