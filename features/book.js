/**
 * Command: book
 * Function: book a room.
 *  
 * ====================================== DOC =================================================
 * This module handles the "book" command functionality. The module performs a database check 
 * whenever a request is put through to book the room. It displays an adaptive card with 
 * necessary details required to be filled by the user. If room is available it is booked otherwise
 * schedule for that room for the particular date is displayed along with the user who booked it.
 * 
 * Usage: 
 * type book and follow onscreen instructions.     
 * 
 */

const backend=require('../backend/backend.js');
const global_vars=require('../common_vars.js');
var bookAdaptiveCard=require('../adaptive_cards/book_card.json');
const {BotkitConversation}=require('botkit');

const bookExp=/book/i;
const bookHelpExp=/book help/i;

var emailId;
var roomsDetails;
var foodOrders=false;

var getHelpMessage=async()=>{
    /**
     * Builds the help message in markdown format for book command.
     * @return {String} built help message as a string in markdown format.
     */
    var message="This command is used to perform a room booking.  \n"+
    "####<b>\tHow to Use:</b>   \n"+
    "- <b>Type book and fill the form.</b>\n";
    return message;    
}

var getBookAdaptiveCard=async(roomsList)=>{
    /**
     * Builds adaptive card json for book command.
     * @param {Dict} roomsList rooms list
     * @return {JSON} adaptive card json for book command.
     */
    let rooms=[];
    Object.keys(roomsList).forEach(room => {
        let details=roomsList[room];
        rooms.push({"title":`${details.displayName}, ${details.officeLocation}, ${details.capacity}`,"value":details.displayName});
    });
    bookAdaptiveCard.body[2].choices=rooms;
    let adaptiveCard={
        "text":"Sorry but this is not yet supported in mobile devices. Try using desktop application or web-browser.",
        "attachments":[
            {
                "contentType":"application/vnd.microsoft.card.adaptive",
                "content":bookAdaptiveCard
            }
        ]
    };
    return adaptiveCard;
}
var byPassFunction=async(bot,controller,dialogId)=>{
    /**
     * 
     */
    await bot.beginDialog(dialogId);
    if(foodOrders){
        await controller.trigger('bookCard/foodOrders');
    }
    return true;
}
module.exports=(controller)=>{
    /**
     * Listening to the controller for message cross-checking.
     * @param {Object} controller object of type Botkit.
     */
    var foodOrdersResponse;
    const foodOrderDialogId='foodOrderDialog';
    const foodOrderDialog=new BotkitConversation(foodOrderDialogId,controller);
    foodOrderDialog.ask(`Do you want to pre-order food and beverages for the meeting ? 'yes' or 'no'.`,[{
        pattern:['no','NO','n','N','nO'],
        handler:async(response,convo,bot)=>{
        },
    },
    {
        pattern:['yes','Yes','y','Y','YEs','YES','yEs','yES','yeS'],
        handler:async(response,convo,bot)=>{
            foodOrders=true;
        }
    }
    ],'foodOrderYesNo');
    controller.addDialog(foodOrderDialog);
    // Help Message.
    controller.hears(bookHelpExp,['direct_message','message'],async(bot,message)=>{
        /**
         * Listening to the 'book help' command.
         */
        let config=bot._config;
        bot=await controller.spawn();
        bot._config=config;
        let helpMessage=await getHelpMessage();
        await console.log('INFO : book help : user : ',message.personEmail);
        await bot.reply(message,{markdown:helpMessage});
    });        
    // Hearing for 'book' command.
    controller.hears(bookExp,['direct_message','message'],async(bot,message)=>{
        bookMessageReceived=true;
        let config=bot._config;
        bot=await controller.spawn();
        bot._config=config;
        emailId=message.personEmail;
        await console.log('INFO: COMMAND: book : user :',emailId);
        roomsDetails=global_vars.roomsList;
        let card=await getBookAdaptiveCard(roomsDetails);
        await bot.reply(message,card);
        await controller.on('bookCard',async(bot,message)=>{
            await bot.api.messages.remove(message.messageId);
            let userInput=message.value;
            await console.log('INFO: book : bookCard : ',userInput);
            // Date Validation.
            let date=userInput.book_date.split("-");
            date=`${date[2]}-${date[1]}-${date[0]}`;
            let dateCheck,futureDate;
            [dateCheck,futureDate]=await backend.dateValidation(date);
            await console.log("INFO: book : dateValidation Response : dateCheck : ",dateCheck);
            await console.log("INFO: book : dateValidation Response : futureDate : ",futureDate);
            // Time Validation
            let startTime=userInput.start_time.split(":");
            let endTime=userInput.end_time.split(":");
            let timeSlot=`${startTime[0]}${startTime[1]}-${endTime[0]}${endTime[1]}`;
            let timeCheck=await backend.timeValidation(timeSlot,futureDate);
            if(!dateCheck){
                await bot.reply(message,`Date entered has already passed. Try again.`);
            }else{
            if(!timeCheck && dateCheck){
                if((startTime[0]*60+startTime[1])>(endTime[0]*60+endTime[1])){
                    await bot.reply(message,`Start time cannot be more than end time.`);
                    timeCheck=false;
                }else{
                    await bot.reply(message,'Time entered has already passed. Try again.');
                }
            }else{
                if((parseInt(startTime[0])*60+parseInt(startTime[1]))>(parseInt(endTime[0])*60+parseInt(endTime[1]))){
                    await bot.reply(message,`Start time cannot be more than end time.`);
                    timeCheck=false;
                }
            }
            let roomName=userInput.room_list;
            let roomEmailId=roomsDetails[roomName].emailAddress;
            if(dateCheck&&timeCheck){
                let check=true;
                var bookings=await backend.getOutlookScheduleBetween(roomEmailId,timeSlot,date);
                await console.log(bookings);
                if(bookings.length!=0){
                    check=false;
                }
                if(check){
                    let resultPost;
//                     let r=await byPassFunction(bot,controller,foodOrderDialogId);
//                     await process.exit();
                    if(userInput.meeting_title==""){
                        resultPost=await backend.postOutlookBooking(roomEmailId,"",emailId,timeSlot,date);
                    }else{
                        resultPost=await backend.postOutlookBooking(roomEmailId,"",emailId,timeSlot,date,userInput.meeting_title);
                    }
                    if(resultPost){
                        await bot.reply(message,`Room ${roomName} booked for ${emailId} for time ${startTime[0]}:${startTime[1]}-${endTime[0]}:${endTime[1]} on ${date}.`);
                    }else{
                        await bot.reply(message,`There was an internal error with the bot. Please try again.`);
                    }
                }else{
                    await bot.reply(message,'Room is already booked for that slot.');
                    let replyMsg=await backend.getScheduleClashAdaptiveCard(bookings,roomsDetails);
                    replyMsg.attachments[0].content.body[0].items[0].text=`Here are the details for room ${roomName}:`;
                    await bot.reply(message,replyMsg);
                }
            }
            }
        }); 
    });
    controller.on('bookCard/foodOrders',async(bot,message)=>{
        await console.log('INFO: bookCard/foodOrders');
        let card=await backend.getFoodOrdersAdaptiveCard();
        await bot.reply(message,card);
    });
    controller.on('foodOrders',async(bot,message)=>{
        await console.log('INFO: foodOrders');
        foodOrdersResponse=message.value;
    });    
}
