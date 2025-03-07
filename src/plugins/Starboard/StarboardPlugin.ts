import { Plugin } from '../../types/pluginTypes';

const StarBoardPlugin: Plugin = {
    name: 'Starboard',
    description: 'A plugin that allows you to star messages',
    author: 'GuikiPT',
    commands: [],
    events: [],
    loadOptions: {
        commandsFolder: 'commands',
        eventsFolder: 'events',
        subcommandsFolder: 'subcommands',
        skipEvents: [],
        skipCommands: [],
    },
};

export default StarBoardPlugin;
