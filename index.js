import fs from 'fs';
import chalk from 'chalk';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer-extra';
import { title, notify } from './utils.js';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

let contas = [];
let notificacoes = [];
let lastUpdate = null;
let timeUntilFull = null;
let totalGotas = null;
let totalMaxGotas = null;

const autoBuyMoreCharges = true;

dotenv.config();

title();

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

// Verificar contas
async function verificarCookies(browser, cookies) {
    title();
    console.log(chalk.blue(`  Iniciando verificação de ${cookies.length} contas...\n`));

    totalGotas = 0;
    totalMaxGotas = 0;

    let largestTimeToComplete = 0;
    for(const cookie of cookies) {
        // Login
        await browser.setCookie({ name: 's', value: cookie, domain: 'backend.wplace.live' });

        const page = await browser.newPage();
        
        // Fetch user data
        await page.goto('https://backend.wplace.live/me');
        await page.waitForSelector('body');
        if (await page.evaluate(() => document.querySelector('body').innerText.includes('{"error":"Unauthorized","status":401}'))) {
            console.log(chalk.red('  Erro: Unauthorized (401)'));
            await browser.close();
            return;
        }

        const userData = JSON.parse(
            await page.evaluate(() => document.querySelector('body').innerText)
        );
        contas[cookie] = userData;

        const jaNotificado = notificacoes.includes(cookie);
        const gotas = Math.floor(userData.charges.count);
        const maxGotas = Math.floor(userData.charges.max);
        const cheio = gotas >= maxGotas;
        const intervalo = maxGotas - gotas;

        totalGotas += gotas;
        totalMaxGotas += maxGotas;

        if (intervalo >= largestTimeToComplete) {
            largestTimeToComplete = intervalo;
            timeUntilFull = intervalo * 30;
        }

        if (cheio && !jaNotificado) {
            notificacoes.push(cookie);
            notify(`💥 Conta ${userData.name} #${userData.id} está cheia! **Gotas:** *${gotas}/${maxGotas}*. ||<@${process.env.OWNER_ID}>||`);
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

            console.log(chalk.green(`  Comprou automático na conta ${userData.name} x${amount}`));
        }

        console.log(
            chalk.white.bold(`  ${userData.name} #${userData.id}`) + 
            chalk.blue(` (${gotas}/${maxGotas})`) +
            chalk.cyan(` - ${userData.droplets} Droplets`) +
            chalk.yellow(` - ${Math.floor(userData.level)} Nível`) +
            chalk.green(` ${cheio ? '[CHEIO]' : ''}`) +
            chalk.red(` ${userData.droplets >= 500 ? '[DROPLETS]' : ''}`)
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

    lastUpdate = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    process.title = `Gotas Bot - ${cookies.length} contas | Gotas: ${totalGotas}/${totalMaxGotas} | Última atualização: ${lastUpdate} | by zpaulin`;

    setTimeout(() => verificarCookies(browser, cookies), 30000);
}