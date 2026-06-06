class Command {
    constructor(name) {
        this.name = name;
    }

    alias(m) {
        for (var i in m)
            if (this.match(m[i]))
                return true;
        return false;
    }

    match(s) {
        return this.getName() === s.toLowerCase();
    }

    getName() {
        return this.name.toLowerCase();
    }
}
exports.Command = Command;
