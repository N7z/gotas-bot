import figlet from 'figlet';
import chalk from 'chalk';
import fetch from 'node-fetch';

// Mostrar título
export function title() {
    console.clear();
    console.log(chalk.green(figlet.textSync('Gotas Bot', {
        font: 'Small',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true
    })));
}

// Discord webhook
export function notify(message) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const payload = JSON.stringify({ content: message });

    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
    });
}