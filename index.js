import fs from 'fs';
import chalk from 'chalk';
import figlet from 'figlet';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

let contas = [];
let notificacoes = [];
let lastUpdate = null;
let timeUntilFull = null;

dotenv.config();

// Show title
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
        if (intervalo >= largestTimeToComplete) {
            largestTimeToComplete = intervalo;
            timeUntilFull = intervalo * 30; // 30 segundos por gota
        }

        if (cheio && !jaNotificado) {
            notificacoes.push(cookie);
            notify(`💥 Conta ${userData.name} #${userData.id} está cheia! **Gotas:** *${gotas}/${maxGotas}*. ||<@${process.env.OWNER_ID}>||`);
        }

        if (!cheio && jaNotificado) {
            notificacoes = notificacoes.filter(c => c !== cookie);
        }

        console.log(
            chalk.white.bold(`  ${userData.name} #${userData.id}`) + 
            chalk.blue(` (${gotas}/${maxGotas})`) +
            chalk.green(` ${cheio ? '[CHEIO]' : ''}`)
        );

        await page.close();
    }

    console.log(
        chalk.white("\n  Tempo estimado pra carregar todas as contas: ") +
        chalk.yellow(timeUntilFull
            ? `${Math.floor(timeUntilFull / 3600)}h e ${Math.floor((timeUntilFull % 3600) / 60)} minutos`
            : 'Indisponível'
        )
    );

    lastUpdate = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    process.title = `Gotas Bot - ${cookies.length} contas | Última atualização: ${lastUpdate}`;

    setTimeout(() => verificarCookies(browser, cookies), 30000);
}

// Mostrar título
function title() {
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
function notify(message) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const payload = JSON.stringify({ content: message });

    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
    });
}