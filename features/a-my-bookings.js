/**
 * 
 * Command: my bookings
 * Function: show all bookings for user.
 *  
 * ====================================== DOC ================================================= 
 * This module handles the 'my bookings' command functionality.The module performs a database 
 * check using the user's email id for bookings and displays them.
 * 
 * Usage:
 * type 'my bookings'.
*/

const backend=require('../backend/backend.js');
const global_vars=require('../common_vars.js');
var emailId;

const myBookingWithDate=/my bookings\s[0-9]{0,2}-[0-1][0-9]-[0-9]{0,4}/gi;
const myBookingsExp=/my bookings/gi;
const myBookingToday=/my bookings\stoday/gi;


var getHelpMessage=async()=>{
     /**
     * Builds the help message for 'my bookings help' command.
     * @return {String} built message in markdown format.
     */
    var message;
    message="This command is used to list all your bookings."+
    "####<b>\tHow to Use:</b>   \n"+
    "- Type '<b>my bookings</b> <b>date<b>'.\n"+
    "- date: (required) date of the day you want to check schedule of\n"+
    "- eg: my bookings 30-08-2019\n"+
    "- eg: my bookings today\n\n";
    return message;
}

var parseMessage=async(message)=>{
    /**
     * Parse the message to retrieve date,timeslot,subject
     * @param {String} message input message from user.
     * @return {[String,String,String]} date,timeslot,meeting subject
     */
    message=message.split(" ");
    let date=message[2];
    let timeSlot=message[3];
    let subject=message[4];
    return [date,timeSlot,subject];
}

var getCancelData=async(bookingData)=>{
    /**
     * Build cancelData json to provide for cancellation of booking.
     * @param {Dict} bookingData a single dict containing details of booking to cancel.
     * @return {Dict} dict built to provide to cancellation function.
     */
    let startTime=bookingData.start.dateTime;
    let endTime=bookingData.end.dateTime;
    startTime=await backend.parseTimeForBuildMessage(startTime);
    endTime=await backend.parseTimeForBuildMessage(endTime);
    let slot=`${startTime}-${endTime}`;
    let date=await backend.parseDateForBuildMessage(bookingData.start.dateTime);

    let cancelRoomName=bookingData.attendees[0].emailAddress.name;

    await console.log('INFO : getCancelData : slot :',slot);
    await console.log('INFO : getCancelData : date :',date);
    await console.log('INFO : getCancelData : room name :',cancelRoomName);
    
    let cancelData={
        timeSlot:slot,
        roomName:cancelRoomName,
        date:date
    };

    return cancelData;
}

module.exports=(controller)=>{
    /**
     * Listening to the controller for message cross-matching.
     * @param {Object} controller object of type Botkit.
     */
    // 
    // =================================================================================================
    //
    controller.hears(['my bookings help'],['direct_message','message'],async(bot,message)=>{
        /**
         * Listening to 'my bookings help' command.
         */
        await console.log('INFO: COMMAND: my bookings help : user :',message.personEmail);
        let config=bot._config;
        bot=await controller.spawn();
        bot._config=config;
        let msg=await getHelpMessage();
        await bot.reply(message,{markdown:msg});
    });
    controller.hears([myBookingsExp,myBookingWithDate,myBookingToday],['direct_message','message'],async(bot,message)=>{
        /**
         * Listening to 'my bookings' command.
         */
        let config=bot._config;
        bot=await controller.spawn();
        bot._config=config;
        emailId=message.personEmail;
        var roomsList=global_vars.roomsList;
        await console.log('INFO: COMMAND: my bookings : user :',emailId);
        let [date,timeSlot,meetingSubject]=await parseMessage(message.text);
        var bookings;
        let continueCommand=false
        let exitCommand=true;
        if(date=='today'){
            date=new Date();
            date=`${date.getDate().toString()}-${(date.getMonth()+1).toString()}-${date.getFullYear().toString()}`;
        }
        if(date==undefined || date==''){
            // date and timeslot not mentioned
            await bot.reply(message,'Please mention a date. See my booking help for more info');
            continueCommand=false;
        }else if(timeSlot==undefined || timeSlot==''){
            // date mentioned , timeslot not mentioned
            await console.log('INFO: COMMAND: my bookings : Date Mentioned : Time Slot not mentioned');
            exitCommand=false;
            let [check,futureDate]=await backend.dateValidation(date);
            if(!check){
                await bot.reply(message,'Invalid date. Either the date has passed or not in proper format');
            }else{
                continueCommand=true;
                bookings=await backend.getOutlookMySchedule(roomsList,emailId,date);
            }
        }
        if(continueCommand && bookings.length!=0){
            await console.log('INFO: COMMAND: my bookings: bookingsCount : ',bookings.length);
            let replyMsg=await backend.getScheduleAdaptiveCard(bookings,roomsList,date);
            if(replyMsg==false){
                await bot.reply(message,`There are no bookings for you on ${date}.`);
            }else{
                messageId=await bot.reply(message,replyMsg);
            }
        }else if(!exitCommand){
            await bot.reply(message,`There are no bookings made by you for ${date}.`);
        }
        await controller.on('scheduleCard',async(bot,message)=>{
            await bot.api.messages.remove(message.messageId);
            await console.log('INFO : my bookings : scheduleCard : ',message.value);
            let booking=await backend.getOutlookMySchedule(roomsList,emailId,date);
            
            // Functionality for deleting the selected booking.
            await bot.reply(message,'Please wait while we are processing your request.');
            let deleteBookingResult=await backend.deleteOutlookBooking(emailId,booking[message.value.id].id);
            if(!deleteBookingResult){
                await bot.say('There was an internal error processing your request. Please try again later.');
                booking=await backend.getOutlookMySchedule(roomsList,emailId,date);
                let replyMsg=await backend.getScheduleAdaptiveCard(booking,roomsList,date);
                messageId=await bot.reply(message,replyMsg);    
            }else{
                let cancelData=await getCancelData(booking[message.value.id]);
                let cancelMailCheck=await backend.sendCancelConfirmationMailToUser(emailId,cancelData);
                if(cancelMailCheck){
                    await bot.say('Your booking has been cancelled. You will receive confirmation mail shortly.');
                }else{
                    await bot.say('Sorry, email confirmation service is down but your cancellation has been done.');
                }
                booking=await backend.getOutlookMySchedule(roomsList,emailId,date);
                let replyMsg=await backend.getScheduleAdaptiveCard(booking,roomsList,date);
                if(replyMsg==false){
                    await bot.reply(message,`Now,there are no bookings left for you on ${date}.`);
                }else{
                    await bot.reply(message,replyMsg);
                }
            }
        });
    });
}
