import fs from 'fs';
import chalk from 'chalk';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer-extra';
import { title, notify, CORES } from './utils.js';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

let contas = [];
let notificacoes = [];
let lastUpdate = null;
let timeUntilFull = null;
let totalGotas = null;
let totalMaxGotas = null;

const autoBuyType = 'charges'; // TODO: implementar outros tipos
const autoBuyMoreCharges = true;

dotenv.config();

title();

if (!fs.existsSync('pixels.txt')) {
    fs.writeFileSync('pixels.txt', '0', 'utf8');
}

puppeteer.use(StealthPlugin());
puppeteer.launch({ headless: 'new' }).then(async browser => {
    if (!fs.existsSync('cookies.json')) {
        return console.log(chalk.red('  Erro: Cookies não encontrados'));
    }
    
    const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
    if (cookies.length === 0) {
        console.log(chalk.red('  Erro: Não há cookies para logar'));
        await browser.close();
        return;
    }
    
    await verificarCookies(browser, cookies);
});

async function verificarCookies(browser, cookies) {
    title();
    console.log(chalk.blue(`  Iniciando verificação de ${cookies.length} contas...\n`));

    totalGotas = 0;
    totalMaxGotas = 0;

    let largestTimeToComplete = 0;

    for (const cookie of cookies) {
        await browser.setCookie({ name: 's', value: cookie, domain: 'backend.wplace.live' });
        const page = await browser.newPage();

        await page.goto('https://backend.wplace.live/me');
        await page.waitForSelector('body');

        if (await page.evaluate(() => document.querySelector('body').innerText.includes('{"error":"Unauthorized","status":401}'))) {
            console.log(chalk.red('  Erro: Unauthorized (401)'));
            await browser.close();
            return;
        }

        const userData = JSON.parse(await page.evaluate(() => document.querySelector('body').innerText));
        contas[cookie] = userData;

        const gotas = Math.floor(userData.charges.count);
        const maxGotas = Math.floor(userData.charges.max);
        const intervalo = maxGotas - gotas;
        const jaNotificado = notificacoes.includes(cookie);
        const cheio = gotas >= maxGotas;

        if (cheio) {
            await page.evaluate(async (cookieHeader) => {
                await fetch("https://backend.wplace.live/s0/pixel/730/1194", {
                method: "POST",
                headers: {
                    "accept": "*/*",
                    "content-type": "text/plain;charset=UTF-8",
                    "cookie": cookieHeader,
                    "Referer": "https://wplace.live/"
                },
                body: JSON.stringify({ colors: [ 1 ], coords: [460, 706] })
                });
            }, `s=${cookie}`);

            notify(`💥 Conta ${userData.name} #${userData.id} pintou 1 pixel para evitar desperdício!`);

            let pixelsPintados = fs.readFileSync('pixels.txt', 'utf8').split('\n').filter(line => line.trim() !== '');
            fs.writeFileSync('pixels.txt', `${parseInt(pixelsPintados) + 1}\n`, 'utf8');
        }

        totalGotas += gotas;
        totalMaxGotas += maxGotas;

        if (intervalo >= largestTimeToComplete) {
            largestTimeToComplete = intervalo;
            timeUntilFull = intervalo * 30;
        }

        if (cheio && !jaNotificado) {
            notificacoes.push(cookie);
            notify(`💥 Conta ${userData.name} #${userData.id} está cheia! *Gotas:* *${gotas}/${maxGotas}*`);
        }

        if (!cheio && jaNotificado) {
            notificacoes = notificacoes.filter(c => c !== cookie);
        }

        if (userData.droplets >= 500 && autoBuyMoreCharges) {
            const amount = Math.floor(userData.droplets / 500);
            const cookieHeader = `s=${cookie}`;
            
            await page.evaluate(async (amount, cookieHeader) => {
                await fetch("https://backend.wplace.live/purchase", {
                    method: "POST",
                    headers: {
                        "accept": "*/*",
                        "content-type": "text/plain;charset=UTF-8",
                        "cookie": cookieHeader,
                        "Referer": "https://wplace.live/"
                    },
                    body: JSON.stringify({
                        product: {
                            id: 70,
                            amount: amount
                        }
                    })
                });
            }, amount, cookieHeader);
        }

        console.log(
            chalk.white.bold(`  ${userData.name} #${userData.id}`) + 
            chalk.blue(` (${gotas}/${maxGotas})`) +
            chalk.cyan(` - ${userData.droplets} Droplets`) +
            chalk.yellow(` - ${Math.floor(userData.level)} Nível`) +
            chalk.magenta(` - ${userData.pixelsPainted} Pixels`) +
            chalk.green(` ${cheio ? '[CHEIO]' : ''}`) +
            chalk.red(` ${userData.droplets >= 500 && autoBuyMoreCharges ? '[AUTOBUY]' : ''}`)
        );

        await page.close();
    }

    console.log(
        chalk.white(`\n  Total de Gotas: `) +
        chalk.blue(`${totalGotas}/${totalMaxGotas}`) +
        chalk.green(` (${Math.floor((totalGotas / totalMaxGotas) * 100)}%)`)
    );

    console.log(
        chalk.white("  Tempo estimado: ") +
        chalk.yellow(timeUntilFull
            ? `${Math.floor(timeUntilFull / 3600)}h e ${Math.floor((timeUntilFull % 3600) / 60)} minutos`
            : ''
        )
    );

    let pixelsPintados = fs.readFileSync('pixels.txt', 'utf8').split('\n').filter(line => line.trim() !== '');
    console.log(
        chalk.white("  Pixels pintados: ") +
        chalk.cyan(parseInt(pixelsPintados)) + '\n'
    );

    setTimeout(() => verificarCookies(browser, cookies), 30000);
    process.stdout.write(chalk.white(`  Verificando novamente em `) + chalk.yellow(`30 segundos`) + chalk.white(`...   `));
    for (let i = 29; i > 0; i--) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        process.stdout.write(
            `\r` + chalk.white(`  Verificando novamente em `) +
            chalk.yellow(`${i} segundos`) +
            chalk.white(`...   `)
        );
    }
    process.stdout.write('\r' + ' '.repeat(50) + '\r');

    lastUpdate = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    process.title = `Gotas Bot - ${cookies.length} contas | Gotas: ${totalGotas}/${totalMaxGotas} | Última atualização: ${lastUpdate} | by zpaulin`;
}
