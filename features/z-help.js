/* 
 * Command: help
 * Function: displays commands supported by the bot along with what the command does.
 *
 * ====================================== DOC =================================================
 * This module handles the "help" command functionality. It displays all the commands supported by 
 * the bot along with a short description of what does the command perform or do.
 * 
 * IMPORTANT: Add all new commands in commands.js module along with their description.
 * 
 */

// Obtain commands list from commands.js module.
const commandsList=require('../commands.js');
const commands=commandsList.commands;

module.exports=(controller)=>{
    controller.hears(["help", "who","hi","HI","Hi"],['direct_message','message'], async(bot, message)=>{
        let config=bot._config;
        bot=await controller.spawn();
        bot._config=config;
        
        await console.log('INFO: COMMAND: help/who/hi/Hi/HI : user :',message.personEmail);
        var text = "Here are my skills:";
        text += "\n- " +"<b>help</b>" +": spreads the word about my skills";
        // Added
        for (var key in commands){
            // commands is a dict declared in commands.js
            // stores commands in a separate variable along with description
            if(commands.hasOwnProperty(key)){
                text +="\n- "+"<b>"+key+"</b>"+": "+commands[key];
            }
        }
        // Using markdown text(supported by webex teams) for better readability.
        await bot.reply(message,{markdown:text});
        await bot.reply(message,`In a group use @botname to mention the bot and then message.`);
        // End Message
        await bot.reply(message,{markdown:'For more info regarding a particular command use *<b>command help</b>*'});
        
    }); 
    

}