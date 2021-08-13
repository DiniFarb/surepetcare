class Utils {

    constructor(options = {}){
        this.updatePollingSeconds = options.update_polling_seconds || 10;
        this.messageThrottling = options.message_throttle_ms || 100;
        this.batteryFull = options.battery_full || 1.6;
        this.batteryLow = options.battery_low || 1.2;
        this.loginCycle = options.login_cycle || '0 11,23 * * *';
        this.somethingWrongMsg = options.somethingWrongMsg || "öpis isch nid guet😑";
        this.successMsg = options.successMsg || "ok 😊";
        this.doorStates = {
            0: options.doorOpenText || "open",
            1: options.doorClosedText || "closed",
            3: options.aboutToOpenText || "will be opened by plan",
            4: options.aboutToCloseText || "will be closed by plan",
        }
        this.placeNames = {
            1: options.petInsideText || "inside",
            2: options.petOutsideText || "outside",
        }
        this.tareText = {
            1:options.tareLeftText || "links",
            2:options.tareRightText || "rechts",
            3:options.tareBothText || "beidi",
        }
        this.doorIsAlready = options.doorIsAlready || this.#default_doorIsAlready;
        this.petIsAlready = options.petIsAlready || this.#default_petIsAlready;
        this.petMovementText = options.petMovementText || this.#default_petMovementText;
        this.unknownMovementText = options.unknownMovementText || this.#default_unknownMovementText;
        this.petHasEatonText = options.petHasEatonText || this.#default_petHasEatonText;
        this.filledBowlText = options.filledBowlText || this.#default_filledBowlText;
        this.resetFeederText = options.resetFeederText || this.#default_resetFeederText;
        this.batteryLowText = options.batteryLowText || this.#default_batteryLowText;
        this.petDrankText = options.petDrankText || this.#default_petDrankText;
        this.felaquaFillText = options.felaquaFillText || this.#default_felaquaFillText;
        this.felaquaReminderText = options.felaquaReminderText || this.#default_felaquaReminderText;
        this.felaquaUnknownDrinkerText = options.felaquaUnknownDrinkerText || this.#default_felaquaUnknownDrinkerText;
        this.petWhereaboutText = options.petWhereaboutText || this.#default_petWhereaboutText;
    };

    doorCommands = {
        OPEN: 0,
        CLOSE: 1,
    };

    petPlaceCommands = {
        INSIDE: 1,
        OUTSIDE: 2
    };

    feederResetCommands = {
        LEFT:1,
        RIGHT:2,
        BOTH:3
    };

    products = {
        HUB: 1,
        REPEATER: 2,
        DOOR: 3,
        FEEDER: 4,
        PROGRAMMER: 5,
        DOOR_SMALL: 6,
        FEEDER_LITE: 7,
        FELAQUA: 8,
    }
    
    #default_doorIsAlready = (doorName, command) => {`${doorName} is already ${this.doorStates[command]}😝`};

    #default_petIsAlready = (petName, command) => `${petName} is already ${this.placeNames[command]}🙄`;

    #default_petMovementText = (petName, bit) =>
        bit === 1 ? `${petName} is now inside` :
        bit === 2 ? `${petName} is now outside` : 
        `${petName} has watched through the door`;

    #default_unknownMovementText = (bit) => 
        bit === 2 ? "Looks like some human tried to use the door" : 
        "Some other cat has looked through the door 😺";

    #default_petHasEatonText = (petName, left, right) => `${petName} has eaton ${left}g${right ? 
        ` of left bowl and ${right}g of right bowl` : ''}`

    #default_filledBowlText = (bowlName, left, right) => `${bowlName} filled with ${left}g${right ? 
        ` left and ${right}g right` : ''}`
    
    #default_resetFeederText = (bowlName, tareVal) => `${bowlName} was ${this.tareText[tareVal]} reseted`;

    #default_batteryLowText = (deviceName) => `Low Battery of device ${deviceName}`;

    #default_petDrankText = (petName, val) => `${petName} drank ${val}ml`;

    #default_felaquaFillText = (deviceName, val) => `${deviceName} filled with ${val}ml`;
    
    #default_felaquaReminderText = (deviceName) => `${deviceName} needs fresh water`;

    #default_felaquaUnknownDrinkerText = (deviceName, val) => `Some Unknown pet has drank ${val}ml from ${deviceName}`;

    #default_petWhereaboutText = (petName, val) => `${petName} is ${this.placeNames[val]}`;

}

module.exports = Utils