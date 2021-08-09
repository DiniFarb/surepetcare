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
        it('verify test pet',async ()=> {
            expect(petcare.household.petCareData.pets[0].id).to.be.a('number');
        });
        it('verify whereabout of test pet',async ()=> {
            expect(petcare.household.petCareData.pets[0].status.activity.where).to.be.a('number');
        });
        it('Set new whereabaout of test pet', async ()=> {
            let report = await new Promise(((resolve, reject) =>{
                petcare.on('message',(msg)=>{
                    resolve(msg);
                });
                petcare.on('error',(err)=>{
                    reject(err);
                });  
                let whereBit = petcare.household.petCareData.pets[0].status.activity.where;
                let setTo = whereBit === petcare.utils.petPlaceCommands.INSIDE ?
                petcare.utils.petPlaceCommands.OUTSIDE :
                petcare.utils.petPlaceCommands.INSIDE;
                petcare.setPetPlace(petcare.household.petCareData.pets[0].name, setTo);
                }));
        expect(report).to.be.a('string');
        });
        it('Set back whereabaout of test pet', async ()=> {
            let report = await new Promise(((resolve, reject) =>{
                petcare.on('message',(msg)=>{
                    resolve(msg);
                });
                petcare.on('error',(err)=>{
                    reject(err);
                });  
                let whereBit = petcare.household.petCareData.pets[0].status.activity.where;
                let setTo = whereBit === petcare.utils.petPlaceCommands.INSIDE ?
                petcare.utils.petPlaceCommands.OUTSIDE :
                petcare.utils.petPlaceCommands.INSIDE;
                petcare.setPetPlace(petcare.household.petCareData.pets[0].name, setTo);
                }));
            expect(report).to.be.a('string');
        });
        it('reset feeders', async ()=> {
            console.log('This test fails if not all feeders are opened!')
            let report = await new Promise(((resolve, reject) =>{
                let count = 0;
                petcare.on('message',(msg)=>{
                    console.log(msg);
                    count++;
                    if(count === 3){
                        resolve(msg);
                    }
                });
                petcare.on('error',(err)=>{
                    reject(err);
                });  
                petcare.resetFeeders(petcare.utils.feederResetCommands.BOTH);
            }));
            expect(report).to.be.a('string');
        });     
    });
}

