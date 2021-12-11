import PetCare from '../index.js';
import { config } from 'dotenv';
config();

import {options} from '../options.js';

const petcare = function setup() {
    try {
        const petcare = new PetCare({
              mail:process.env.MAIL,
              password:process.env.PASSWORD
        },options);
        return petcare;    
      } catch(err){
        console.error(err);
        throw err;
      }
}();

export default petcare;
