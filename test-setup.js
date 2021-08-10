const PetCare = require('./index');
require('dotenv').config();

const petcareOptions = require('./options');

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
