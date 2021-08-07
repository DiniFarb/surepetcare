const PetCareAPI = require('../lib/PetCareAPI');
const Utils = require('../lib/Utils');
const expect = require('expect.js');
let logindata = null;
let household = null;

describe('Test login Petcare',()=>{
    it('Login',async ()=> {
        
        logindata =  await PetCareAPI.login();
        expect(logindata.data).to.be.ok();
    });
    it('has user data',async ()=> {
        logindata =  await PetCareAPI.login();
        expect(logindata.data.user).to.be.ok();
    });
    it('has token',async ()=> {
        logindata =  await PetCareAPI.login();
        expect(logindata.data.token).to.be.ok();
    });
});

describe('Test GET Metadata',()=>{
    let result = null;
    it('GET Metadata',async ()=> {
        result =  await PetCareAPI.getMetaData(logindata.data);
        expect(result.data).to.be.ok();
    });
});

describe('Test GET Update',()=>{
    let result = null;
    it('GET Update',async ()=> {
        result =  await PetCareAPI.getUpdate(logindata.data);
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
        result =  await PetCareAPI.getTimeline(household.households[0].id, logindata.data);
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
        let setTo = whereBit === Utils.petPlaceCommands.INSIDE ?
        Utils.petPlaceCommands.OUTSIDE :
        Utils.petPlaceCommands.INSIDE 
        result =  await PetCareAPI.setPetPlace(petId, setTo, logindata.data);
        expect(result).to.be.ok();
    });
    it('Set back whereabaout of this pet',async ()=> {
        wherebit = household.pets[0].status.activity.where;
        result =  await PetCareAPI.setPetPlace(petId, whereBit, logindata.data);
        expect(result).to.be.ok();
    });
});

describe('Test set door state',()=>{
    
});

describe('Test reset feeder',()=>{
    
});
