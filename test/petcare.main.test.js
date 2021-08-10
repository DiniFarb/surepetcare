const expect = require('expect.js');

describe('Create instance and start',async function () {
    this.timeout(10000); //10 seconds
    it('has started',async () => {
        res = await start();
        expect(start).to.not.throwException();
        expect(res.msg).to.be.equal('started');
        testmain(res.pc);
    });
});

function start() {
    return new Promise(((resolve, reject) =>{
        try {
            let pc = require('../test-setup');
            pc.on('started',(msg)=>{
                resolve({pc:pc,msg:msg});
            });
        } catch (err) {
            reject(err);
        }   
    }));
}

function testmain(petcare){
    describe('Test created data',async function () {
        this.timeout(10000); 
        it('has household', async ()=> {
            expect(petcare.household).to.be.a('object');
        });
        it('has household pets', async ()=> {
            expect(petcare.household.pets).to.be.a('object');
        });
        it('has household petcareData', async ()=> {
            expect(petcare.household.petCareData).to.be.a('object');
        });
        it('create device report', async ()=> {
            let report = await new Promise(((resolve, reject) =>{
                petcare.on('message',(msg)=>{
                    resolve(msg);
                });
                petcare.on('error',(err)=>{
                    reject(err);
                });  
                petcare.getDeviceReport();
            }));
            expect(report).to.be.a('string');
        });
        it('create pet report', async ()=> {
            let report = await new Promise(((resolve, reject) =>{
                petcare.on('message',(msg)=>{
                    resolve(msg);
                });
                petcare.on('error',(err)=>{
                    reject(err);
                });  
                petcare.getPetReport();
            }));
            expect(report).to.be.a('string');
        });
        testPetplacing(petcare);
        testDoorCommants(petcare);   
    });
};

function testPetplacing(petcare){
    describe('Test set pet palce',async function () {
        this.timeout(15000);
        let testPet = null;
        let testPetWherabout = null;
        it('verify test pet',async ()=> {
            testPet = petcare.household.petCareData.pets[0];
            expect(testPet).to.be.ok();
            expect(testPet.id).to.be.a('number');
        });
        it('verify whereabout of test pet',async ()=> {
            testPetWherabout = testPet.status.activity.where;
            expect(testPetWherabout).to.be.a('number');
        });
        it('Set new whereabaout of test pet', async ()=> {
            let report = await new Promise(((resolve, reject) =>{
                petcare.on('message',(msg)=>{
                    resolve(msg);
                });
                petcare.on('error',(err)=>{
                    reject(err);
                });  
                let setTo = testPetWherabout === petcare.utils.petPlaceCommands.INSIDE ?
                petcare.utils.petPlaceCommands.OUTSIDE :
                petcare.utils.petPlaceCommands.INSIDE;
                petcare.setPetPlace(testPet.name, setTo);
                }));
        expect(report).to.be.a('string');
        });
        it('Set back whereabout of test pet', async ()=> {
            // needs to wait at least one update cycle
            await new Promise(r => setTimeout(r, 12000));
            let report = await new Promise(((resolve, reject) =>{
                petcare.on('message',(msg)=>{
                    resolve(msg);
                });
                petcare.on('error',(err)=>{
                    reject(err);
                }); 
                petcare.setPetPlace(testPet.name, testPetWherabout);
                }));
            expect(report).to.be.a('string');
        });
    });
};

function testDoorCommants(petcare){
    describe('Test door commants',async function () {
        this.timeout(20000);
        let testDoor = null;
        let testDoorState = null;
        it('verify test door',async ()=> {
            let testDoors = petcare.household.petCareData.devices.filter(d => d.product_id === petcare.utils.products.DOOR 
                || d.product_id === petcare.utils.products.DOOR_SMALL);   
            testDoor = testDoors[0];    
            expect(testDoor).to.be.ok();
            expect(testDoor.id).to.be.a('number');
        });
        it('verify state of test door',async ()=> {
            testDoorState = testDoor.status.locking.mode;
            expect(testDoorState).to.be.a('number');
        });
        it('Set new door state', async ()=> {
            let report = await new Promise(((resolve, reject) =>{
                petcare.on('message',(msg)=>{
                    resolve(msg);
                });
                petcare.on('error',(err)=>{
                    reject(err);
                });  
                let setTo = testDoorState === petcare.utils.doorCommands.OPEN ?
                petcare.utils.doorCommands.CLOSE :
                petcare.utils.doorCommands.OPEN;
                petcare.setDoorState(testDoor.name, setTo);
                }));
        expect(report).to.be.a('string');
        });
        it('Set back door state', async ()=> {
            // needs to wait at least one update cycle
            await new Promise(r => setTimeout(r, 12000));
            let report = await new Promise(((resolve, reject) =>{
                petcare.on('message',(msg)=>{
                    resolve(msg);
                });
                petcare.on('error',(err)=>{
                    reject(err);
                });  
                petcare.setDoorState(testDoor.name, testDoorState);
                }));
            expect(report).to.be.a('string');
        });
    });
};

function testResetFeeder(petcare){
    //TODO

}

