const Discord = require('discord.js');
const colors = require('colors/safe');

module.exports = {
  name: Discord.Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(colors.green(`Logged in as ${colors.red(client.user.tag)}`));

    const activity = process.env.DiscordBotActivity;
    const status = process.env.DiscordBotStatus;

    if (activity && status) {
      try {
        await client.user.setPresence({
          activities: [
            {
              name: activity,
              type: Discord.ActivityType.Watching,
            },
          ],
          status: status,
        });
        console.info(colors.blue('Presence set successfully.'));
      } catch (err) {
        console.error(colors.red('Error setting presence:'));
        console.error(colors.red(err.stack || err));
      }
    } else {
      if (!activity) console.warn(colors.yellow('Warning: DiscordBotActivity is not set in environment variables.'));
      if (!status) console.warn(colors.yellow('Warning: DiscordBotStatus is not set in environment variables.'));
      
      console.log(colors.blue('Proceeding without setting presence.'));
    }
  },
};
