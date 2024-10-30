const Discord = require('discord.js');
const colors = require('colors/safe');
const { logMessage } = require('../../functions/logs');

module.exports = {
  name: Discord.Events.ClientReady,
  once: true,
  async execute(client) {
    logMessage(`Logged in as ${client.user.tag}`, colors.green);

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
        logMessage('Presence set successfully.', colors.blue);
      } catch (error) {
        logMessage('Error setting presence:', colors.red);
        console.error(colors.red(error.message));
      }
    } else {
      if (!activity) logMessage('Warning: DiscordBotActivity is not set in environment variables.', colors.yellow);
      if (!status) logMessage('Warning: DiscordBotStatus is not set in environment variables.', colors.yellow);
      logMessage('Proceeding without setting presence.', colors.blue);
    }
  },
};
