import pc from './test-setup';

function start() {
    return new Promise(((resolve, reject) =>{
        try {
            pc.on('started',(msg)=>{
                pc.setDoorState('Mauzis Welt', 2);
                resolve({pc:pc,msg:msg});
            });
            pc.on('error',err=>console.log(`${err}`));
            pc.on('message',msg=>console.log(`${msg}`));
        } catch (err) {
            reject(err);
        }   
    }));
}
start()
 