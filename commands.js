/**
 * 
 * To store all the commands implemented in one place
 * Separate file to ease the process of adding more commands
 * ============================================================================================
 * Dictionary of Commands {"key":"value"}
 * key: command name
 * value: general description of command
 * 
 * ====================================== DOC =================================================
 * This module handles the commands description that are supported by the bot and provides a 
 * general description what the command does. The description is used by "help" command.
 * This also provides an easy-to-look at preview of the commands supported without delving into
 * the code too much.
 */


var commands={};
commands={
    // Add new command here with key:value as described above.
    "book": "To book a room. Use: type 'book'. ",
    //"check or avail or show":"To check the schedule for a room. Use: type 'check'.",
    // "add":"To add a new room. Use: type 'add' and follow onscreen instructions. ",
    //"list":"Lists all the rooms. Use: type 'list'.",
    "my bookings":"Lists all your bookings for the date along with an option to cancel. Use: type 'my bookings date'."    
};   
    
exports.commands=commands;
