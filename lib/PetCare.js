const PetCareAPI = require('./PetCareAPI');
const Household = require('./Household');
const Utils = require('./Utils');
const EventEmitter = require('events');
const cron = require('node-cron');
const log = require('./log');

class PetCare extends EventEmitter {

    household;
    utils;
    #petCareAPI;

    /**
     * Credentials are required for creating a petcare instance
     * @param {{}} credentials Use {mail:"",password:""}
     * @param {{}} options see full options list in README.md
     */
    constructor(credentials, options = {}) {
        super();
        this.utils = new Utils(options);
        if(!credentials) throw Error('No petcare credentials provided');
        this.#petCareAPI = new PetCareAPI(credentials);
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
            this.hId = data.households[0].id;
            let todayTimeline = await this.#getTodaysTimeline();
            this.household = new Household(data,todayTimeline, this.utils);
        } catch(err){
            throw `Create household failed: ${err}`;
        };
    }

    async #getTodaysTimeline() {
        try {
            let startOfDay = new Date(new Date().setHours(0,0,0,0));
            let todayTimeline = [];
            let main = await this.getTimelineEntriesBackTo(startOfDay);
            let device = await this.getTimelineEntriesBackTo(startOfDay,{opt:'device'});
            let pet = await this.getTimelineEntriesBackTo(startOfDay,{opt:'pet'});
            todayTimeline = todayTimeline.addOnlyNew(main);
            todayTimeline = todayTimeline.addOnlyNew(device);
            todayTimeline = todayTimeline.addOnlyNew(pet);
            this.emit('info',`found ${todayTimeline.length} activities from today`);
            return todayTimeline;
        } catch (err) {
            log.error(`Today timeline fetching failed: ${err}`);
            this.emit('error',`Today timeline fetching failed: ${err}`);
            return [];
        };
    };

    async #getAllRecentTimelineEntries(){
        try {
            let mainTl = await this.#petCareAPI.getTimeline(this.hId);
            let mainTlS = await this.#petCareAPI.getTimeline(this.hId,{since:mainTl.data[0].id});
            if(mainTlS.data) mainTl.data = mainTl.data.addOnlyNew(mainTlS.data);
            let timeline = mainTl.data.addOnlyNew(mainTlS.data);
            let deviceTl = await this.#petCareAPI.getTimeline(this.hId,{opt:'device'});
            let deviceTlS = await this.#petCareAPI.getTimeline(this.hId,{opt:'device',sinceId:deviceTl.data[0].id});
            if(deviceTlS.data) deviceTl.data = deviceTl.data.addOnlyNew(deviceTlS.data);
            timeline = timeline.addOnlyNew(deviceTl.data);
            let petTl = await this.#petCareAPI.getTimeline(this.hId,{opt:'pet'});
            let petTlS = await this.#petCareAPI.getTimeline(this.hId,{opt:'pet',sinceId:petTl.data[0].id});
            if(petTlS.data) petTl.data = petTl.data.addOnlyNew(petTlS.data);
            timeline = timeline.addOnlyNew(petTl.data);
            return timeline;
        } catch (err){
            log.error(`All timeline entries fetching failed: ${err}`);
            this.emit('error',`All timeline entries fetching failed: ${err}`);
            return [];
        }
  
    }

    async #updateHouseholdData(){
        try{
            let { data } = await this.#petCareAPI.getUpdate();
            let timeline = await this.#getAllRecentTimelineEntries();
            return this.household.update(data,timeline);
        } catch(err){
            log.error(`Household update failed: ${err}`);
            this.emit('error',`Household update failed: ${err}`);
            return null;
        };
    }

    #startUpdatePolling(){
        this.emit('info',`Start petcare polling with ${this.utils.updatePollingSeconds}s iteration`);
        setInterval(async () => {
                let updates = await this.#updateHouseholdData();
                if(updates) {
                    for(let i = 0; i < updates.rawMsg.length; i++){
                        await new Promise(r=>setTimeout(r,this.utils.messageThrottling));
                        this.emit('direct_message', updates.rawMsg[i]);
                    };
                    for(let i = 0; i < updates.readyMsg.length; i++){
                        await new Promise(r=>setTimeout(r,this.utils.messageThrottling));
                        this.emit('message', updates.readyMsg[i]);
                    };
                };         
        }, 1000 * this.utils.updatePollingSeconds);
    }

    #startLoginCycle(){
        this.emit('info',`Start login cycle with cron string: ${this.utils.loginCycle}`)
        cron.schedule(this.utils.loginCycle, () => {
            this.emit('info'`Start cron job for relogin`);
            this.#login();
        });
    }

    /**
     * Get timeline entries back to given date
     * Be patient if go back to a long time ago
     * @param {Date} date
     * @param {{}} options   
     */
    async getTimelineEntriesBackTo(date = Date, options = {}){
        let backTo = new Date(date);
        let timeline = [];
        let firstload = await this.#petCareAPI.getTimeline(this.hId, options);
        timeline = timeline.concat(firstload.data);
        let lastEntry = new Date(timeline[timeline.length - 1].updated_at).getTime();
        while (backTo.getTime() < lastEntry) {
            let optionsR = options.opt ? 
            {opt:options.opt, beforeId:timeline[timeline.length - 1].id} : 
            {beforeId:timeline[timeline.length - 1].id}  
            let load = await this.#petCareAPI.getTimeline(this.hId,optionsR);
            load.data.forEach(entry => {
                if(!timeline.find(e=>e.id === entry.id)){
                    if (backTo.getTime() < new Date(entry.updated_at).getTime()) {
                        timeline.push(entry);
                    }
                }
            });
            lastEntry = new Date(load.data[load.data.length - 1].updated_at).getTime();
        }
        return timeline;
    }

    /**
     * 
     * @param {String} name door name
     * @param {this.utils.doorCommands} command 0 = open | 1 = close 
     */
    setDoorState(name = String, command = Number) {
        try {
            this.emit('info', `set ${name} ${this.utils.doorStates[command]}`);
            if(!this.utils.doorStates[command]) throw Error(`command: ${command} can't be used for doors`);
            let { id } = this.household.petCareData.devices.find(device => device.name === name);
            if(!id) throw Error(`No door with name ${name} found`);
            this.#petCareAPI.toggleDoor(id, command).then(res => {
                this.emit('message', Array.isArray(res.results) ? 
                this.utils.successMsg : 
                res.results ? 
                this.utils.doorIsAlready(name,this.utils.doorStates[command]) : 
                this.utils.somethingWrongMsg)
            }).catch(err => {
                throw err;
            });
        } catch (err){
            log.error(`set door state error: ${err}`);
            this.emit('error', `set door state error: ${err}`);
        };
    };

    /**
     * 
     * @param {String} name pet name
     * @param {this.utils.petPlaceCommands} command 1 = inside | 2 = outside
     */
    setPetPlace(name = String, command = Number) {
        this.emit('info', `set ${name} to ${this.utils.placeNames[command]}`);
        try {
            if(!this.utils.placeNames[command]) throw Error(`command: ${command} can't be used for pet placeing`); 
            let pet = this.household.petCareData.pets.find(pet => pet.name === name);
            if(!pet) throw Error(`No pet with name ${name} found`);
            if (pet.status.activity.where === command) {
                this.emit('message', this.utils.petIsAlready(pet.name,this.utils.placeNames[command]));
            } else {
                this.#petCareAPI.setPetPlace(pet.id, command).then(res => {
                    this.emit('message', res.data ? this.utils.successMsg : this.utils.somethingWrongMsg);
                }).catch(err => {
                    throw err;
                });
            }
        } catch(err){
            log.error(`set pet place failed: ${err}`);
            this.emit('error', `set pet place failed: ${err}`);
        };
    };

    /**
     * 
     * @param {this.utils.feederResetCommands} msg 1 = left | 2 = right | 3 = both
     */
    resetFeeders(command = Number) {
        this.emit('info', `reset feeder with tare: ${this.utils.tareText[command]}`);
        try {
            if(!this.utils.tareText[command]) throw Error(`command: ${command} can't be used for feeders`); 
            let devices = this.household.petCareData.devices.filter(d=>
                d.product_id === this.utils.products.FEEDER ||
                d.product_id === this.utils.products.FEEDER_LITE);
            if(devices.length == 0) throw Error(`No feeders found`);
            for(let i = 0; i < devices.length; i++){
                this.emit('info', `reset feeder: ${devices[i].name}`);
                const sleep = () => {return new Promise(r => setTimeout(r, 1500))};
                sleep().then(()=>{
                    this.#petCareAPI.resetFeeder(command, devices[i].id)
                    .then(res => {
                        if (res.results){
                            // Message will be fired over update household polling with type 24
                            this.emit('info', `feeder: ${devices[i].name} reset command was sent`);
                        } else {
                            log.error(`feeder ${devices[i].name}: result was undefined`);
                            this.emit('error', `feeder ${devices[i].name}: result was undefined`);
                        }
                    }).catch(err => {
                        throw err;
                    });
                });
            };
        } catch (err){
            log.error(`reset feeders failed: ${err}`);
            this.emit('error', `reset feeders failed: ${err}`);
        };
    };

    /**
     * 
     * @param {String} name feeder device name
     * @param {this.utils.feederResetCommands} msg 1 = left | 2 = right | 3 = both
     */
    resetFeeder(name = String, command = Number) {
        this.emit('info', `reset feeder ${name}`);
        try {
            let { id } = this.household.petCareData.devices.find(device => device.name === name);
            if(!id) throw Error(`No ${name} device found`);
            if(!this.utils.tareText[command]) throw Error(`command: ${command} can't be used for feeders`); 
            this.#petCareAPI.resetFeeder(command, id).then(res => {
                    if (res.results){
                        // Message will be fired over update household polling with type 24
                        this.emit('info', `reseted feeder: ${name}`);
                    } else {
                        throw Error(`result of feeder ${name} was undefined`);
                    }
            }).catch(err => {
                throw err;
            });
        } catch (err){
            log.error(`reset feeder failed: ${err}`);
            this.emit('error', `reset feeder failed: ${err}`);
        };
    };
    
    /**
     * Get some base state information, result will be emited
     * 
     */
    getPetReport() {
        this.emit('info', 'Get pet report');
        try {
            let msg = "";
            this.household.petCareData.devices.forEach(device => {
                if (device.product_id === this.utils.products.DOOR || device.product_id === this.utils.products.DOOR_SMALL) {
                    msg = `${device.name}: ${this.utils.doorStates[device.status.locking.mode]}\n`;
                }
            });
            msg = `${msg}***************************\n`;
            this.household.petCareData.pets.forEach(pet => {
                let where = this.utils.placeNames[pet.status.activity.where];
                msg = `${msg}${this.utils.petWhereaboutText(pet.name,where)}\n`;
            });
            msg = `${msg}***************************\n`;
            if(this.household.felaqua_level >= 0){
                msg = `${msg}Felaqua level: ${this.household.felaqua_level}ml`
            }
            this.emit('message', msg);
        } catch (err) {
            log.error(`Pet report error: ${err}`);
            this.emit('err',`Pet report error: ${err}`);
        };
    };

    /**
     * Get battery state in % and voltage of all devices
     */
    getDeviceReport() {
        this.emit('info', 'Get device report');
        try {
            let mes = '\n***************************\n'
            this.household.petCareData.devices.forEach(device => {
                if (device.status.battery) {
                    let voltage = device.status.battery / 4; //cos 4 batteries
                    let percent = Math.round(((voltage - this.utils.batteryLow) / (this.utils.batteryFull - this.utils.batteryLow)) * 100);
                    mes = `${mes}${device.name}: ${percent > 100 ? 100 : percent}% (${Math.round(device.status.battery * 100) / 100}v)\n`
                }
            });
            this.emit('message', mes);
        } catch (err) {
            log.error(`Device report error: ${err}`);
            this.emit('err',`Device report error: ${err}`);
        };
    };
}

module.exports = PetCare;