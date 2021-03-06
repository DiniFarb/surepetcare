export const options = {
    update_polling_seconds: 10,
    message_throttle_ms: 100,
    battery_full: 1.4,
    battery_low: 1.15,
    login_cycle: '0 11,23 * * *',
    somethingWrongMsg: "öpis isch nid guet😑",
    successMsg: "ok 😊",
    doorOpenText: "offe",
    doorlockedInText:"zue vo inne",
    doorlockedOutText:"zue vo usse",
    doorlockedAllText:"ganz zue",
    petInsideText: "dinne",
    petOutsideText: "dusse",
    tareLeftText: "links",
    tareRightText: "rechts",
    tareBothText: "uf beidne site",
    doorIsAlready: (doorName, state) => `${doorName} isch dänk scho ${state}😝`,
    petIsAlready: (petName, state) => `${petName} is isch dänk ${state}🙄`,
    petMovementText: (petName, bit) => bit === 1 ? 
        `${petName} isch jetz dinne, Hello ${petName} 😍` :
        bit === 2 ? `${petName} isch use, stay safe ❤️` : 
        `${petName} het dürs törli gluegt 👀`,
    unknownMovementText: (bit) => 
        bit === 2 ? "Het äuä öper d Hang durs törli gha..." : 
        "Es angers chätzli het id stube gluegt 😺",
    petHasEatenText: (petName, left, right) => `${petName} hat gässe:\n ${left}g droche & ${right}g nass`,
    filledBowlText: (bowlName, left, right) => `${bowlName} gfüllt mit:\n ${left}g droche & ${right}g nass`, 
    resetFeederText: (bowlName, tareVal) => `${bowlName} isch ${tareVal} zrüggsetzt worde`,
    batteryLowText: () => `ignore`,
    petDrankText: (petName,val) => `${petName} het ${val}ml drunke💧`,
    felaquaFillText:(deviceName,val) => `${deviceName} mit ${val}ml befüllt`,
    felaquaReminderText: (deviceName) => `${deviceName} set neus wasser ha`,
    felaquaUnknownDrinkerText: (deviceName, val) => `Igrendöpper het ${val}ml drunke us ${deviceName}`,
    petWhereaboutText:(petName,where) => `${petName} isch ${where} ${where === "dinne" ? '😊': '🧐'}`
}