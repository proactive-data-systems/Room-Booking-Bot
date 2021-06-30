/**
 * 
 * Command: availabile or avail or check
 * Function:  check if room is available for booking or not
 *  
 * ====================================== DOC =================================================
 * This module handles the 'avail/check/show' command functionality.The module performs a database
 * check for the specified room name and date.
 * 
 * Usage:
 * type 'avail/show/check' and follow onscreen instruction.
 *              OR
 * avail/check/show <room name> <date>
*/

const {BotkitConversation}=require('botkit');
const backend=require('../backend/backend.js');
const global_vars=require('../common_vars.js');

var roomInfo;
var dateBook;
var roomsList;
var roomsCount;
var emailId;

const availHelpExp=/avail help/i;
const checkHelpExp=/check help/i;
const showHelpExp=/show help/i;

const singleLineAvailExp=/avail\s[a-z,0-9]*\s[0-9]{0,2}-[0-9]{0,2}-[0-9]{0,4}/gi;
const singleLineCheckExp=/check\s[a-z,0-9]*\s[0-9]{0,2}-[0-9]{0,2}-[0-9]{0,4}/gi;
const singleLineShowExp=/show\s[a-z,0-9]*\s[0-9]{0,2}-[0-9]{0,2}-[0-9]{0,4}/gi;


var getHelpMessage=async()=>{
    /**
     * Builds the help message for 'avail/check/show help' command.
     * @return {String} message in markdown format.
     */
    var message;
    message="This command displays the schedule of the room for the given date.\n"+
    "####\t<b>How to Use:</b>\n"+
    "- <b>show/avail/check</b> <b>roomname</b> <b>date</b>  \n"+
    "<b>\t\tOR</b>  \n"+
    "- Type <b>show</b> or <b>avail</b> or <b>check</b> and continue with onscreen instructions  \n\n"+
    "####<b>Details</b>:  \n"+
    "- <b>roomname</b> : Name of the room you need to see schedule for.  \n"+
    "- <b>date</b>: should be in *<b>dd-mm-yyyy</b>* format. eg. 28-10-2019 \n"+
    "- <b>Eg</b>. show room1 28-10-2019\n"+
    "- <b>Note</b>: Date and time which are passed will not be valid.  \n";
    return message;
}

var roomNameValidation=async(user_input)=>{
    /**
     * Checks whether room id entered by user exists or not in the database.
     * returns true if exists else false.
     * @param {String} user_input Room Name as string or Room Number as integer.
     * @return {String} check True or False based on the response from query.
     */
    let check=false;
    roomsDetails=roomsList;
    if(isNaN(parseInt(user_input))){
        // i.e user entered name of the room.
        var correctName=false;
        for(let i=0;i<roomsCount;i++){
            // ==== Outlook ====
            if(roomsDetails[i]['name'].toLowerCase()==user_input.toLowerCase()){
                roomId=roomsDetails[i]['address'];
                roomName=roomsDetails[i]['name'];
                correctName=true;
                break;
            }
            // =================
        }
        if(!correctName){
            // Name not found in the list.
            check=false;
        }else{
            // Name found in the list.
            check=true;
        }
    }else if(!isNaN(parseInt(user_input))&&parseInt(user_input)<=roomsCount){
        // ==== Outlook ====
        roomId=roomsDetails[parseInt(user_input)-1]['address'];
        roomName=roomsDetails[parseInt(user_input)-1]['name'];
        // =================
        check=true;
    }
    return check;
}


module.exports=(controller)=>{
    /**
     * Listening to the controller for message cross-checking.
     * @param {Object} controller object of type Botkit.
     */
    const AVAIL_DIALOG_ID='avail_dialog';
    let availDialog=new BotkitConversation(AVAIL_DIALOG_ID,controller);
    availDialog.addMessage('Action Cancelled.','action_cancel');
    availDialog.ask('Enter room name followed by date(dd-mm-yyyy).Type cancel to quit.',[
    {
        pattern:'cancel',
        handler:async(response,convo,bot)=>{
            await convo.gotoThread('action_cancel');
        },
    },
    {
        default:true,
        handler:async(response,convo,bot)=>{
            response=response.split(" ");
            roomName=response[0];
            let check=await roomNameValidation(roomName);
            if(!check){
                await bot.say(`Room with name doesn't exist.`);
                await convo.repeat();
            }
            let roomEmail=await backend.getRoomEmailId(roomName,roomsList);
            dateBook=response[1];
            check=await backend.dateValidation(dateBook);
            if(!check){
                await bot.say('Invalid Date. Either the date has passed or not in proper format.');
                await convo.repeat();
            }
            // ==== OUTLOOK ====
            let schedule=await backend.getOutlookMySchedule(roomsList,roomEmail,dateBook,"",true);
            await console.log('INFO : COMMAND : avail/show/check : bookingsCount : ',schedule.length);
            if(!schedule){
                await bot.say('Room is availabale for full day.');
            }else{
                let reply=await backend.buildOutlookScheduleMessage(roomName,dateBook,schedule);
                await bot.say(reply);
            }
            // =================
        }
    }
    ],'date_dialog');
    controller.addDialog(availDialog);
    // 
    // ==============================================================================
    // 
    // Help Message.
    controller.hears([availHelpExp,checkHelpExp,showHelpExp],['direct_message','message'],async(bot,message)=>{
        /**
         * Listening to the 'check/avail/show help' command.
         */
        let config=bot._config;
        bot=await controller.spawn();
        bot._config=config;
        let helpMessage=await getHelpMessage();
        await console.log('INFO : avail/check/show help : user :',message.personEmail);
        await bot.reply(message,{markdown:helpMessage});
    });
    // Single line functionality.
    controller.hears([singleLineAvailExp,singleLineCheckExp,singleLineShowExp],['direct_message','message'],async(bot,message)=>{
        /**
         * Listening to the 'check/avail/show <roomname> <date>' command.
         */
        let config=bot._config;
        bot=await controller.spawn();
        bot._config=config;
        await console.log('INFO: COMMAND: avail/available/check/show (SINGLE LINE) : user :',message.personEmail);
        roomsList=global_vars.roomsList;
        emailId=message.personEmail;
        roomsCount=roomsList.length;
        let tempMsg=message.text.split(" ");
        roomInfo=tempMsg[1];
        dateBook=tempMsg[2];
        // ==== OUTLOOK ====
        let check=await roomNameValidation(roomInfo);
        if(!check){
            await bot.say(`Room with name doesn't exist.`);
        }else{
            check=await backend.dateValidation(dateBook);
            if(!check){
                await bot.say('Invalid Date. Either the date has passed or not in proper format.');
            }else{
                let roomEmail=await backend.getRoomEmailId(roomName,roomsList);
                let schedule=await backend.getOutlookMySchedule(roomsList,roomEmail,dateBook,"",true);
                await console.log('INFO : COMMAND : avail/show/check : bookingsCount : ',schedule.length);
                if(!schedule){
                    await bot.say('Room is availabale for full day.');
                }else{
                    let reply=await backend.buildOutlookScheduleMessage(roomName,dateBook,schedule);
                    await bot.say(reply);
                }
            }
        }
        // =================

    });
    // Hearing for command.
    controller.hears(["avail","available","check","show"],['direct_message','message'],async(bot,message)=>{
        /**
         * Listening to the 'avail/check/show' command.
         */
        let config=bot._config;
        bot=await controller.spawn();
        bot._config=config;
        await console.log('INFO: COMMAND: avail/available/check/show : user :',message.personEmail);
        roomsList=global_vars.roomsList;
        emailId=message.personEmail;
        roomsCount=roomsList.length;
        await bot.beginDialog(AVAIL_DIALOG_ID);
    });
}

