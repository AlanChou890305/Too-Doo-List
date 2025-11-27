const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables from .env file
require('dotenv').config();

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    acc[key] = value || true;
    return acc;
}, {});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
}

async function sendEmail() {
    try {
        // 1. Validate Arguments
        if (!args.template) {
            console.error('❌ Error: Please specify a template using --template=filename (without .html)');
            console.log('Usage: node scripts/send-email.js --template=update-v1.1.1 --subject="Your Subject" [--type=product_updates|marketing] [--test=email@example.com]');
            console.log('');
            console.log('Email Types:');
            console.log('  --type=product_updates  (default) Feature updates, tips, announcements');
            console.log('  --type=marketing        Promotions and special offers');
            console.log('  --type=welcome          Welcome emails (always sent)');
            process.exit(1);
        }
        
        if (!args.subject) {
            console.error('❌ Error: Please specify a subject using --subject="Your Subject"');
            process.exit(1);
        }

        // 2. Read Template
        const templatePath = path.join(__dirname, '../email-templates', `${args.template}.html`);
        if (!fs.existsSync(templatePath)) {
            console.error(`❌ Error: Template file not found at ${templatePath}`);
            process.exit(1);
        }

        console.log(`📖 Reading template: ${args.template}.html`);
        const htmlContent = fs.readFileSync(templatePath, 'utf8');

        // 3. Prepare Request Payload
        const payload = {
            subject: args.subject,
            html: htmlContent,
            emailType: args.type || 'product_updates' // Default to product_updates
        };

        if (args.test) {
            // If --test is just a flag (true), ask for email or error? 
            // Let's assume if it's a string it's the email, if true maybe we default to something or error.
            if (typeof args.test === 'string') {
                payload.testEmail = args.test;
                console.log(`🧪 Test Mode: Sending only to ${args.test}`);
            } else {
                console.error('❌ Error: When using --test, please provide an email address. e.g. --test=me@example.com');
                process.exit(1);
            }
        } else {
            console.log(`🚀 Production Mode: Sending to ALL users (type: ${payload.emailType})`);
            // Add a small safety delay/confirmation could be good here, but for now we proceed.
        }

        // 4. Send Request to Edge Function
        const functionUrl = `${SUPABASE_URL}/functions/v1/send-update-email`;
        console.log(`📡 Connecting to: ${functionUrl}`);

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        };

        const req = https.request(functionUrl, requestOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Success!');
                    try {
                        const jsonResponse = JSON.parse(data);
                        console.log('Response:', JSON.stringify(jsonResponse, null, 2));
                    } catch (e) {
                        console.log('Response:', data);
                    }
                } else {
                    console.error(`❌ Request failed with status: ${res.statusCode}`);
                    console.error('Response:', data);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request Error:', error);
        });

        req.write(JSON.stringify(payload));
        req.end();

    } catch (error) {
        console.error('❌ Unexpected Error:', error);
    }
}

sendEmail();
