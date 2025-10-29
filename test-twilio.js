// Test Twilio Configuration
require('dotenv').config();
const twilio = require('twilio');

async function testTwilio() {
    console.log('=== Testing Twilio Configuration ===\n');

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    console.log('Account SID:', accountSid);
    console.log('Auth Token:', authToken ? authToken.substring(0, 10) + '...' : 'NOT SET');
    console.log('Phone Number:', phoneNumber);
    console.log();

    if (!accountSid || !authToken || authToken === 'your_auth_token_here_not_recovery_code') {
        console.error('❌ ERROR: Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env file');
        console.log('\nTo get your credentials:');
        console.log('1. Go to https://console.twilio.com/');
        console.log('2. Find your Auth Token on the dashboard');
        console.log('3. Update .env file with the real values');
        return;
    }

    if (!phoneNumber || phoneNumber === '+1234567890') {
        console.error('❌ ERROR: Please set TWILIO_PHONE_NUMBER in .env file');
        console.log('\nTo get your phone number:');
        console.log('1. Go to https://console.twilio.com/');
        console.log('2. Click Phone Numbers → Manage → Active numbers');
        console.log('3. Copy your phone number (format: +1234567890)');
        return;
    }

    try {
        const client = twilio(accountSid, authToken);

        console.log('Testing connection to Twilio...');
        const account = await client.api.accounts(accountSid).fetch();

        console.log('\n✅ SUCCESS! Twilio is configured correctly!');
        console.log('Account Status:', account.status);
        console.log('Account Name:', account.friendlyName);
        console.log('\nYou can now send SMS messages!');

    } catch (error) {
        console.error('\n❌ ERROR connecting to Twilio:');
        console.error(error.message);
        console.log('\nPlease check:');
        console.log('1. Your Auth Token is correct (not the recovery code)');
        console.log('2. Your Account SID is correct');
        console.log('3. Your Twilio account is active');
    }
}

testTwilio();
