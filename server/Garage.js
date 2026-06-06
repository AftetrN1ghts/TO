const { market_list } = require("./server");
const GarageItem = require("./GarageItem"),
	Area = require("./Area"),
	{ turrets, hulls, paints, getType } = require("./server"),
	InventoryItem = require("./InventoryItem");

class Garage extends Area {


    static fromJSON(data) {

        if (typeof (data.tank) !== "undefiend") {
			var garage = new Garage(data.tank);
            garage.items = Garage.fromItemsObject(data.items);
            garage.updateMarket();
            garage.mounted_turret = data.mounted_turret;
            garage.mounted_hull = data.mounted_hull;
			garage.mounted_paint = data.mounted_paint;
			garage.inventory = null;
            return garage;
        }
        return null;
    }


    static fromItemsObject(obj) {
        var items = [];
        for (var i in obj.items) {
            items.push(GarageItem.fromJSON(obj.items[i]));
        }
        return items;
    }

	constructor(tank) {
		super();
        this.tank = tank;
        this.items = [GarageItem.get("smoky", 0), GarageItem.get("green", 0), GarageItem.get("holiday", 0), GarageItem.get("wasp", 0), GarageItem.get("health", 0)];
        this.updateMarket();
        this.mounted_turret = "smoky_m0";
        this.mounted_hull = "wasp_m0";
		this.mounted_paint = "green_m0";
		this.inventory = [];
	}

	getPrefix() {
		return "garage";
	}

	getInventory() {
	//	if (this.inventory !== null)
	//		return this.inventory;

		var inventory = [];
		for (var i in this.items) {
			var item = this.items[i];
			if (getType(item.id) === 4) {
				inventory.push(InventoryItem.fromGarageItem(item));
			}
		}

		this.inventory = inventory;
		return inventory;
	}

	addGarageItem(id, amount) {

		var tank = this.tank;
		var new_item = GarageItem.get(id, 0);
		if (new_item !== null) {
				var item = tank.garage.getItem(id);
				if (item === null) {
					new_item.count = amount;
					this.addItem(new_item);
				} else {
					item.count += amount;
				}
				
			}
		return true;
    }
	useItem(id) {

		for (var i in this.items) {
			if (this.items[i].isInventory && this.items[i].id === id) {
				if (this.items[i].count <= 0)
					return false;
					if (this.items[i].count = 1)
					{
					this.deleteItem(this.items[i])
					}
				--this.items[i].count;
            }
		}

		return true;
    }

    hasItem(id, m = null) {
        for (var i in this.items) {
            if (this.items[i].id === id) {
                if (this.items[i].type !== 4) {
                    if (m === null)
                        return true;
                    return this.items[i].modificationID >= m;
                }
                else if (this.items[i].count > 0)
                    return true;
                else {
                    this.items.splice(i, 1);
                }
            }
        }
        return false;
	}

	initiate(socket) {
		this.send(socket, "init_garage_items;" + JSON.stringify({ items: this.items }));
		this.addPlayer(this.tank);
	}

	initMarket(socket) {
		this.send(socket, "init_market;" + JSON.stringify(this.market));
	}

	initMountedItems(socket) {
		this.send(socket, "init_mounted_item;" + this.mounted_hull);
		this.send(socket, "init_mounted_item;" + this.mounted_turret);
		this.send(socket, "init_mounted_item;" + this.mounted_paint);
    }

    getItem(id) {
        for (var i in this.items) {
            if (this.items[i].id === id)
                return this.items[i];
        }
        return null;
    }

    getTurret() {
        return this.getItem(this.mounted_turret.split("_")[0]);
    }

    getHull() {
        return this.getItem(this.mounted_hull.split("_")[0]);
    }

    getPaint() {
        return this.getItem(this.mounted_paint.split("_")[0]);
    }

    updateMarket() {
		this.market = { items: [] };

        for (var i in market_list) {
            if (!this.hasItem(market_list[i]["id"]) && market_list[i]["index"] >= 0) {
                this.market.items.push(market_list[i]);
            }
        }
    }

	onData(socket, args) {
		if (this.tank === null || !this.hasPlayer(this.tank.name))
			return;

		var tank = this.tank;

		if (args.length === 1) {
			if (args[0] === "get_garage_data") {
				this.updateMarket();
				setTimeout(() => {
					this.initMarket(socket);
					this.initMountedItems(socket);
				}, 1500);
			}
		} else if (args.length === 3) {
			if (args[0] === "try_buy_item") {
				var itemStr = args[1];
				var arr = itemStr.split("_");
				var id = itemStr.replace("_m0", "");
				var amount = parseInt(args[2]);
				var new_item = GarageItem.get(id, 0);
				if (new_item !== null) {
					if (tank.crystals >= new_item.price * amount && tank.rank >= new_item.rank) {
				
						var obj = {};
						obj.itemId = id;
						var item = tank.garage.getItem(id);
						if (item === null) {
							new_item.count = amount;
							obj.count = amount;
							this.addItem(new_item);
						} else {
							item.count += amount;
							obj.count = item.count;
						}
						tank.crystals -= new_item.price * amount;

						if (id === "1000_scores")
							tank.addScore(500 * amount);
                                                if (id === "1000_scores")
							tank.addScore(1000 * amount);
						if (id === "supplies")
						{
						
							this.addKitItem("health",0,100,tank);
							this.addKitItem("armor",0,100,tank);
							this.addKitItem("damage",0,100,tank);
							this.addKitItem("nitro",0,100,tank);
							this.addKitItem("mine",0,100,tank);
							this.send(socket,"reload")
						}
						else
						{

						
					
						this.send(socket, "buy_item;" + itemStr + ";" + JSON.stringify(obj));
						}
						tank.sendCrystals();
					}
				}
			}
		} else if (args.length === 2) {
			if (args[0] === "try_mount_item") {
				var itemStr = args[1];
				var itemStrArr = itemStr.split("_");
				if (itemStrArr.length === 2) {
					var modificationStr = itemStrArr[1];
					var item_id = itemStrArr[0];
					if (modificationStr.length === 2) {
						var m = parseInt(modificationStr.charAt(1));
						if (!isNaN(m)) {
							this.mountItem(item_id, m);
							this.sendMountedItem(socket, itemStr);
							tank.save();
						}
					}
				}
			} else if (args[0] === "try_update_item") {
				var itemStr = args[1],
					arr = itemStr.split("_"),
					modStr = arr.pop(),
					id = arr.join("_");

				if (modStr.length === 2) {
					var m = parseInt(modStr.charAt(1));
					if (!isNaN(m) && m < 3) {
						if (this.hasItem(id, m) && this.getItem(id).attempt_upgrade(tank)) {
							this.send(socket, "update_item;" + itemStr);
							tank.sendCrystals();
						}
					}
				}
			}
		}
	}

	addKitItem(item, m, count, tank) {
	//	this.items.push(item);

			var itemStr = item + "_m"
			var arr = itemStr.split("_");
			var id = itemStr.replace("_m", "");
			var amount = parseInt(count);
			var new_item = GarageItem.get(id, 0);
			console.log(new_item)
			if (new_item !== null) {
				
					var obj = {};
					obj.itemId = id;
					var item = tank.garage.getItem(id);
					if (item === null) {
						new_item.count = amount;
						new_item.modificationID = m;
						obj.count = amount;
						this.addItem(new_item);
					} else {
						item.count += amount;
						item.modificationID = m;
						obj.count = item.count;
					}
		
	
            }
		}
    
	addItem(item) {
		this.items.push(item);
    }
	deleteItem(item) {
		delete this.items[item];
    }

	mountItem(item_id, m) {
		if (this.hasItem(item_id, m)) {
			var itemStr = item_id + "_m" + m;

			if (hulls.includes(item_id))
				this.mounted_hull = itemStr;
			else if (turrets.includes(item_id))
				this.mounted_turret = itemStr;
			else if (paints.includes(item_id))
				this.mounted_paint = itemStr;
		}
	}

	sendMountedItem(socket, itemStr) {
		this.send(socket, "mount_item;" + itemStr);
    }

    getItemsObject() {
        var items = [];
        for (var i in this.items) {
            items.push(this.items[i].toObject());
        }
		return { items: items };
    }

    toSaveObject() {
        return { items: this.getItemsObject(), mounted_turret: this.mounted_turret, mounted_hull: this.mounted_hull, mounted_paint: this.mounted_paint };
    }

}
module.exports = Garage;
