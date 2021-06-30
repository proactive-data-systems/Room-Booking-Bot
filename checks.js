/**
 * Handles all .env checks.
 */

exports.performEnvChecks=process=>{
    if (!process.env.ACCESS_TOKEN) {
        console.log("Could not start as this bot requires a Webex Teams API access token.");
        console.log("Please invoke with an ACCESS_TOKEN environment variable");
        console.log("Example: ");
        console.log("> ACCESS_TOKEN=XXXXXXXXXXXX PUBLIC_URL=YYYYYYYYYYYYY node bot.js");
        console.log("OR");
        console.log("Add it in .env file.");
        process.exit(1);
    }
    if (!process.env.PUBLIC_URL) {
        console.log("Could not start as this bot must expose a public endpoint.");
        console.log("Please add env variable PUBLIC_URL on the command line");
        console.log("Example: ");
        console.log("> ACCESS_TOKEN=XXXXXXXXXXXX PUBLIC_URL=YYYYYYYYYYYYY node bot.js");
        console.log("OR");
        console.log("Add it in .env file.");
        process.exit(1);
    }
    if (!process.env.LIMIT_TO_DOMAIN) {
        console.log("Warning bot should have a limit to domain. Bot may behave unexpectedly.");
        console.log("Please add env variable LIMIT_TO_DOMAIN on the command line or .env file");
        console.log("For example check .env file.");
    }
    if (!process.env.MAIL_EMAIL_ID || !process.env.MAIL_EMAIL_PASS) {
        console.log("Could not start as this bot must have outlook email credentials.");
        console.log("Please add env variables MAIL_EMAIL_ID and MAIL_EMAIL_PASS in .env file");
        process.exit(1);
    }
    if (!process.env.MAIL_PORT || !process.env.MAIL_HOST || !process.env.MAIL_CIPHER) {
        console.log("Could not start this bot, missing email variables.");
        console.log("Please add env variables MAIL_PORT, MAIL_HOST and MAIL_CIPHER in .env file");
        process.exit(1);
    }
    if (!process.env.OUTLOOK_BOT_EMAIL || 
        !process.env.OUTLOOK_GRAPH_BASE_URI ||
        !process.env.OUTLOOK_GRAPH_TENANT_ID ||
        !process.env.OUTLOOK_GRAPH_CLIENT_ID ||
        !process.env.OUTLOOK_GRAPH_CLIENT_SECRET ||
        !process.env.OUTLOOK_GRAPH_SCOPE ||
        !process.env.OUTLOOK_GRAPH_GRANT_TYPE
        ) 
    {
        console.log("Could not start this bot, mssing outlook api credentials.");
        console.log("Please add all these variables in .env file: ");
        console.log("> OUTLOOK_BOT_EMAIL");
        console.log("> OUTLOOK_GRAPH_BASE_URI");
        console.log("> OUTLOOK_GRAPH_TENANT_ID");
        console.log("> OUTLOOK_GRAPH_CLIENT_ID");
        console.log("> OUTLOOK_GRAPH_CLIENT_SECRET");
        console.log("> OUTLOOK_GRAPH_SCOPE");
        console.log("> OUTLOOK_GRAPH_GRANT_TYPE");
        process.exit(1);
    }
};