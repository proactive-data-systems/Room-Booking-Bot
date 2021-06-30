/**
 * Command: list
 * Function: lists all the rooms.
 * 
 * ====================================== DOC =================================================
 * This module handles the 'list' command functionality. The module performs a database query to 
 * get the list of all rooms and display them in a markdown text format for better visibility.
 * 
 * Usage: list
 */

const backend=require('../backend/backend.js');
const global_vars=require('../common_vars.js');
const listHelpExp=/list help/i; 

var getHelpMessage=async()=>{
    /**
     * Builds the help message for 'list help' command.
     * @return {String} help message as string in markdown format.
     */
    let message;
    message="This command lists all the rooms that can be booked along with their email ids.\n"+
    "####<b>\tHow to use:</b>   \n"+
    "- Type <b>list</b> or <b>list rooms</b>. \n";
    return message;
}

module.exports=(controller)=>{
    // 
    // =================================================================================================
    // 
    // Help Message
    controller.hears(listHelpExp,['direct_message','message'],async(bot,message)=>{
        /**
         * Listening for 'list help' command.
         */
        let config=bot._config;
        bot=await controller.spawn();
        bot._config=config;
        let helpMessage=await getHelpMessage();
        await console.log('INFO : list help : user :',message.personEmail);
        await bot.reply(message,{markdown:helpMessage});
    });
    // Hearing for 'list' command.
    controller.hears(['list','list rooms'],['direct_message','message'],async(bot,message)=>{
        /**
         * Listening for 'list' or 'list rooms' command.
         */
        let config=bot._config;
        bot=await controller.spawn();
        bot._config=config;
        await console.log('INFO: COMMAND: list or list rooms : user :',message.personEmail);
        
        // ==== OUTLOOK ====
        var roomsDetails=await backend.getOutlookRoomsList();
        global_vars.roomsList=roomsDetails;
        var roomsCount=roomsDetails.length;
        var roomsInfo="#### List of available rooms:\n";
        for(let i=0;i<roomsCount;i++){
            roomsInfo=roomsInfo+`${i+1}. ${roomsDetails[i]['name']}\t(${roomsDetails[i]['address']})\n`;
        }
        // =================
        await bot.reply(message,{markdown:roomsInfo});
    });
}