// 
//  Webex Teams Room Booking Bot.
// 
// This is the main file for the Room Booker Bot.

require('dotenv').config(); // Load process.env values from .env file

// Import Botkit's core features
const { Botkit} = require('botkit');
const { WebexAdapter } = require('botbuilder-adapter-webex'); // Import a platform-specific adapter for webex.

// Custom Made Modules
var backend=require('./backend/backend.js');
var global_vars=require('./common_vars.js');

if (!process.env.ACCESS_TOKEN) {
    console.log("Could not start as this bot requires a Webex Teams API access token.");
    console.log("Please invoke with an ACCESS_TOKEN environment variable");
    console.log("Example: ");
    console.log("> ACCESS_TOKEN=XXXXXXXXXXXX PUBLIC_URL=YYYYYYYYYYYYY node bot.js");
    process.exit(1);
}
if (!process.env.PUBLIC_URL) {
    console.log("Could not start as this bot must expose a public endpoint.");
    console.log("Please add env variable PUBLIC_URL on the command line");
    console.log("Example: ");
    console.log("> ACCESS_TOKEN=XXXXXXXXXXXX PUBLIC_URL=YYYYYYYYYYYYY node bot.js");
    process.exit(1);
}
if (!process.env.LIMIT_TO_DOMAIN) {
    console.log("Warning bot should have a limit to domain. Bot may behave unexpectedly.");
    console.log("Please add env variable LIMIT_TO_DOMAIN on the command line or .env file");
    console.log("For example check .env file.");
}

var env = process.env.NODE_ENV || "development";

// Adapter for Webex.
const adapter = new WebexAdapter({
    access_token: process.env.ACCESS_TOKEN,
    public_address: process.env.PUBLIC_URL,
    // secret: process.env.SECRET, // RECOMMENDED security setting that checks if payload originated from Webex.
    // Below: Not needed since we are using registerAdaptiveCardWebhookSubsciption.
    // webhook_name: process.env.WEBHOOK_NAME || ('built with BotKit (' + env + ')'),
});
// Controller for handling incoming events.
const controller = new Botkit({
    webhook_uri: '/api/messages',
    adapter: adapter,
    limit_to_domain: [process.env.LIMIT_TO_DOMAIN],   
});

controller.middleware.ingest.use(async(bot,message,next)=>{
    /**
     * When mentioned in a group omitting the @<botname>
     * from message.
     */
    if(message.roomType=='group' && message.type!='self_message'){
        let msg=message.text.split(process.env.BOT_NAME);
        message.text=msg[1];
    }
    message.logged=true;
    await next();
});

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(async() => {
    global_vars.roomsList=await backend.getOutlookRoomsList();
    // load traditional developer-created local custom skills modules
    try{
        controller.loadModules(__dirname + '/features');
    }catch(err){
        console.log('ERROR: Could not load features.Check features files.\n');
        console.log(err);
        process.exit();
    }
    await console.log("INFO: Modules Loaded");
    await controller.adapter.registerAdaptiveCardWebhookSubscription('/api/messages');
    await console.log('INFO: Register Adaptive Card Webhook');
});

controller.on('attachmentActions',async(bot,message)=>{
    await console.log('INFO : attachmentActions : Card Type : ',message.value.card_type);
    switch(message.value.card_type){
        case 'scheduleCard':
            await controller.trigger('scheduleCard',bot,message);
            break;
        case 'bookCard':
            await controller.trigger('bookCard',bot,message);
            break;
        case 'foodOrders':
            await controller.trigger('foodOrders',bot,message);
            break;
        default:
            break;
    }
});


process.on('unhandledRejection',(reason,p)=>{
    // Printing Unhandled Rejection along with Promise and Reason.
    console.log('Unhandled Rejection at: Promise',p,'Reason: ',reason);
});
