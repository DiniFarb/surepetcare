const PetCare = require('./index');
require('dotenv').config();

const petcareOptions = {
    somethingWrongMsg: "öpis isch nid guet😑",
    successMsg: "ok 😊",
    doorOpenText: "offe",
    doorClosedText: "zue",
    petInsideText: "dinne",
    petOutsideText: "dusse",
    tareRightText: "links",
    tareRightText: "rechts",
    tareBothText: "beidi",
    doorIsAlready: (doorName, command) => `${doorName} isch dänk scho ${this.doorStates[command]}😝`,
    petIsAlready: (petName, command) => `${petName} is isch dänk ${this.placeNames[command]}🙄`,
    petMovementText: (petName, bit) => bit === 1 ? 
        `${petName} isch jetz dinne, Hello ${petName} 😍` :
        bit === 2 ? `${petName} isch use, stay safe ❤️` : 
        `${petName} het dürs törli gluegt 👀`,
    unknownMovementText: (bit) => 
        bit === 2 ? "Het äuä öper d Hang durs törli gha..." : 
        "Es angers chätzli het id stube gluegt 😺",
    petHasEatonText: (petName, left, right) => `${petName} hat gässe:\n ${left}g droche & ${right}g nass`,
    filledBowlText: (bowlName, left, right) => `${bowlName} gfüllt mit:\n ${left}g droche & ${right}g nass`, 
    petDrankText: (petName,val) => `${petName} het ${val}ml drunke💧`,
    felaquaFillText:(deviceName,val) => `${deviceName} mit ${val}ml befüllt`,
    petWhereaboutText:(petName,where) => `${petName} isch ${where} ${where === "dinne" ? '😊': '🧐'}`
}

const petcare = function setup() {
    try {
        const petcare = new PetCare({
              mail:process.env.MAIL,
              password:process.env.PASSWORD
        },petcareOptions);
        return petcare;    
      } catch(err){
        console.error(err);
        throw err;
      }
}();

module.exports = petcare;
