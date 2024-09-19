const Discord = require('discord.js');
const { fetchPokemon, fetchPokemonBySpeciesUrl, translatedPokemonTypes, firstLetterToUppercase } = require('../../../functions/functions');
var toHex = require('colornames');
const colors = require('colors/safe');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('pokemon')
        .setDescription('Get detailed information about a Pokémon')
        .addStringOption(option =>
            option.setName('pokemon')
                .setDescription('Name or dex ID of the Pokémon')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const pokemonNameInput = await interaction.options.getString('pokemon');
            const pokemonData = await fetchPokemon(pokemonNameInput);

            if (!pokemonData) {
                return interaction.reply({ content: 'The specified Pokémon does not exist.', ephemeral: true });
            }

            const pokemonBySpeciesData = await fetchPokemonBySpeciesUrl(pokemonData.species.url);
            const pokeColor = await toHex(pokemonBySpeciesData.color || '#FFFFFF');
            const pkmnTypes = await translatedPokemonTypes(pokemonData.types.map(type => type.type.name));

            const joinedTypes = pkmnTypes.length === 1 ? pkmnTypes[0] : pkmnTypes.join(', ');
            const baseStats = pokemonData.stats.map(stat => `${firstLetterToUppercase(stat.stat.name)}: ${stat.base_stat}`).join('\n');
            const abilities = pokemonData.abilities.map(ability => firstLetterToUppercase(ability.ability.name) + (ability.is_hidden ? ' (Hidden)' : '')).join(', ');

            const pokemonDataEmbed = new Discord.EmbedBuilder()
                .setColor(pokeColor ?? 'White')
                .setTitle(`${firstLetterToUppercase(pokemonData.name)} #${pokemonData.id}`)
                .setThumbnail(pokemonData.sprites.front_default)
                .setDescription(pokemonBySpeciesData.flavor_text || 'No description available.')
                .addFields(
                    { name: '**ID**', value: `\`${pokemonData.id}\``, inline: true },
                    { name: '**Base Exp**', value: `\`${pokemonData.baseExp}\``, inline: true },
                    { name: '**Types**', value: `\`${joinedTypes}\``, inline: true },
                )
                .addFields(
                    { name: '**Abilities**', value: `\`${abilities}\``, inline: true },
                    { name: '**Height**', value: `\`${(pokemonData.height / 10)} m\``, inline: true },
                    { name: '**Weight**', value: `\`${(pokemonData.weight / 10)} kg\``, inline: true }
                )
                .addFields(
                    { name: '**Base Stats**', value: `\`\`\`${baseStats}\`\`\`` }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [pokemonDataEmbed] });

        } catch (err) {
            console.error(colors.red(err.stack || err));
            return interaction.reply({ content: 'An error occurred while fetching Pokémon data.', ephemeral: true });
        }
    }
};
