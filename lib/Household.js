class Household {

    petCareData;
    #usedTimelineIds;
    pets;
    started_at;

    constructor(petCareData, todayTimeline, utils) {
        this.utils = utils;
        this.petCareData = petCareData;
        this.pets = {};
        this.#usedTimelineIds = new Map();
        this.started_at = new Date().getTime();
        this.#inizialzie(todayTimeline);
    }

    #inizialzie(todayTimeline) {
        todayTimeline.forEach(entry => {
            this.#usedTimelineIds.set(entry.id, entry.created_at);
        });
        let eatings = todayTimeline.filter(entry => entry.type === 22);
        let foodFillings = todayTimeline.filter(entry => entry.type === 21);
        let drinkings = todayTimeline.filter(entry => entry.type === 29);
        let fd = todayTimeline.filter(entry => entry.type === 29 || entry.type === 30);
        let felaquaMessages = fd.concat(todayTimeline.filter(entry => entry.type === 34));
        this.petCareData.pets.forEach($pet => {
            if ($pet.status.feeding) {
                let $device = this.petCareData.devices.find(device => device.id == $pet.status.feeding.device_id);
                let eating = eatings.filter(e => e.pets[0].id === $pet.id);
                let foodFilling = foodFillings.filter(f => f.devices[0].name === $device.name);
                let drinking = drinkings.filter(e => e.pets[0].id === $pet.id);
                let latestEating = this.#getNewestEntry(eating);
                let latestFilling = this.#getNewestEntry(foodFilling);
                this.pets[$pet.name] = {
                    name: $pet.name,
                    petID: $pet.id,
                    device: $device.id,
                    deviceName: $device.name,
                    rightTarget: $device.control.bowls.settings[0].target,
                    leftTarget: $device.control.bowls.settings[1].target,
                    currentLeft: latestEating ? 
                    Math.round(latestEating.weights[0].frames[0].current_weight) : 0,
                    currentRight: latestEating ? 
                    Math.round(latestEating.weights[0].frames[1].current_weight) : 0,
                    lastEatenLeft: latestEating ?
                    Math.round(latestEating.weights[0].frames[0].change * -1) : 0,
                    lastEatenRight: latestEating ?
                    Math.round(latestEating.weights[0].frames[1].change * -1) : 0,
                    eatenLeftSoFar: this.#getEatingsFromToday(eating, 0),
                    eatenRightSoFar: this.#getEatingsFromToday(eating, 1),
                    drank: this.#getDrinkingsFromToday(drinking),
                    lastFillLeft: latestFilling ?
                    Math.round(this.#getNewestEntry(foodFilling).weights[0].frames[0].current_weight) : 0,
                    lastFillRight: latestFilling ?
                    Math.round(this.#getNewestEntry(foodFilling).weights[0].frames[1].current_weight) : 0,
                    fillLeftToday: this.#getFoodFillingsFromToday(foodFilling, 1),
                    fillRightToday: this.#getFoodFillingsFromToday(foodFilling, 0),
                    lastFillFood: new Date().toLocaleDateString(),
                    lastDrank: new Date().toLocaleDateString(),
                    place: this.utils.placeNames[$pet.status.activity.where],
                };
                this.pets[$pet.name].eatenLeft = this.pets[$pet.name].lastFillLeft - this.pets[$pet.name].currentLeft;
                this.pets[$pet.name].eatenRight = this.pets[$pet.name].lastFillRight - this.pets[$pet.name].currentRight;
                let msg = this.#getNewestEntry(felaquaMessages);
                this.felaqua_level = msg ? Math.round(msg.weights[0].frames[0].current_weight) : 0;
            }
        });
    };

    #getNewestEntry(entries){
        if(entries === 0) return null;
        return entries.sort((a,b)=> a.updated_at - b.updated_at)[0]; 
    };

    #getFoodFillingsFromToday(filling, id) {
        return filling.reduce((acu, entry) => {
            return acu + Math.round(entry.weights[0].frames[id].current_weight)
        }, 0);
    };

    #getEatingsFromToday(eating, id) {
        return eating.reduce((acu, entry) => {
            return acu + Math.round(entry.weights[0].frames[id].change * -1) 
        }, 0);
    };

    #getDrinkingsFromToday(drinking){
        return drinking.reduce((acu,entry) =>{
            return acu + Math.round(entry.weights[0].frames[0].change) * -1
        },0);
    };

    #removeOldTimlineEntries() {
        this.#usedTimelineIds.forEach((val, key) => {
            if (new Date(val).toLocaleDateString().split('.')[1] !== new Date().toLocaleDateString().split('.')[1]) {
                this.emit('info', `Delete: ${val}`);
                this.#usedTimelineIds.delete(key);
            }
        });
    };
    
    update(petCareData, newTimeline) {
        let updates = {
            readyMsg: [],
            rawMsg:[],
        };
        this.petCareData = petCareData;
        newTimeline.forEach(entry => {
            if (!this.#usedTimelineIds.has(entry.id)) {
                this.#usedTimelineIds.set(entry.id, entry.created_at);
                
                //For direct_message event emitter
                updates.rawMsg.push(entry);
                
                //Door things
                if (entry.type === 0) {
                    updates.readyMsg.push(this.utils.petMovementText(entry.pets[0].name, entry.movements[0].direction));
                };
                //Unknown Movement
                if (entry.type === 7) {
                    updates.readyMsg.push(this.utils.unknownMovementText(entry.movements[0].direction));
                };
                //Filling
                if (entry.type === 21) {
                    Object.keys(this.pets).forEach(petName => {
                        if (entry.devices[0].name === this.pets[petName].deviceName) {
                            let newFillDate = new Date().toLocaleDateString();
                            let isFirstFilling = this.pets[petName].lastFillFood !== newFillDate;
                            this.pets[petName].lastFillFood = newFillDate;
                            let filledLeft = Math.round(entry.weights[0].frames[0].current_weight);
                            let filledRight = Math.round(entry.weights[0].frames[1].current_weight);
                            this.pets[petName].currentLeft = filledLeft;
                            this.pets[petName].currentRight = filledRight;
                            this.pets[petName].lastFillLeft = filledLeft;
                            this.pets[petName].lastFillRight = filledRight;
                            if (isFirstFilling) {
                                this.pets[petName].fillLeftToday = filledLeft;
                                this.pets[petName].fillRightToday = filledRight;
                                this.pets[petName].eatenLeftSoFar = 0;
                                this.pets[petName].eatenRightSoFar = 0;
                            } else {
                                this.pets[petName].fillLeftToday += filledLeft;
                                this.pets[petName].fillRightToday += filledRight;
                            }
                            this.pets[petName].eatenLeft = 0;
                            this.pets[petName].eatenRight = 0;
                            updates.readyMsg.push(this.utils.filledBowlText(this.pets[petName].deviceName, 
                                this.pets[petName].currentLeft,this.pets[petName].currentRight));
                        }
                    });
                };
                //Eating
                if (entry.type === 22) {
                    Object.keys(this.pets).forEach(petName => {
                        if (entry.devices[0].name === this.pets[petName].deviceName) {
                            let currentLeft = Math.round(entry.weights[0].frames[0].current_weight);
                            let currentRight = Math.round(entry.weights[0].frames[1].current_weight);
                            let eatenLeft = Math.round(entry.weights[0].frames[0].change * -1) ;
                            let eatenRight = Math.round(entry.weights[0].frames[1].change * -1) 
                            this.pets[petName].currentRight = currentRight;
                            this.pets[petName].currentLeft = currentLeft;
                            this.pets[petName].eatenLeft += eatenLeft; 
                            this.pets[petName].eatenRight += eatenRight;
                            this.pets[petName].eatenLeftSoFar += eatenLeft;
                            this.pets[petName].eatenRightSoFar += eatenRight;
                            updates.readyMsg.push(this.utils.petHasEatonText(this.pets[petName].name, eatenLeft,eatenRight));
                        }
                    });
                };
                //Reset Feeder
                if (entry.type === 24) {
                    Object.keys(this.pets).forEach(petName => {
                        if (entry.devices[0].name === this.pets[petName].deviceName) {
                            let currentLeft = Math.round(entry.weights[0].frames[0].current_weight);
                            let currentRight = Math.round(entry.weights[0].frames[1].current_weight);
                            this.pets[petName].currentRight = currentRight;
                            this.pets[petName].currentLeft = currentLeft;
                            let tareBit = JSON.parse(entry.data).tare_type;
                            updates.readyMsg.push(this.utils.resetFeederText(
                                entry.devices[0].name,this.utils.tareText[tareBit]));
                        }
                    });
                };
                //Battery threshold
                if(entry.type === 1){
                  let device = entry.devices[0].name
                  updates.readyMsg.push(this.utils.batteryLowText(device));
                };       
                //Drinking
                if(entry.type === 29){
                    let petName = entry.pets[0].name;
                    let drank = Math.round(entry.weights[0].frames[0].change * -1);
                    let today = new Date().toLocaleDateString();
                    let isfirstDrinking = this.pets[petName].lastDrank !== today;
                    this.pets[petName].lastDrank = today;
                    if(isfirstDrinking){
                        this.pets[petName].drank = drank;
                    } else {
                        this.pets[petName].drank += drank;
                    }
                    this.felaqua_level = Math.round(entry.weights[0].frames[0].current_weight); 
                    updates.readyMsg.push(this.utils.petDrankText(petName,drank));
                };
                //Filling Felaqua
                if(entry.type === 30){
                   let device = entry.devices[0].name;
                   this.felaqua_level = Math.round(entry.weights[0].frames[0].change);
                   updates.readyMsg.push(this.utils.felaquaFillText(device,this.felaqua_level)); 
                };
                //Reminder Fresh Water for Felaqua
                if(entry.type === 32){
                    let device = entry.devices[0].name;
                    updates.readyMsg.push(this.utils.felaquaReminderText(device));
                };                
                //Unknown Felaqua
                if(entry.type === 34){
                    let drank = Math.round(entry.weights[0].frames[0].change * -1);
                    let device = entry.devices[0].name;
                    this.felaqua_level = Math.round(entry.weights[0].frames[0].current_weight); 
                    updates.readyMsg.push(this.utils.felaquaUnknownDrinkerText(device,drank));
                };                
            }
            this.#removeOldTimlineEntries();
        });
        return updates;
    };
}

module.exports = Household