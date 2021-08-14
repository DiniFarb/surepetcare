Array.prototype.addOnlyNew = function (arr) {
    arr.forEach(e=>{
       if(!this.find(lo=>lo.id === e.id)) this.push(e); 
    });
    return this;
};

module.exports = require('./lib/PetCare');