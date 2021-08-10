# node-surepetcare
[![Dependencies](https://img.shields.io/david/andreasvogt89/surepetcare)](https://github.com/andreasvogt89/surepetcare)
[![Code size](https://img.shields.io/github/languages/code-size/andreasvogt89/surepetcare)](https://github.com/andreasvogt89/surepetcare)
[![files](https://img.shields.io/github/directory-file-count/andreasvogt89/surepetcare)](https://github.com/andreasvogt89/surepetcare)

[![NPM](https://nodei.co/npm/node-surepetcare.png?downloads=true&downloadRank=true)](https://nodei.co/npm/node-surepetcare/)

This node module is connecting to the sure petcare server via account credentials and fetches pet and device data. 

## TODO
Still some tasks open but the code base is already usable 😉

 - [ ] create more tests (target cov 75%)
 - [ ] Check the reset feeder functions (they are still a bit bugy... )
 - [ ] Finish docu and exampels


I use this module in this project to send/command the surepetcare data over a telegram chat.  
https://github.com/Shokodev/mauzis

## Install

 ```bash
npm i node-surepetcare
 ```

## Basic Example

 ```js
const PetCare = require('node-surepetcare');

try {

    const petcare = new PetCare({
        mail:"your petcare mail",
        password:"your petcare password"
    });
    
    petcare.on("message", (mes) => {
        //Here you can listen for pre defined messages, look in the "message events" section for more details
        console.log(mes);
    });
    
    petcare.on("direct_message", (err) => {
        //Here you can listen for unfiltered messages, look in the "direct_message events" section for more details
        console.log(err);
    });
    
    petcare.on("started", (mes) => {
        //The creating of the PetCare runs some async initializing. 
        //This event will be fired as soon as all those initailizings are done.
        console.log(mes);
    });

    petcare.on("info", (info) => {
        //Listen for info events like when a door command was triggert and so on
        console.log(info);
    });

    petcare.on("error", (err) => {
        //All errors are already logged to the console with the winston framework 
        //if you need them to send anywhere else, you can use this listener
        console.log(err);
    });
    
} catch(err){
    console.log(err);
}

 ```
 
 ## PetCare Class
 
 By creating a new instance, you have to pass in a credentails otherwise an error will be thrown.
 ```js
 const petcare = new PetCare({
        mail:"your petcare mail",
        password:"your petcare password"
 });
 ```
The constructor accepts also a options object in which some default settings can be overwritten.
See in the [options](#options) section for more details

 ```js
 const petcare = new PetCare({
        mail:"your petcare mail",
        password:"your petcare password"
 },options);
 ``` 
- As soon as the instance is created it automatically begins to poll the sure petcare server 
(default every 10s). 
- There starts also a automatic relogin by a node-cron job for updating the account token.
(default every day at 11:00 and 23:00)
- The [message_events](#message events) listener fires updates of your household in predefined messages  
- The [direct_message_events](#direct_message events) listener fires all updates of your household as objects
- The [household_property](#household property) is overwritten by every poll and holds the data of surepetcare
- The [pets_property](#pets property) is overwritten by every poll and holds computed data of surepetcare 

Functions: 
- setDoorState
- setPetPlace
- resetFeeder
- resetFeeders
- getDeviceReport
- getPetReport

...
 
 ### household property
 
 This property is updated in every poll and holds the surepetcare data. The structure of this object is 
 the same as in the surepetcare and is diffrent for every user. You can easy inspect what you get there by using a browser. 
 Go to https://www.surepetcare.io/ hit F12 and look in the network tab for the second "start" XHR. What you can see there 
 under data will be in the houshold property
 
![household](https://user-images.githubusercontent.com/30302212/128848239-ac33927d-0f88-4d8d-8f02-a165a81bea2a.png)

 
### pets property
This property holds computed data of all pets depending on what devices you have. 
It is updated by every poll as well. 

Structure:
```
"name of pet": {
 props like list below
},
"name of other pet": {
 props like list below
},
etc.
```
- `name` name of pet
- `petID` id of pet
- `device` assigned feeder device 
- `place` whereabout of pet
- `deviceName`assigned feeder device name
- `rightTarget` *fill target of right bowl
- `leftTarget` *fill target of left bowl
- `currentLeft` *current gram in left bowl
- `currentRight`*current gram in right bowl
- `lastEatenLeft` *lasttime ate in grams of left bowl 
- `lastEatenRight`*lasttime ate in grams of right bowl
- `eatenLeftSoFar` *has eaten today so far in grams of left bowl
- `eatenRightSoFar` *has eaten today so far in grams of left bowl
- `drank` *drank so far today
- `lastFillLeft`*lasttime filled in left bowl
- `lastFillRight`*lasttime filled in right bowl
- `eatenLeft` *has eaten since last filling in grams of left bowl
- `eatenRight`*has eaten since last filling in grams of right bowl

*if you are using just one bowl, all infos should be just in the "left" props
 
 ## message events
 In this listener you get updates from petcare in pre defined strings which can be custom overwritten with the [options](#options) object

- Pet goes through a door => option: `petMovementText` (type 0)
- Unknown movement of door => option: `unknownMovementText` (type 7)
- Filling bowl/bowls => option: `filledBowlText` (type 21)
- Pet has eaten  => option: `petHasEatonText` (type 22)
- Feeder was reseted => option: `resetFeederText` (type 24)
- Battery threshold reached => option: ` batteryLowText` (type 1)
- Pet drank => option: `petDrankText` (type 29)
- Filling Felaqua => option: `felaquaFillText` (type 30)
- Reminder Fresh Water for Felaqua => option: `felaquaReminderText` (type 32)
- Unknown Felaqua drinking  => option: `felaquaUnknownDrinkerText` (type 34)
 
## direct_message events
In this listener you get all the timeline events of surepetcare in the same structure as the server sends it.
The message object structure can differ from type to type, best way to see how your needed msg is structured is 
to use a browser again. Go to https://www.surepetcare.io/ hit F12 and look in the network tab for a number entry
as in the screen shot. (The number is your houshold id)

![household-events](https://user-images.githubusercontent.com/30302212/128861134-0f030f9e-4d37-44c4-9a71-a734a54558bf.png)

## options
 
 You can pass in a options property to the constructor of the PetCare Class 
 to overwrite some settings and the messages of the message events listener
 
 Here is a example of a full options object of all possible settings, as I use it (In swiss german 😛):
 
 ```js
 const options = {
    update_polling_seconds: 10,
    battery_full: 1.6,
    battery_low: 1.2,
    login_cycle: '0 11,23 * * *',
    somethingWrongMsg: "öpis isch nid guet😑",
    successMsg: "ok 😊",
    doorOpenText: "offe",
    doorClosedText: "zue",
    petInsideText: "dinne",
    petOutsideText: "dusse",
    tareRightText: "links",
    tareRightText: "rechts",
    tareBothText: "beidi",
    doorIsAlready: (doorName, state) => `${doorName} isch dänk scho ${this.doorStates[state]}😝`,
    petIsAlready: (petName, state) => `${petName} is isch dänk ${this.placeNames[state]}🙄`,
    petMovementText: (petName, bit) => bit === 1 ? 
        `${petName} isch jetz dinne, Hello ${petName} 😍` :
        bit === 2 ? `${petName} isch use, stay safe ❤️` : 
        `${petName} het dürs törli gluegt 👀`,
    unknownMovementText: (bit) => 
        bit === 2 ? "Het äuä öper d Hang durs törli gha..." : 
        "Es angers chätzli het id stube gluegt 😺",
    petHasEatonText: (petName, left, right) => `${petName} hat gässe:\n ${left}g droche & ${right}g nass`,
    filledBowlText: (bowlName, left, right) => `${bowlName} gfüllt mit:\n ${left}g droche & ${right}g nass`, 
    resetFeederText: (bowlName, tareVal) => `${bowlName} isch ${this.tareText[tareVal]} zrüggsetzt`,
    batteryLowText: (deviceName) => `${deviceName} het fasch ke saft me 🙀`,
    petDrankText: (petName,val) => `${petName} het ${val}ml drunke💧`,
    felaquaFillText:(deviceName,val) => `${deviceName} mit ${val}ml befüllt`,
    felaquaReminderText: (deviceName) => `${deviceName} set neus wasser ha`,
    felaquaUnknownDrinkerText: (deviceName, val) => `Igrendöpper het ${val}ml drunke us ${deviceName}`,
    petWhereaboutText:(petName,where) => `${petName} isch ${where} ${where === "dinne" ? '😊': '🧐'}`
 } 
 
 const petcare = new PetCare({
        mail:"your petcare mail",
        password:"your petcare password"
 },options);
 
 
 ```
 
## License

[MIT](LICENSE)
 
