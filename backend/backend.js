/**
 * ================================ DOC ================================================
 * This module handles all the backend/database operations for the bot.
 */


const {DateTime}=require('luxon');
const util=require('util');

require('dotenv').config();

var getTimeInIndianFormat=async(time)=>{
  time=time.split("-");
  let startTime=parseInt(time[0]);
  let endTime=parseInt(time[1]);
  startHr=parseInt(startTime/100);
  endHr=parseInt(endTime/100);
  startMin=startTime%100;
  endMin=endTime%100;
  var startpm=false;
  var endpm=false;
  if(startHr>=12){
    startHr=startHr-12;
    startpm=true;
  }else if(startHr==0){
    startHr=12;
  }
  if(endHr==0){
    endHr=12;
    endpm=false;
  }else if(endHr>=12){
    endHr=endHr-12;
    endpm=true;
  }
  if(startMin<10){
    startMin="0"+startMin.toString();
  }
  if(endMin<10){
    endMin="0"+endMin.toString();
  }
  var timing;
  if(startpm && endpm){
    timing=`${startHr}:${startMin} PM - ${endHr}:${endMin} PM`;
  }else if(startpm && !endpm){
    timing=`${startHr}:${startMin} PM - ${endHr}:${endMin} AM`;
  }else if(endpm && !startpm){
    timing=`${startHr}:${startMin} AM - ${endHr}:${endMin} PM`;
  }else{
    timing=`${startHr}:${startMin} AM - ${endHr}:${endMin} AM`;
  }
  return timing;
}

var getTimeInMinutes=async(timeSlot)=>{
  /**
   * Performs changing the timeSlot to minutes. Returning a two values startTime and endTime in minutes as integers.
   * @param {String} timeSlot timeslot in string as hh:mm-hh:mm
   * @return {[Integer,Integer]} startTime and endTime respectively
   */
  // Old format Time
  // timeSlot=timeSlot.split("-");
  // let start=timeSlot[0].split(":");
  // let end=timeSlot[1].split(":");

  timeSlot=timeSlot.split("-");
  let startTime=parseInt(timeSlot[0]);
  let endTime=parseInt(timeSlot[1]);
  startTime=parseInt(startTime/100)*60+startTime%100;
  endTime=parseInt(endTime/100)*60+endTime%100;

  return [startTime,endTime];
}

// ==================================== VALIDATION CHECKS ===================================

exports.dateValidation=(user_input)=>{
  /**
   * Checks whether date entered by user is in the past or not
   * return true if date validation passed else return false.
   *  @param {String} user_input Date format in 'dd-mm-yyyy'
   *  @return {Boolean} True or False based on the check.
   * 
   */
  
  let today=new Date();
  try{
      user_input=user_input.split("-");
  }catch(err){
      console.log('dateValidation:: invalid date entered');
      return [false,false];
  }
  let dd=parseInt(user_input[0],10);
  let mm=parseInt(user_input[1],10);
  let yyyy=parseInt(user_input[2],10);
  // Date format wrong : Check (includes valid input check)
  if(isNaN(dd)) {console.log('dateValidation:: day is not a number'); return [false,false];}
  if(isNaN(mm)) {console.log('dateValidation:: month is not a number'); return [false,false];}
  if(isNaN(yyyy)) {console.log('dateValidation:: year is not a number'); return [false,false];}
  if(yyyy>2099) {console.log('dateValidation:: year is more than 2099'); return [false,false];}
  if(mm>12 || mm<1) {console.log('dateValidation:: month not between 1 and 12'); return [false,false];}
  if(dd>(new Date(yyyy,mm,0).getDate()) || dd<1) {console.log('dateValidation:: day is invalid for month'); return [false,false];}

  console.log('dateValidation:: Day:',dd);
  console.log('dateValidation:: Month:',mm);
  console.log('dateValidation:: Year:',yyyy);
  let yearDiff=yyyy-parseInt(today.getFullYear(),10);
  console.log('dateValidation:: Year Diff:',yearDiff);
  // Date in past : Check
  if(yearDiff<0||yearDiff>2){
      // year in Past or more than 2 year future.
      console.log('dateValidation:: year in past or more than 2 year future.');
      return [false,false];
  }else if((yyyy-parseInt(today.getFullYear(),10))==0){
      // current year.
      if((mm-parseInt((today.getMonth()+1),10))<0){
          // month in past.
          console.log('dateValidation:: month in past');
          return [false,false]
      }else if((mm-parseInt((today.getMonth()+1),10))==0){
          // current month.
          if((dd-parseInt(today.getDate(),10))<0){
              // date in past
              console.log('dateValidation:: date in past');
              return [false,false];
          }
      }
  }
  if(yearDiff>0&&yearDiff<2){
      console.log('dateValidation:: year in future or present');
      return [true,true];
  }
  let monthDiff=mm-parseInt((today.getMonth()+1),10);
  console.log("dateValidation:: MonthDiff:",monthDiff);
  if(monthDiff>0){
      console.log('dateValidation:: month in future or present');
      return [true,true];
  }
  let dateDiff=dd-parseInt(today.getDate(),10);
  console.log("dateValidation:: DateDiff:",dateDiff);
  if(dateDiff>0){
      console.log('dateValidation:: date in future or present');
      return [true,true];
  }
  return [true,false];    
}

exports.timeValidation=(user_input,futureDate=false)=>{
  /**
   * Checks whether the time entered is in the past or not,
   * return true on success else false.
   * @param {String} user_input hhmm-hhmm format. 
   * @param {Boolean} futureDate True if date is in future otherwise false.
   * @return {Boolean} True or False
   */
  let date=new Date();
  let timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;
  let local_time=DateTime.fromJSDate(date,{zone:timezone});
  let curr_time_hour=local_time['c']['hour'];
  let curr_time_min=local_time['c']['minute'];
  let curr_time=curr_time_hour*60+curr_time_min;
  
  user_input=user_input.split("-");
  let start_time=parseInt(user_input[0]);
  let end_time=parseInt(user_input[1]);
  start_time=parseInt(start_time/100)*60+start_time%100;
  end_time=parseInt(end_time/100)*60+end_time%100;

  console.log('timeValidation:: Future Date:',futureDate);
  console.log('timeValidation:: Start time:',start_time);
  console.log('timeValidation:: End time:',end_time);
  
  if(!futureDate){
    if(curr_time>start_time){
      return false;
    }
    if(curr_time>end_time){
      return false;
    }
  }

  // Time Format Check:
  if(isNaN(start_time)||isNaN(end_time)) {console.log('timeValidation:: startTime or endTime not a number'); return false;}
  if(start_time>1440 || end_time>1440 || start_time<0 || end_time<0)  {console.log('timeValidation:: startTime or endTime more than 1440 or less than 0'); return false;}

  if(start_time>end_time && (start_time<1380 && end_time>60)){
      console.log('timeValidation:: startTime>endTime and not a midnight case');
      return false;
  }
  if(start_time<curr_time && !futureDate){
      // Case: start time is in the past.
      console.log('timeValidation:: startTime<currentTime');
      return false;
  }
  return true;
}

exports.buildScheduleMessageInfo=async(data,dateBook,roomInfo,caseType=0)=>{
  /**
   * Builds the schedule message which displays the booking schedule for the date
   * specified.
   * @param {String or JSON} data data in json or string format.
   * @param {String} dateBook date in user entered format (dd-mm-yyyy).
   * @param {Dict} roomInfo room information in key:value format.
   * @param {Integer} caseType default=0, optional parameter.
   * @return {String} returns the built message in string format.
   */
  data=JSON.parse(JSON.stringify(data));
  let count=await Object.keys(data).length;
  await console.log('Date in buildScheduleMessageInfo:',data);
  await console.log('Count in buildScheduleMessageInfo:',count);

  var replyMessage=`Schedule of ${roomInfo} for ${dateBook}:\n\n`;
  replyMessage=replyMessage+"\t\tBooking Time\t\t|\t\tBooked By\t\t\n";
  for(let i=0;i<count;i++){
      if(data[i]==null){
        continue;
      }
      let startHour=parseInt(data[i]['start']/60);
      let endHour=parseInt(data[i]['end']/60);
      let startMin=data[i]['start']%60;
      let endMin=data[i]['end']%60;
      if(startMin==0){
          startMin="00";
      }
      if(endMin==0){
          endMin="00";
      }
      if(startMin>0 && startMin<=9){
        startMin="0"+startMin.toString();
      }
      if(endMin>0 && endMin<=9){
        endMin="0"+endMin.toString();
      }
      let slot=(startHour).toString()+":"+(startMin).toString()+"-"+(endHour).toString()+":"+(endMin).toString();
      let user=data[i]['user_email'];
      if(caseType==1 && i==1){
        replyMessage=replyMessage+`\t\t${slot}\t\t|\t\t${user}\t\t`;
        replyMessage+=`\t(Tomorrow)\n`;
      }else if(caseType==2 && i==0){
        replyMessage+=`\t\t${slot}\t\t|\t\t${user}\t\t`;
        replyMessage+=`\t(Yesterday)\n`;
      }
      else{
        replyMessage=replyMessage+`\t\t${slot}\t\t|\t\t${user}\t\t\n`;
      }
      
  }
  return replyMessage;
}

// ================================== HELPER FUNCTIONS =======================================

exports.getRoomEmailId=async(roomName,roomsList)=>{
  /**
   * Query to get room email id using room name.
   * @param {String} roomName room name whose email id is required.
   * @param {Dict} roomsList rooms list with email id and name.
   * @return {String} email id of the room if found else false.
   */  
  roomsCount=roomsList.length;
  for(let i=0;i<roomsCount;i++){
    if(roomsList[i].name.toLowerCase()==roomName.toLowerCase()){
      return roomsList[i].address;
    }
  }
  return false;
}

//======================================= MAILING =======================================

const nodemailer=require('nodemailer');

var getTransporter=async=>{
  let transporter=nodemailer.createTransport({
    host:process.env.MAIL_HOST,
    port:process.env.MAIL_PORT,
    secure:false,
    auth:{
      user:process.env.MAIL_EMAIL_ID,
      pass:process.env.MAIL_EMAIL_PASS,
    },
    tls:{
      cipher:process.env.MAIL_CIPHER
    }
  });
  return transporter;
}

exports.sendBookingConfirmationMailToUser=async(userEmail,bookingData)=>{
  let transporter=await getTransporter();
  var timing=await getTimeInIndianFormat(bookingData.timeSlot);
  let info=await transporter.sendMail({
    from:process.env.MAIL_EMAIL_ID,
    to:userEmail,
    subject:'Your booking has been confirmed.',
    text:`Confirmation for your booking of ${bookingData.roomName} on ${bookingData.date} for ${timing}.`,
    html:`<p>Confirmation for your booking of <b>${bookingData.roomName}</b> on <b>${bookingData.date}</b> for <b>${timing}</b></p>.`
  });
  await console.log('INFO: Mail Sent:',info);
}

exports.sendCancelConfirmationMailToUser=async(userEmail,cancelData)=>{
  /**
   * 
   */
  let transporter=await getTransporter();
  // var timing=await getTimeInIndianFormat(cancelData.timeSlot);
  let info=await transporter.sendMail({
    from:process.env.MAIL_EMAIL_ID,
    to:userEmail,
    subject:`Your booking has been cancelled.`,
    text:`Confirmation for cancellation of booking of ${cancelData.roomName} on ${cancelData.roomName} for ${cancelData.timeSlot}.`,
    html:`<p>Confirmation for cancellation of booking of <b>${cancelData.roomName}</b> on <b>${cancelData.date}</b> for <b>${cancelData.timeSlot}</b></p>.`
  });
  await console.log('INFO: Mail Sent:',info);
  if(info.rejected==""){
    return true;
  }
  return false;
}

//==================================== OUTLOOK ==========================================
var request=require('request');
var runOutlookRequest=async(options)=>{
  /**
   * Runs Outlook Request with options provided and returns response.
   * @param {JSON} options options in JSON format.
   * @return {Object} response object.
   */
  request=util.promisify(request);
  var response;
  try{
    response=await request(options);
  }catch(error){
    console.log(error);
  }
  return response;
}

// ============ Export Functions ============

exports.getDateYearMonthDay=async(dateBook)=>{
  /**
   * Parses the date (dd-mm-yyyy) format and returns day month and year.
   * @param {String} dateBook date in dd-mm-yyyy format.
   * @return {[Integer,Integer,Integer]} year,month,day as integers.
   */
  dateBook=dateBook.split("-");
  var day=parseInt(dateBook[0]);
  var month=parseInt(dateBook[1]);
  var year=parseInt(dateBook[2]);
  if(year<2000){
    year=year+2000;
  }
  return [year,month,day];
}

exports.getTimeHoursMinutes=async(timeInMinutes)=>{
  /**
   * Returns hours and minutes provided time in minutes.
   * @param {Integer} timeInMinutes time in minutes only. 
   * @return {[Integer,Integer]} returns hours,minutes.
   */
  var hours=parseInt(timeInMinutes/60);
  var minutes=parseInt(timeInMinutes%60);
  return [hours,minutes];
}

exports.parseTimeForBuildMessage=async(time)=>{
  /**
   * returns IST from UTC time ISO8601 format taken from outlook
   * @param {String} time UTC time from outlook
   * @return {Object} DateTime object in IST format
   */
  time=time.concat('Z');
  var indiaTime=new Date(time);
  indiaTime=indiaTime.toLocaleTimeString("en-US",{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'});
  return indiaTime;
}

exports.parseDateForBuildMessage=async(date)=>{
  /**
   * returns date calculated from UTC ISO8601 format time taken from outlook
   * @param {String} date UTC Time from outlook as string.
   * @return {String} date in dd-mm-yyyy format in IST.
   */
  date=date.concat('Z');
  var tempDate=new Date(date);
  tempDate=tempDate.toLocaleDateString('en-US',{timeZone:'Asia/Kolkata'});
  tempDate=tempDate.split("/");
  let day=tempDate[1];
  let month=tempDate[0];
  let year=tempDate[2];
  var dateMessage=`${day}-${month}-${year}`;
  return dateMessage;
}

exports.getOutlookAccessToken=async()=>{
    /**
     * Return access token from outlook graph api.
     * @return {String} access token as string.
     */
    var options={
      method:'POST',
      url:`https://login.microsoftonline.com/${process.env.OUTLOOK_GRAPH_TENANT_ID}/oauth2/v2.0/token`,
      headers:{
        Connection:'keep-alive',
        Host:'login.microsoftonline.com',
        'Content-Type':'application/x-www-form-urlencoded'
      },
      form:{
        client_id:process.env.OUTLOOK_GRAPH_CLIENT_ID,  
        client_secret:process.env.OUTLOOK_GRAPH_CLIENT_SECRET,
        scope:process.env.OUTLOOK_GRAPH_SCOPE,
        grant_type:process.env.OUTLOOK_GRAPH_GRANT_TYPE
      }
    };
    var response=await runOutlookRequest(options);
    if(response.statusCode!=200){
      await console.log('ERROR: getOutlookAccessToken : Response :',response.statusCode,': body :',response.body);
    }else{
      await console.log("INFO: getOutlookAccessToken: Access Token Acquired");
    }
    response=JSON.parse(response.body);
    let accessToken=response.access_token;
    return accessToken;
}

exports.getOutlookRoomsList=async()=>{
    /**
     * Return rooms list
     * @return {JSON} list of rooms in json format. : {name:"",address:""}
     */
    var accessToken=await this.getOutlookAccessToken();
    var options={
      method:'GET',
      // url:`https://graph.microsoft.com/beta/places/microsoft.graph.room?$select=capacity,displayName,emailAddress`,
      url:`https://graph.microsoft.com/beta/places/microsoft.graph.room`,
      headers:{
        Authorization:`Bearer ${accessToken}`,
        Connection:'keep-alive',
        Host:'graph.microsoft.com',
      },
    };
    // Request for Capacity of Rooms
    var response=await runOutlookRequest(options);
    if(response.statusCode!=200){
      await console.log('ERROR: getOutlookRoomsList-1 : Response :',response.statusCode,': body:',response.body);
    }else{
      await console.log("INFO: getOutlookRoomsList-1 : SUCCESS");
    }
    response=JSON.parse(response.body).value;
    var rooms={};
    var temp=[];
    for(let i=0;i<response.length;i++){
      rooms[response[i].displayName]=response[i];
      temp.push({
        id:`${i+1}`,
        method:`GET`,
        url:`/users/${response[i].emailAddress}?$select=officeLocation,displayName`
      });
    }
    options={
      method:'POST',
      url:`https://graph.microsoft.com/v1.0/$batch`,
      headers:{
        Authorization:`Bearer ${accessToken}`,
        Connection:'keep-alive',
        Host:'graph.microsoft.com',
      },
      body:{
        requests:temp
        },
        json:true
    };
    // Batch Request for Location of Rooms
    response=await runOutlookRequest(options);
    if(response.statusCode!=200){
      await console.log('ERROR: getOutlookRoomsList-2 : Response :',response.statusCode,': body:',response.body);
    }else{
      await console.log("INFO: getOutlookRoomsList-2 : SUCCESS");
    }
    response=response.body.responses;
    for(let i=0;i<response.length;i++){
      if(rooms[response[i].body.displayName]!==undefined){
        rooms[response[i].body.displayName]['officeLocation']=response[i].body.officeLocation;
      }
    }
    return rooms;
}

exports.getOutlookScheduleBetween=async(roomEmail,timeSlot,dateBook)=>{
    /**
     * Returns list of bookings scheduled for given room in given timeslot.
     * @param {String} roomEmail email id of the room.
     * @param {String} timeSlot time slot in (hhmm-hhmm) format.
     * @param {String} dateBook date (dd-mm-yyyy) on which schedule to check.
     * @return {JSON} json object of bookings found for the provided input.
     */
    var [year,month,day]=await this.getDateYearMonthDay(dateBook);
    var [startTime,endTime]=await getTimeInMinutes(timeSlot);
    var [startHours,startMinutes]=await this.getTimeHoursMinutes(startTime);
    var [endHours,endMinutes]=await this.getTimeHoursMinutes(endTime);
    var startDateTime=new Date(year,month-1,day,startHours,startMinutes,30);
    startDateTime=startDateTime.toISOString();
    var endDateTime=new Date(year,month-1,day,endHours,endMinutes);
    endDateTime=endDateTime.toISOString();
    await console.log('INFO : getOutlookScheduleBetween : startDateTime :',startDateTime);
    await console.log('INFO : getOutlookScheduleBetween : endDateTime :',endDateTime);
    var accessToken=await this.getOutlookAccessToken();
    var options={
      method:'GET',
      url:`${process.env.OUTLOOK_GRAPH_BASE_URI}/users/${roomEmail}/calendar/calendarView`,
      qs:{
        startDateTime:`${startDateTime}`,
        endDateTime:`${endDateTime}`,
        '$select':'organizer,start,end'
      },
      headers:{
        Connection:'keep-alive',
        Host:'graph.microsoft.com',
        Authorization:`Bearer ${accessToken}`
      },
    };
    var response=await runOutlookRequest(options);
    if(response.statusCode!=200){
      await console.log("ERROR: getOutlookScheduleBetween: Response :",response.statusCode,": body :",response.body);
    }else{
      await console.log("INFO: getOutlookScheduleBetween : SUCCESS");
    }
    response=JSON.parse(response.body);
    var bookings=response.value;
    return bookings;
}

exports.postOutlookBooking=async(roomEmail,roomName,userEmail,timeSlot,dateBook,meetingSubject="")=>{
    /**
     * Posts an event on outlook calendar of the room.
     * @param {String} roomEmail email id of the booked room.
     * @param {String} roomName name of the booked room.
     * @param {String} userEmail email id of the user who is booking.
     * @param {String} timeSlot time slot of the booking. (hhmm-hhmm)
     * @param {String} dateBook date of booking.(dd-mm-yyyy)
     * @param {String} meetingSubject (optional) title of meeting provided.
     * @return {Boolean} true if booking made otherwise false.
     */
    
    await console.log('INFO : postOutlookBooking : room email : ',roomEmail);
    // await console.log('INFO : postOutlookBooking : room name : ',roomName);
    await console.log('INFO : postOutlookBooking : user email : ',userEmail);
    await console.log('INFO : postOutlookBooking : time slot : ',timeSlot);
    await console.log('INFO : postOutlookBooking : date booking : ',dateBook);
    
    var [year,month,day]=await this.getDateYearMonthDay(dateBook);

    var [startTime,endTime]=await getTimeInMinutes(timeSlot);
    var [startHours,startMinutes]=await this.getTimeHoursMinutes(startTime);
    var [endHours,endMinutes]=await this.getTimeHoursMinutes(endTime);
    var startDateTime=new Date(year,month-1,day,startHours,startMinutes,10);
    var endDateTime=new Date(year,month-1,day,endHours,endMinutes,10);
    var accessToken=await this.getOutlookAccessToken();
    if(meetingSubject==""){
      await console.log('INFO : postOutlookBooking : No meeting subject mentioned.');
      meetingSubject=userEmail;
      await console.log('INFO : postOutlookBooking : Using default meeting subject :',meetingSubject);
    }
    var options={
      method:'POST',
      url:`${process.env.OUTLOOK_GRAPH_BASE_URI}/users/${userEmail}/events`,
      headers:{
        Connection:'keep-alive',
        Host:'graph.microsoft.com',
        Authorization:`Bearer ${accessToken}` 
      },
      body:{
        subject:meetingSubject,
        body:{ contentType:'HTML',content:meetingSubject},
        start:{dateTime:startDateTime,timeZone:"UTC"},
        end:{dateTime:endDateTime,timeZone:"UTC"},
        attendees:[
          {
            emailAddress:{
              address:roomEmail,
              name:roomName
            },
            type:'Required'
          }
        ]
      },
      json:true
    };
    var response=await runOutlookRequest(options);
    if(response.statusCode!=201){
      await console.log("ERROR: postOutlookBooking : Response: ",response.statusCode," : Response message :",response.statusMessage);
    }else{
      await console.log("INFO: postOutlookBooking : SUCCESS");
      return true;
    }
    return false;
}

exports.buildOutlookScheduleMessage=async(roomName,dateBook,bookingsData)=>{
    /**
     * Builds a message for showing the schedule.
     * @param {String} roomName name of the room.
     * @param {String} dateBook date of schedule to check (dd-mm-yyyy)
     * @param {JSON} bookingsData booking data
     * @return {String} built message to display to user.
     */
    var bookingsCount=bookingsData.length;
    var replyMessage=`Schedule of ${roomName} on ${dateBook}:\n\n`
    replyMessage=replyMessage+"Booking Time\t|\tBooked By\n";
    for(let i=0;i<bookingsCount;i++){
      let startTime=await this.parseTimeForBuildMessage(bookingsData[i].start.dateTime);
      let endTime=await this.parseTimeForBuildMessage(bookingsData[i].end.dateTime);
      let slot=`${startTime} - ${endTime}`;
      let userName=bookingsData[i].organizer.emailAddress.name;
      let userEmail=bookingsData[i].organizer.emailAddress.address;
      replyMessage=replyMessage+`${slot} - ${userName} (${userEmail})\n`;
    }
    return replyMessage;
}

exports.getOutlookMySchedule=async(roomsList,userEmail,dateBook="",timeSlot="",room=false)=>{
  /**
   * Get outlook schedule of a particular user.
   * @param {JSON} roomsList list of rooms available for bookings.
   * @param {String} userEmail email id of the user or room whose schedule to retrieve.
   * @param {String} dateBook (optional) date of which schedule to get. (dd-mm-yyyy)
   * @param {String} timeSlot (optional) time slot in between schedule to get.
   * @param {Boolean} room (false default), true of get schedule of room , false to get schedule of user.
   * @return {JSON} data of schedule
   */
  var accessToken=await this.getOutlookAccessToken();
  var options;
  if(timeSlot!=""){
    await console.log("INFO: getOutlookMySchedule : Time Slot and Date Mentioned");
    var [year,month,day]=await getDateYearMonthDay(dateBook);
    var [startTime,endTime]=await getTimeInMinutes(timeSlot);
    var [startHours,startMinutes]=await getTimeHoursMinutes(startTime);
    var [endHours,endMinutes]=await getTimeHoursMinutes(endTime);
    var startDateTime=new Date(year,month-1,day,startHours,startMinutes);
    startDateTime=startDateTime.toISOString();
    var endDateTime=new Date(year,month-1,day,endHours,endMinutes);
    endDateTime=endDateTime.toISOString();
    options={
      method:'GET',
      url:`${process.env.OUTLOOK_GRAPH_BASE_URI}/users/${userEmail}/calendar/calendarView`,
       qs:{
        startDateTime:startDateTime,
        endDateTime:endDateTime,
        '$select':'start,end,attendees,subject'
      },
      headers:{
        Connection:'keep-alive',
        Host:'graph.microsoft.com',
        Authorization:`Bearer ${accessToken}`,
      }
    };
  }else if(dateBook!=""){
    await console.log("INFO: getOutlookMySchedule : Only Date Mentioned");
    var [year,month,day]=await this.getDateYearMonthDay(dateBook);
    var startDateTime=new Date(year,month-1,day);
    startDateTime=startDateTime.toISOString();
    var endDateTime=new Date(year,month-1,day,24,0);
    endDateTime=endDateTime.toISOString();
    if(room){
      options={
        method:'GET',
        url:`${process.env.OUTLOOK_GRAPH_BASE_URI}/users/${userEmail}/calendar/calendarView`,
        qs:{
          startDateTime:startDateTime,
          endDateTime:endDateTime,
          '$select':'start,end,attendees,subject,organizer'
        },
        headers:{
          Connection:'keep-alive',
          Host:'graph.microsoft.com',
            Authorization:`Bearer ${accessToken}`,
        }
      };
    }else{
      options={
        method:'GET',
        url:`${process.env.OUTLOOK_GRAPH_BASE_URI}/users/${userEmail}/calendar/calendarView`,
        qs:{
          startDateTime:startDateTime,
          endDateTime:endDateTime,
          '$select':'start,end,attendees,subject'
        },
        headers:{
          Connection:'keep-alive',
          Host:'graph.microsoft.com',
          Authorization:`Bearer ${accessToken}`,
        }
      };
    }
  }
  var response=await runOutlookRequest(options);
  if(response.statusCode!=200){
    await console.log("ERROR: getOutlookMySchedule : Response :",response.statusCode," : body : ",response.body);
    return false;
  }
  await console.log("INFO: getOutlookMySchedule : SUCCESS");
  response=JSON.parse(response.body);
  var bookings=response.value;
  return bookings;
}

exports.deleteOutlookBooking=async(userEmail,bookingId)=>{
  /**
   * Cancel made booking from outlook.
   * @param {String} userEmail email id of the user whose booking to cancel.
   * @param {String} bookingId id assigned by outlook for the booking.
   * @return {Boolean} True or False based on success.
   */
  var accessToken=await this.getOutlookAccessToken();
  var options={
    method:'DELETE',
    url:`${process.env.OUTLOOK_GRAPH_BASE_URI}/users/${userEmail}/events/${bookingId}`,
    headers:{
      Connection:'keep-alive',
      Host:'graph.microsoft.com',
      Authorization:`Bearer ${accessToken}`
    }
  };
  var response=await runOutlookRequest(options);
  if(response.statusCode!=204){
    await console.log('ERROR: deleteOutlookBooking : Response :',response.statusCode,': body :',response.body);
    return false;
  }
  await console.log('INFO : deleteOutlookBooking : SUCCESS');
  return true;
}

var checkBookingForRoom=async(attendees,roomsList)=>{
  /**
  * Check whether the attendees contain rooms
  * @param {JSON} attendees attendees list
  * @param {JSON} roomsList list of rooms.
  * @return {[Boolean,String/Boolean]} returns [true,name] if room found else [false,false]
  */

 for(let i=0;i<attendees.length;i++){
    for(let key in roomsList){
      if(attendees[i].emailAddress.address==roomsList[key].emailAddress){
        return [true,roomsList[key].displayName];
      }
    };
 }
 return [false,false];
}

exports.getScheduleAdaptiveCard=async(scheduleDetails,roomsList,date)=>{
  /**
   * 
   */
  var atleastOneEntry;
  atleastOneEntry=false;
  date=date.split('-');
  date=new Date(date[2],date[1]-1,date[0]);
  date=date.toLocaleString('en-US',{weekday:'short',year:'numeric',month:'long',day:'numeric'});
  let adaptiveCard={
      "text":"Sorry but this is not yet supported in mobile devices. Try using the desktop application or web-browser.",
      "attachments":[
          {
              "contentType":"application/vnd.microsoft.card.adaptive",
              "content":{
                  "type": "AdaptiveCard",
                  "body": [
                      {
                          "type": "Container",
                          "items": [
                              {
                                  "type": "TextBlock",
                                  "text": `Your Schedule for ${date}`,
                                  "weight": "Bolder"
                              }
                          ]
                      }
                  ],
                  "version":"1.0"
              }
          }
      ]
  };
  for(let i=0;i<scheduleDetails.length;i++){
      let [check,roomName]=await checkBookingForRoom(scheduleDetails[i].attendees,roomsList);
      if(check){
          atleastOneEntry=true;
          let startTime=scheduleDetails[i].start.dateTime;
          startTime=await this.parseTimeForBuildMessage(startTime);
          let endTime=scheduleDetails[i].end.dateTime;
          endTime=await this.parseTimeForBuildMessage(endTime);
          let slot=`${startTime}-${endTime}`;

          adaptiveCard.attachments[0].content.body.push({
              "type":"Container", 
              "items":[{
                  "type":"Container",
                  "items":[{
                      "type":"RichTextBlock",
                      "inlines":[
                          {
                              "type":"TextRun",
                              "text":slot
                          }
                      ],
                      "separator":true
                  },
                  {
                      "type":"ColumnSet",
                      "columns":[
                          {
                              "type":"Column",
                              "width":"stretch",
                              "separator":true,
                              "items":[{"type":"TextBlock","text":roomName,"id":`${i}_roomName`}]
                          },
                          {
                              "type":"Column",
                              "width":"stretch",
                              "items":[{"type":"TextBlock","text":scheduleDetails[i].subject,"id":`${i}_meetingTitle`}]
                          },
                          {
                              "type":"Column",
                              "width":"stretch",
                              "items":[
                                  {
                                      "type":"ActionSet",
                                      "actions":[
                                          {
                                              "type":"Action.Submit",
                                              "title":"Cancel",
                                              "style":"destructive",
                                              "id":`${i}_cancel`
                                          }
                                          ]
                                          },{"type":"Input.Text","id":"id","isVisible":false,"value":`${i}`}
                                      ]
                                  }
                              ]
                          }
                      ]
                  }
              ],
              "separator":true
          });
      }
  }
  adaptiveCard.attachments[0].content.body.push({
    "type":"Input.Text",
    "id":"card_type",
    "isVisible":false,
    "value":"scheduleCard"
  });
  if(!atleastOneEntry){
      return false;
  }
  return adaptiveCard;
}

exports.getScheduleClashAdaptiveCard=async(scheduleDetails,roomsList)=>{
  /**
   * 
   */
  let adaptiveCard={
    "text":"Sorry but this is not yet supported in mobile devices. Try using the desktop application or web-browser.",
      "attachments":[
          {
              "contentType":"application/vnd.microsoft.card.adaptive",
              "content":{
                  "type": "AdaptiveCard",
                  "body": [
                      {
                          "type": "Container",
                          "items": [
                              {
                                  "type": "TextBlock",
                                  "text": "",
                                  "weight": "Bolder"
                              }
                          ]
                      }
                  ],
                  "version":"1.0"
              }
          }
      ]
    };
    for(let i=0;i<scheduleDetails.length;i++){
      let startTime=scheduleDetails[i].start.dateTime;
      startTime=await this.parseTimeForBuildMessage(startTime);
      let endTime=scheduleDetails[i].end.dateTime;
      endTime=await this.parseTimeForBuildMessage(endTime);
      let slot=`${startTime}-${endTime}`;
      adaptiveCard.attachments[0].content.body.push({
        "type":"Container", 
              "items":[{
                  "type":"Container",
                  "items":[{
                      "type":"RichTextBlock",
                      "inlines":[
                          {
                              "type":"TextRun",
                              "text":slot
                          }
                      ],
                      "separator":true
                  },
                  {
                    "type":"ColumnSet",
                      "columns":[
                          {
                              "type":"Column",
                              "width":"stretch",
                              "separator":true,
                              "items":[{"type":"TextBlock","text":scheduleDetails[i].organizer.emailAddress.name,"id":`${i}_name`}]
                          },
                          {
                              "type":"Column",
                              "width":"stretch",
                              "items":[{"type":"TextBlock","text":scheduleDetails[i].organizer.emailAddress.address,"id":`${i}_emailId`}]
                          },                  
                      ]
                  }
              ]
              }],
              "separator":true
      });
    }
    return adaptiveCard;
}

exports.getRoomNameUsingEmailId=async(roomEmail,roomsList)=>{
  /**
   * 
   */
  for(let i=0;i<roomsList.length;i++){
    if(roomsList[i].address==roomEmail){
      return roomsList[i].name;
    }
  }
}

exports.getFoodOrdersAdaptiveCard=async()=>{
  /**
   * 
   */
  let adaptiveCard={
    "text":"Sorry but this is not yet supported in mobile devices. Try using the desktop application or web-browser.",
      "attachments":[
          {
              "contentType":"application/vnd.microsoft.card.adaptive",
              "content":{
                "type": "AdaptiveCard",
                "body": [
                    {
                        "type": "TextBlock",
                        "text": "Add food orders here:",
                        "size": "Medium",
                        "weight": "Bolder"
                    },
                    {
                        "type": "Container",
                        "items": [
                            {
                                "type": "ImageSet",
                                "images": [
                                    {
                                        "type": "Image",
                                        "size": "Medium",
                                        "altText": "",
                                        "url": "https://static.vecteezy.com/system/resources/previews/000/599/173/non_2x/coffee-icon-vector.jpg"
                                    },
                                    {
                                        "type": "Image",
                                        "size": "Medium",
                                        "altText": "",
                                        "url": "https://cdn1.iconfinder.com/data/icons/food-drinks-eco-vol-2/512/Tea-512.png"
                                    },
                                    {
                                        "type": "Image",
                                        "size": "Medium",
                                        "altText": "",
                                        "url": "data:image/png;base64,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"
                                    },
                                    {
                                        "type": "Image",
                                        "size": "Medium",
                                        "altText": "",
                                        "url": "https://cdn2.iconfinder.com/data/icons/sports-and-games-3-3/48/119-512.png"
                                    }
                                ]
                            },
                            {
                                "type": "ActionSet",
                                "actions": [
                                    {
                                        "type": "Action.ShowCard",
                                        "title": "Coffee",
                                        "card": {
                                            "type": "AdaptiveCard",
                                            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                                            "body": [
                                                {
                                                    "type": "ColumnSet",
                                                    "columns": [
                                                        {
                                                            "type": "Column",
                                                            "width": "stretch",
                                                            "items": [
                                                                {
                                                                    "type": "Input.Toggle",
                                                                    "title": "Black Coffee",
                                                                    "value": "false",
                                                                    "wrap": false,
                                                                    "id": "coffee_black"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "type": "Column",
                                                            "width": "stretch",
                                                            "items": [
                                                                {
                                                                    "type": "Input.Number",
                                                                    "placeholder": "Enter count.",
                                                                    "id": "coffee_black_count"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "ColumnSet",
                                                    "columns": [
                                                        {
                                                            "type": "Column",
                                                            "width": "stretch",
                                                            "items": [
                                                                {
                                                                    "type": "Input.Toggle",
                                                                    "title": "Milk Coffee",
                                                                    "value": "false",
                                                                    "wrap": false,
                                                                    "id": "coffee_milk"
                                                                }
                                                            ],
                                                            "id": ""
                                                        },
                                                        {
                                                            "type": "Column",
                                                            "width": "stretch",
                                                            "items": [
                                                                {
                                                                    "type": "Input.Number",
                                                                    "placeholder": "Enter count.",
                                                                    "id": "coffee_milk_count"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "Input.Text",
                                                    "placeholder": "Any additional instructions.",
                                                    "id": "coffee_details"
                                                },
                                                {
                                                    "type": "ActionSet",
                                                    "actions": [
                                                        {
                                                            "type": "Action.Submit",
                                                            "title": "OK",
                                                            "id": ""
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        "id": "show_coffee"
                                    }
                                ]
                            },
                            {
                                "type": "ActionSet",
                                "actions": [
                                    {
                                        "type": "Action.ShowCard",
                                        "title": "Tea",
                                        "card": {
                                            "type": "AdaptiveCard",
                                            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                                            "body": [
                                                {
                                                    "type": "ColumnSet",
                                                    "columns": [
                                                        {
                                                            "type": "Column",
                                                            "width": "stretch",
                                                            "items": [
                                                                {
                                                                    "type": "Input.Toggle",
                                                                    "title": "Milk Tea",
                                                                    "value": "false",
                                                                    "wrap": false,
                                                                    "id": "tea_milk"
                                                                }
                                                            ],
                                                            "id": ""
                                                        },
                                                        {
                                                            "type": "Column",
                                                            "width": "stretch",
                                                            "items": [
                                                                {
                                                                    "type": "Input.Number",
                                                                    "placeholder": "Enter count.",
                                                                    "id": "tea_milk_count"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "ColumnSet",
                                                    "columns": [
                                                        {
                                                            "type": "Column",
                                                            "width": "stretch",
                                                            "items": [
                                                                {
                                                                    "type": "Input.Toggle",
                                                                    "title": "Green Tea",
                                                                    "value": "false",
                                                                    "wrap": false,
                                                                    "id": "tea_green"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "type": "Column",
                                                            "width": "stretch",
                                                            "id": "",
                                                            "items": [
                                                                {
                                                                    "type": "Input.Number",
                                                                    "placeholder": "Enter count.",
                                                                    "id": "tea_green_count"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "Input.Text",
                                                    "placeholder": "Any additional instructions.",
                                                    "id": "tea_details"
                                                },
                                                {
                                                    "type": "ActionSet",
                                                    "actions": [
                                                        {
                                                            "type": "Action.Submit",
                                                            "title": "OK"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        "id": "show_tea"
                                    }
                                ]
                            },
                            {
                                "type": "ActionSet",
                                "actions": [
                                    {
                                        "type": "Action.ShowCard",
                                        "title": "Lunch",
                                        "card": {
                                            "type": "AdaptiveCard",
                                            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                                            "body": [
                                                {
                                                    "type": "Input.Number",
                                                    "placeholder": "Enter count.",
                                                    "id": "lunch_count"
                                                },
                                                {
                                                    "type": "Input.Text",
                                                    "placeholder": "Any additional instructions.",
                                                    "id": "lunch_details"
                                                },
                                                {
                                                    "type": "ActionSet",
                                                    "actions": [
                                                        {
                                                            "type": "Action.Submit",
                                                            "title": "OK"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        "id": "show_lunch"
                                    }
                                ]
                            },
                            {
                                "type": "ActionSet",
                                "actions": [
                                    {
                                        "type": "Action.ShowCard",
                                        "title": "Water",
                                        "card": {
                                            "type": "AdaptiveCard",
                                            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                                            "body": [
                                                {
                                                    "type": "Input.Number",
                                                    "placeholder": "Enter count.",
                                                    "id": "water_count"
                                                },
                                                {
                                                    "type": "Input.Text",
                                                    "placeholder": "Any additional instructions.",
                                                    "id": "water_details"
                                                },
                                                {
                                                    "type": "ActionSet",
                                                    "actions": [
                                                        {
                                                            "type": "Action.Submit",
                                                            "title": "OK"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        "id": "show_water"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "version": "1.0"
            }
          }
      ]
  };
  adaptiveCard.attachments[0].content.body.push({
    "type":"Input.Text",
    "id":"card_type",
    "isVisible":false,
    "value":"foodOrders"
  });
  return adaptiveCard;
}
