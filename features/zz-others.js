/**
 * This module is created to handle message when there is no matching expression. 
 */

const regEx=/^.*/i;
module.exports=(controller)=>{
    controller.on('receive_error',async(err,bot,message)=>{
        await bot.reply(message,`There was an error processing your request. Please try again later.`);
        await console.log("ERROR:: Error Event Received:",err);
    });
    controller.on('message_received',async(err,bot,message)=>{
        await console.log('Message Was Received');
    });
    controller.hears(regEx,['direct_message','message'],async(bot,message)=>{
        let config=bot._config;
        bot=await controller.spawn();
        bot._config=config;
        await console.log("INFO : COMMAND: Not recognized.: user :",message.personEmail,": message :",message.text);
        await bot.reply(message,`Sorry, I didn't understand that. Please try help.`);
    });
};
