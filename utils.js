import figlet from 'figlet';
import chalk from 'chalk';
import fetch from 'node-fetch';

// Mostrar título
export function title() {
    console.clear();
    console.log(chalk.green(figlet.textSync('Gotas Bot', {
        font: 'Standard',
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

// Cores
export const CORES = {
  "Transparent": 0,
  "Black": 1,
  "Dark Gray": 2,
  "Gray": 3,
  "Light Gray": 4,
  "White": 5,
  "Deep Red": 6,
  "Red": 7,
  "Orange": 8,
  "Gold": 9,
  "Yellow": 10,
  "Light Yellow": 11,
  "Dark Green": 12,
  "Green": 13,
  "Light Green": 14,
  "Dark Teal": 15,
  "Teal": 16,
  "Light Teal": 17,
  "Dark Blue": 18,
  "Blue": 19,
  "Cyan": 20,
  "Indigo": 21,
  "Light Indigo": 22,
  "Dark Purple": 23,
  "Purple": 24,
  "Light Purple": 25,
  "Dark Pink": 26,
  "Pink": 27,
  "Light Pink": 28,
  "Dark Brown": 29,
  "Brown": 30,
  "Beige": 31
};
