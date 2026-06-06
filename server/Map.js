const fs = require('file-system');
const convert = require('xml-js'),
    md5 = require("md5-hex");
const { battle_items, maps, isset, search } = require("./server");
class Map {

    constructor(map_id) {
        var found = true;
        for (var i in battle_items) {
            if (battle_items[i].id === map_id)
                found = battle_items[i];
        }
        if (found === true)
            throw new Error("Map ID: " + map_id + " doesnt exist.");
        this.skybox_id = found.skyboxId;
        this.theme_name = found.themeName;
        this.dom = !!found.dom;
        this.game_mode = found.gameMode;
        this.ctf = !!found.ctf;
        this.min_rank = found.minRank;
        this.name = found.name;
        this.id = map_id;
this.sound = "default_ambient_sound";
if(map_id.split("_space").length == 2)
{
   this.sound = "space_ambient_sound";
}
        this.max_people = found.maxPeople;
        this.tdm = !!found.tdm;
        this.max_rank = found.maxRank;
        var file = fs.readFileSync("public/maps/" + map_id + ".xml", "utf8");
        this.xml = convert.xml2js(file, { compact: false, spaces: 4 });
        this.md5_hash = md5(file);
    }

    getFlagPosition(team = false) {
		try {
			var xml = this.xml;
			if (isset(xml.elements) && isset(xml.elements[0].elements)) {
				var e = search("ctf-flags", xml.elements[0].elements);
				for (var i in e.elements) {
					if (e.elements[i].name === "flag-" + (team ? "red" : "blue")) {
						return this.parsePosition(e.elements[i].elements);
					}
				}
			}
		} catch { }
        return null;
    }
	
	
	    getDOMPointsCount(){
        var xml = this.xml;
        if (isset(xml.elements) && isset(xml.elements[0].elements)) {
            var e = search("dom-keypoints", xml.elements[0].elements);
            return e.elements.length;
        }
    }

    getDOMPoint(id) {
        var xml = this.xml;
        var point = null;
        if (isset(xml.elements) && isset(xml.elements[0].elements)) {
            var e = search("dom-keypoints", xml.elements[0].elements);
            if (e.elements[id].name === "dom-keypoint") {
                point = this.parsePosition(e.elements[id].elements[0].elements);
            }
        }
        return point;
    }

    getSpawnPoints(filters = []) {
        var xml = this.xml;
        var points = [];
        var e = search("spawn-points", xml.elements[0].elements);
        for (var i in e.elements)
            points.push(this.parseSpawnPoint(e.elements[i]));
        if (filters.length > 0) {
            var new_points = [];
            for (var i in points)
                if (filters.includes(points[i].type))
                    new_points.push(points[i]);
            return new_points;
        }
        return points;
    }

    parseSpawnPoint(data) {
        var position = { x: 0, y: 0, z: 0 };
        var rotation = { z: 0 };
        var type = null;
        if (data.name === "spawn-point") {
            var type = data.attributes.type;
            for (var i in data.elements) {
                if (data.elements[i].name === "position")
                    position = this.parsePosition(data.elements[i].elements);
                else if (data.elements[i].name === "rotation")
                    rotation.z = parseFloat(data.elements[i].elements[0].elements[0].text);
            }
        }
        return { position: position, rotation: rotation, type: type };
    }

    getBonusRegions(filters = []) {
        var xml = this.xml;
        var regions = [];
        var e = search("bonus-regions", xml.elements[0].elements);
        for (var i in e.elements)
            regions.push(this.parseRegion(e.elements[i]));
        if (filters.length > 0) {
            var new_regions = [];
            for (var i in regions)
                for (var j in regions[i].types)
                    if (filters.includes(regions[i].types[j]))
                        new_regions.push(regions[i]);
            return new_regions;
        }
        return regions;
    }

    parseRegion(data) {
        var types = [];
        var min = {};
        var max = {};
        if (data.name === "bonus-region") {
            for (var i in data.elements) {
                if (data.elements[i].name === "bonus-type")
                    types.push(data.elements[i].elements[0].text);
                else if (data.elements[i].name === "min")
                    min = this.parsePosition(data.elements[i].elements);
                else if (data.elements[i].name === "max")
                    max = this.parsePosition(data.elements[i].elements);
            }
        }
        return { min: min, max: max, rotation: { z: 0.000 }, types: types };
    }

    parsePosition(data) {
        return { x: parseFloat(data[0].elements[0].text), y: parseFloat(data[1].elements[0].text), z: parseFloat(data[2].elements[0].text) };
    }

    toObject(spectator = false) {
        return { map_id: this.id, sound_id: this.sound, spectator: spectator, game_mode: this.game_mode, kick_period_ms: 1500000, skybox_id: this.skybox_id, invisible_time: 3500 };
    }
}
exports.Map = Map;
