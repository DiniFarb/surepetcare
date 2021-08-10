# node sure petcare

##  


## TODO
 - [ ] create tests min 75% cov
 - [ ] specify lowest version of node
 - [ ] pipe all something went wrong messages to error git event
 - [ ] Create docu and exampels

 ### Install
 ```
npm i --save install surepetcare
 ```

 ### Basic Example

 ```
const PetCare = require('node-surepetcare');

try {
    const petcare = new PetCare({
        mail:"your petcare mail",
        password:"your petcare password"
    });

    petcare.on("info", (info) => {
        console.log(info);
    });

    petcare.on("error", (err) => {
        console.log(err);
    });

    petcare.on("message", (mes) => {
        console.log(mes);
    });

} catch(err){
    console.log(err);
}

 ```