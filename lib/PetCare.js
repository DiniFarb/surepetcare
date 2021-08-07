const PetCareAPI = require('./PetCareAPI');
const Household = require('./Household');
const Utils = require('./Utils');
const EventEmitter = require('events');
const cron = require('node-cron');
const log = require('./log');
class PetCare extends EventEmitter {

    #household;
    #petCareAPI;
    #polling;
    #batFull;
    #batLow;
    #loginCycle; 
    utils;

    /**
     * Credentials are required for creating a petcare instance
     * @param {{}} credentials Use {mail:"",password:""}
     * @param {{}} options /TODO link to option list/
     */
    constructor(credentials, options = {}) {
        super();
        this.utils = new Utils(options);
        if(!credentials) throw new Error('No petcare credentials provided');
        this.#petCareAPI = new PetCareAPI(credentials);
        this.#polling = options.update_polling_seconds || 10;
        this.#batFull = options.battery_full || 1.6;
        this.#batLow = options.battery_low || 1.2;
        this.#loginCycle = options.login_cycle || '0 11,23 * * *';
        this.#start();
    }

    async #start() {
        try {
            await this.#login();
            await this.#createHouseholdData();
            this.#startUpdatePolling();
            this.#startLoginCycle(); 
            this.emit('started','started');
            log.info('Petcare service has successful started');
        } catch(err) {
            this.emit('error',`Start failed: ${err}`);
            log.error(`Start failed: ${err}`);      
        };
    };

    async #login(){
        try {
        await this.#petCareAPI.login();
        this.emit('info', `Login Petcare successful with user: ${this.#petCareAPI.loggedInUserId}`);
        } catch(err) {
            throw err;
        };
    }

    async #createHouseholdData(){
        try{
            let { data } = await this.#petCareAPI.getUpdate();
            let todayTimeline = await this.#getTodaysTimeline(data.households[0].id);
            this.#household = new Household(data,todayTimeline, this.utils);
        } catch(err){
            throw new Error(`Create household failed: ${err}`);
        };
    }

    async #getTodaysTimeline(householdId) {
        let startOfDay = new Date(new Date().setHours(0,0,0,0));
        let todayTimeline = [];
        let firstload = await this.#petCareAPI.getTimeline(householdId);
        todayTimeline = todayTimeline.concat(firstload.data);
        let lastEntry = new Date(todayTimeline[todayTimeline.length - 1].updated_at).getTime();
        while (startOfDay.getTime() < lastEntry) {
            let load = await this.#petCareAPI.getTimeline(householdId, todayTimeline[todayTimeline.length - 1].id);
            load.data.forEach(entry => {
                if (startOfDay.getTime() < new Date(entry.updated_at).getTime()) {
                    todayTimeline.push(entry);
                }
            });
            lastEntry = new Date(load.data[load.data.length - 1].updated_at).getTime();
        }
        return todayTimeline;
    };

    async #updateHouseholdData(){
        try{
            let { data } = await this.#petCareAPI.getUpdate();
            let timeline = await this.#petCareAPI.getTimeline(data.households[0].id);
            return this.#household.update(data,timeline);
        } catch(err){
            log.error(`Household update failed: ${err}`);
            this.emit('error',`Household update failed: ${err}`);
            return null;
        };
    }

    #startUpdatePolling(){
        this.emit('info',`Start petcare polling with ${this.#polling}s iteration`);
        setInterval(async () => {
                let updates = await this.#updateHouseholdData(); 
                if(updates.rawMsg) {
                    updates.rawMsg.forEach(msg => {
                        this.emit('direct_message', msg);
                });
                }
                if(updates.readyMsg) {
                    updates.rawMsg.forEach(msg => {
                        this.emit('message', msg);
                });
                }            
        }, 1000 * this.#polling);
    }

    #startLoginCycle(){
        this.emit('info',`Start login cycle with cron string: ${this.#loginCycle}`)
        cron.schedule(this.#loginCycle, () => {
            this.emit('info'`Start cron job for relogin`);
            this.#login();
        });
    }

    /**
     * 
     * @param {String} name door name
     * @param {this.utils.doorCommands} command 0 = open | 1 = close 
     */
    setDoorState(name = String, command = Number) {
        this.emit('info', `set ${name} ${this.utils.doorStates[command]}`);
        let { id } = this.#household.petCareData.devices.find(device => device.name === name);
        this.#petCareAPI.toggleDoor(id, command).then(res => {
            this.emit('message', Array.isArray(res.results) ? 
            this.utils.successMsg : 
            res.results ? 
            this.utils.doorIsAlready(command) : 
            this.utils.somethingWrongMsg)
        }).catch(err => {
            log.error(`set door state error: ${err}`);
            this.emit('error', `set door state error: ${err}`);
        });
    };

    /**
     * 
     * @param {String} name pet name
     * @param {this.utils.petPlaceCommands} command 1 = inside | 2 = outside
     */
    setPetPlace(name = String, command = Number) {
        this.emit('info', `set ${name} to ${this.utils.placeNames[command]}`);
        let pet = this.#household.petCareData.pets.find(pet => pet.name === name);
        if (pet.status.activity.where === command) {
            this.emit('message', this.utils.petIsAlready(pet.name,command));
        } else {
            this.#petCareAPI.setPetPlace(pet.id, command).then(res => {
                this.emit('message', res.data ? this.utils.successMsg : this.utils.somethingWrongMsg);
            }).catch(err => {
                this.emit('error', `set pet place error: ${err}`);
            });
        }
    };

    /**
     * 
     * @param {this.utils.feederResetCommands} msg 1 = left | 2 = right | 3 = both
     */
    resetFeeders(command = Number) {
        this.emit('info', `reset feeders ${this.utils.tareText[command]}`);
        let pets = this.#household.pets;
        Object.keys(pets).forEach(async(petName) => {
            await new Promise(r => setTimeout(r, 1500));
            this.#petCareAPI.resetFeeder(command, pets[petName].device, this.loginData)
                .then(res => {
                    if (!res.results) this.emit('message', `${pets[petName].deviceName}:\n Hmm öbis isch nid guet 🤕`);
                }).catch(err => {
                    this.emit('error', `reset feeder: ${err}`);
                });
        });
    };
    
    getPetRport() {
        try {
            let msg = "";
            this.#household.petCareData.devices.forEach(device => {
                if (device.product_id === this.utils.products.DOOR || device.product_id === this.utils.products.DOOR_SMALL) {
                    msg = `${device.name} isch ${this.utils.doorStates[device.status.locking.mode]}\n`;
                }
            });
            msg = `${msg}***************************\n`;
            this.#household.petCareData.pets.forEach(pet => {
                let where = this.utils.placeNames[pet.status.activity.where];
                msg = `${msg}${pet.name} isch ${where}${this.utils.getPlaceEmoij(where)}\n`;
                if (this.#household.pets[pet.name]) {
                    msg = `${msg}Nass:\n` +
                        `${this.#household.pets[pet.name].eatenWet}g vo ${this.#household.pets[pet.name].lastFillWet}g gässe, ${this.#household.pets[pet.name].currentWet}g übrig \n` +
                        `Gsamt ${this.#household.pets[pet.name].eatenWetSoFar}g vo ${this.#household.pets[pet.name].fillWetToday}g gässe\n` +
                        `Troche:\n` +
                        `${this.#household.pets[pet.name].eatenDry}g vo ${this.#household.pets[pet.name].lastFillDry}g gässe, ${this.#household.pets[pet.name].currentDry}g übrig \n` +
                        `Gsamt ${this.#household.pets[pet.name].eatenDrySoFar}g vo ${this.#household.pets[pet.name].fillDryToday}g gässe\n` +
                        `Und het bis iz ${this.#household.pets[pet.name].drank}ml drunke\n` + 
                        `***************************\n`
                }
            });
            if(this.#household.felaqua_level >= 0){
                msg = `${msg}Felaqua stand: ${this.#household.felaqua_level}ml`
            }
            this.emit('message', msg);
        } catch (err) {
            log.error(`Pet report error: ${err}`);
            this.emit('err',`Pet report error: ${err}`);
        }
    };

    getDeviceRport() {
        try {
            let mes = '\n***************************\n'
            this.#household.petCareData.devices.forEach(device => {
                if (device.status.battery) {
                    let voltage = device.status.battery / 4; //cos 4 batteries
                    let percent = Math.round(((voltage - this.#batLow) / (this.#batFull - this.#batLow)) * 100);
                    mes = `${mes}${device.name}: ${percent > 100 ? 100 : percent}% (${Math.round(device.status.battery * 100) / 100}v)\n`
                }
            });
            this.emit('message', mes);
        } catch (err) {
            log.error(`Device report error: ${err}`);
            this.emit('err',`Device report error: ${err}`);
        }
    };
}

module.exports = PetCare;