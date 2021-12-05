Array.prototype.addOnlyNew = function (arr) {
    arr.forEach(e=>{
       if(!this.find(lo=>lo.id === e.id)) this.push(e); 
    });
    return this;
};

import PetCare from './lib/PetCare.js';

export default PetCare
