const { deploySlashCommands } = require('./slashDeployer');
const { startBot } = require('./main');
const figlet = require('figlet-promised');
const colors = require('colors/safe');
const package = require('./package.json');

async function displayBanner() {
    const figletResult = await figlet('RedFox');
    process.stdout.write(colors.bold(colors.red(figletResult) + '\n'));

    const versionInfo = `Version: ${package.version} | By: ${package.author}`;
    const maxFigletWidth = Math.max(...figletResult.split("\n").map(line => line.length));
    const padding = ' '.repeat((maxFigletWidth - versionInfo.length) / 2);
    process.stdout.write(colors.red(`${padding}${colors.bold(versionInfo)}\n`));

}

async function promptForDeployment() {
    console.log(colors.cyan('Do you want to deploy slash commands before starting the bot? (y/N)'));
    
    return new Promise(resolve => {
        const timeout = setTimeout(() => {
            console.log(colors.yellow('\nNo response received. Proceeding to start the bot without deploying commands...'));
            process.stdin.pause();
            resolve(false);
        }, 15000);

        process.stdin.once('data', data => {
            clearTimeout(timeout);
            const input = data.toString().trim().toLowerCase();
            process.stdin.pause();
            resolve(input === 'y');
        });

        process.stdin.resume();
    });
}

(async () => {
    await displayBanner();

    const deploy = await promptForDeployment();

    if (deploy) {
        await deploySlashCommands();
        console.log()
    }
    await startBot();
})();
