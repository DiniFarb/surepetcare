/**
 * This is used for testing the PetCareAPI Class which is the 
 * interface to the sure petcare server 
 */

const PetCareAPI = require('../lib/PetCareAPI');
const Utils = require('../lib/Utils');
const expect = require('expect.js');
require('dotenv').config();
let api = null;
let household = null;
const utils = new Utils();

describe('Create API',()=>{
    it('create api with ENV credentials', ()=> {
        api = new PetCareAPI({
            mail:process.env.MAIL,
            password:process.env.PASSWORD
        });
        expect(api).to.be.a(PetCareAPI);
    });
});
describe('Test login Petcare',()=>{
    it('Login',async ()=> {
        login =  await api.login();
        expect(login).to.be.ok();
    });
    it('has user logged in user ID',async ()=> {
        expect(api.loggedInUserId).to.be.a('number');
    });
});
describe('Test GET Metadata',()=>{
    let result = null;
    it('GET Metadata',async ()=> {
        result =  await api.getMetaData();
        expect(result.data).to.be.ok();
    });
});
describe('Test GET Update',()=>{
    let result = null;
    it('GET Update',async ()=> {
        result =  await api.getUpdate();
        expect(result.data).to.be.ok();
        household = result.data;
    });
    it('has households',async ()=> {
        expect(result.data.households).to.not.be.empty();
    });
    it('has at least one household Id',async ()=> {
        expect(result.data.households[0].id).to.be.a('number');
    });
    it('has pets',async ()=> {
        expect(result.data.pets).to.not.be.empty();
    });
    it('has devices',async ()=> {
        expect(result.data.devices).to.not.be.empty();
    });
    it('has tags',async ()=> {
        expect(result.data.tags).to.not.be.empty();
    });
    it('has user',async ()=> {
        expect(result.data.user).to.be.ok();
    });
});
describe('Test GET Timeline',()=>{
    let result = null;
    it('GET Timeline',async ()=> {
        result =  await api.getTimeline(household.households[0].id);
        expect(result.data).to.be.an(Array);
    });
    it('has 25 timeline entries', ()=> {
        expect(result.data.length).to.be(25);
    });
});
describe('Test set pet whereabout',()=>{
    let petId = null;
    let whereBit = null;
    it('Get first pet in pets array of household',async ()=> {
        petId = household.pets[0].id;
        expect(petId).to.be.a('number');
    });
    it('Get whereabout of this pet',async ()=> {
        whereBit = household.pets[0].status.activity.where;
        expect(whereBit).to.be.a('number');
    });
    it('Set new whereabaout of this pet',async ()=> {
        wherebit = household.pets[0].status.activity.where;
        let setTo = whereBit === utils.petPlaceCommands.INSIDE ?
        utils.petPlaceCommands.OUTSIDE :
        utils.petPlaceCommands.INSIDE 
        result =  await api.setPetPlace(petId, setTo);
        expect(result).to.be.ok();
    });
    it('Set back whereabaout of this pet',async ()=> {
        wherebit = household.pets[0].status.activity.where;
        result =  await api.setPetPlace(petId, whereBit);
        expect(result).to.be.ok();
    });
});
describe('Test door commants',async function () {
    this.timeout(20000);
    let testDoor = null;
    let testDoorState = null;
    it('verify test door',async ()=> {
        let testDoors = household.devices.filter(d => d.product_id === utils.products.DOOR 
            || d.product_id === utils.products.DOOR_SMALL);   
        testDoor = testDoors[0];    
        expect(testDoor).to.be.ok();
        expect(testDoor.id).to.be.a('number');
    });
    it('verify state of test door',async ()=> {
        testDoorState = testDoor.status.locking.mode;
        expect(testDoorState).to.be.a('number');
    });
    it('Set new door state', async ()=> {
        let setTo = testDoorState === utils.doorCommands.OPEN ?
        utils.doorCommands.CLOSE :
        utils.doorCommands.OPEN;
        let result = await api.toggleDoor(testDoor.id, setTo);
        expect(result.results).to.not.be.empty();
    });
    it('Set back door state', async ()=> {
        // give petcare some time ...
        await new Promise(r => setTimeout(r, 8000));
        let result = await api.toggleDoor(testDoor.id, testDoorState);
        expect(result.results).to.not.be.empty();
    });
});
describe('Test reset feeder',async function () {
    this.timeout(20000);
    let testFeeder = null;
    it('verify test feeder device',async ()=> {
        let testFeeders = household.devices.filter(d => d.product_id === utils.products.FEEDER_LITE 
            || d.product_id === utils.products.FEEDER);   
        testFeeder = testFeeders[0];    
        expect(testFeeder).to.be.ok();
        expect(testFeeder.id).to.be.a('number');
    });
    it('reset feeder ',async () => {
        let result = await api.resetFeeder(utils.feederResetCommands.LEFT,testFeeder.id);
        expect(result).to.be.ok();
        expect(result.results).to.not.be.empty();
    });
});
