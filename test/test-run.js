import petcare from './test-setup.js';

petcare.on("message", (mes) => {
    // Here you can listen for pre defined messages 
    //look in the "message events" section for more details
    console.log(mes);
});

petcare.on("direct_message", (msg) => {
    //* Here you can listen for unfiltered messages 
    //look in the "direct_message events" section for more details
    console.log(`direct mes: ${msg.id} type:${msg.type}`);
});

petcare.on("started", (start) => {
    //This event will be fired as soon as the initializing is done   
    //after creating a new instance of PetCare
    console.log(start);
});

petcare.on("info", (info) => {
    //Listen for info events like when a door command was triggert and so on
    console.log(info);
});

petcare.on("error", (err) => {
    //All errors are already logged to the console with the winston framework 
    //if you need them to send anywhere else, you can use this listener
    console.log(err);
});