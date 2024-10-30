const colors = require('colors/safe');

module.exports = {
    logMessage: async (message, color = colors.white) => {
        try {
            console.log(color(message));
        }
        catch (error) {
            console.error(colors.red(error.message));
        }
    }
}
