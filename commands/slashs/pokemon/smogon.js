const Discord = require("discord.js");
const colors = require("colors/safe");
const axios = require("axios");
var toHex = require("colornames");
const {
	pagination,
	ButtonTypes,
	ButtonStyles,
} = require("@devraelfreeze/discordjs-pagination");

const { Dex } = require("@pkmn/dex");
const { Generations } = require("@pkmn/data");
const { Smogon } = require("@pkmn/smogon");
const gens = new Generations(Dex);
const smogon = new Smogon(fetch);

const {
	fetchPokemon,
	formatJsonToText,
	fetchPokemonBySpeciesUrl,
} = require("../../../functions/functions");

const pokemonIndex = require('./pokemon.json');

function cleanPokemonName(name) {
	const replaceChar = name.replace(/-/g, ' ');
	return replaceChar.charAt(0).toUpperCase() + replaceChar.slice(1);
}

function getMovesetFormatNameByValue(value) {
	const movesetFormats = [
		{ name: "1v1", value: "1v1" },
		{ name: "2v2 Doubles", value: "2v2-doubles" },
		{ name: "Almost Any Ability", value: "almost-any-ability" },
		{ name: "Anything Goes (AG)", value: "ag" },
		{ name: "Balanced Hackmons (BH)", value: "bh" },
		{ name: "Doubles", value: "doubles" },
		{ name: "Doubles Ubers", value: "doubles-ubers" },
		{ name: "Doubles UU", value: "doubles-uu" },
		{ name: "Inverse Battle", value: "inverse-battle" },
		{ name: "Mix and Mega", value: "mix-and-mega" },
		{ name: "Monotype", value: "monotype" },
		{ name: "NeverUsed (NU)", value: "nu" },
		{ name: "OverUsed (OU)", value: "ou" },
		{ name: "PU", value: "pu" },
		{ name: "RU", value: "ru" },
		{ name: "Seasonal", value: "seasonal" },
		{ name: "Tier Shift", value: "tier-shift" },
		{ name: "Uber", value: "uber" },
		{ name: "UnderUsed (UU)", value: "uu" },
		{ name: "Untiered", value: "untiered" },
		{ name: "ZeroUsed (ZU)", value: "zu" },
	];

	const moveset = movesetFormats.find(format => format.value === value);
	return moveset ? moveset.name : null;
}

async function createMovesetEmbed(pokemonData, dataMoveset, speciesResponse, generationInput, movesetFormat, i, total) {
	const pokeColor = await toHex(speciesResponse.color || "#FFFFFF");
	const embed = new Discord.EmbedBuilder()
		.setColor(pokeColor ?? "White")
		.setTitle(dataMoveset.species + " #" + pokemonData.id)
		.setThumbnail(pokemonData.sprites.front_default)
		.addFields(
			{ name: "**Moveset Name**", value: "```" + (dataMoveset.name || "No Information") + "```" },
			{ name: "**Moveset Generation**", value: "```" + generationInput + "° Gen```", inline: true },
			{ name: "**Moveset Format**", value: "```" + getMovesetFormatNameByValue(movesetFormat) + "```", inline: true },
			{ name: "**Species**", value: "```" + (dataMoveset.species || "No Information") + "```" },
			{ name: "**Level**", value: "```" + (dataMoveset.level || "No Information") + "```", inline: true },
			{ name: "**Item**", value: "```" + (dataMoveset.item || "No Information") + "```" },
			{ name: "**Ability**", value: "```" + (dataMoveset.ability || "No Information") + "```", inline: true },
			{ name: "**Natures**", value: "```" + (dataMoveset.nature || "No Information") + "```", inline: true },
			{ name: "**Ivs**", value: "```" + (dataMoveset.ivs ? await formatJsonToText(dataMoveset.ivs) : "No Information") + "```" },
			{ name: "**Evs**", value: "```" + (dataMoveset.evs ? await formatJsonToText(dataMoveset.evs) : "No Information") + "```" },
			{ name: "**Moves**", value: "```" + (dataMoveset.moves ? await formatJsonToText(dataMoveset.moves) : "No Information") + "```" },
		)
		.setTimestamp()
		.setFooter({
			text: `Page ${i + 1} of ${total}`,
		});

	if (generationInput >= 8) {
		embed.addFields({
			name: "**GigantaMax**",
			value: "```" + (dataMoveset.gigantaMax ? "✅" : "❌") + "```",
		});
	}

	if (generationInput >= 9) {
		embed.addFields({
			name: "**TeraType**",
			value: "```" + (dataMoveset.teraType || "No Information") + "```",
		});
	}

	return embed;
}

module.exports = {
	data: new Discord.SlashCommandBuilder()
		.setName("smogon")
		.setDescription("Smogon API")
		.addStringOption(option =>
			option.setName("pokemon").setDescription("The Pokémon name").setRequired(true).setAutocomplete(true)
		)
		.addIntegerOption(option =>
			option
				.setName("generation")
				.setDescription("The generation number (e.g., 8 for generation 8)")
				.setRequired(true)
				.addChoices(
					{ name: "Gen-1", value: 1 },
					{ name: "Gen-2", value: 2 },
					{ name: "Gen-3", value: 3 },
					{ name: "Gen-4", value: 4 },
					{ name: "Gen-5", value: 5 },
					{ name: "Gen-6", value: 6 },
					{ name: "Gen-7", value: 7 },
					{ name: "Gen-8", value: 8 },
					{ name: "Gen-9", value: 9 }
				)
		)
		.addStringOption(option =>
			option
				.setName("format")
				.setDescription("The moveset format")
				.setRequired(true)
				.addChoices(
					{ name: "1v1", value: "1v1" },
					{ name: "2v2 Doubles", value: "2v2-doubles" },
					{ name: "Almost Any Ability", value: "almost-any-ability" },
					{ name: "Anything Goes (AG)", value: "ag" },
					{ name: "Balanced Hackmons (BH)", value: "bh" },
					{ name: "Doubles", value: "doubles" },
					{ name: "Doubles Ubers", value: "doubles-ubers" },
					{ name: "Doubles UU", value: "doubles-uu" },
					{ name: "Inverse Battle", value: "inverse-battle" },
					{ name: "Mix and Mega", value: "mix-and-mega" },
					{ name: "Monotype", value: "monotype" },
					{ name: "NeverUsed (NU)", value: "nu" },
					{ name: "OverUsed (OU)", value: "ou" },
					{ name: "PU", value: "pu" },
					{ name: "RU", value: "ru" },
					{ name: "Seasonal", value: "seasonal" },
					{ name: "Tier Shift", value: "tier-shift" },
					{ name: "Uber", value: "uber" },
					{ name: "UnderUsed (UU)", value: "uu" },
					{ name: "Untiered", value: "untiered" },
					{ name: "ZeroUsed (ZU)", value: "zu" },
				)
		),

	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		if (focusedValue.length >= 3) {
			const filteredPokemon = pokemonIndex.data.filter(pokemon =>
				pokemon.name.startsWith(focusedValue)
			);

			const limitedChoices = filteredPokemon.slice(0, 25).map(pokemon => ({
				name: cleanPokemonName(pokemon.name),
				value: pokemon.name,
			}));

			await interaction.respond(limitedChoices);
		}
	},

	async execute(interaction) {
		try {
			const generationInput = interaction.options.getInteger("generation");
			const pokemonNameInput = interaction.options.getString("pokemon");
			const movesetFormat = interaction.options.getString("format");

			const generationData = gens.get(generationInput);
			if (!generationData) {
				return interaction.reply(
					"The specified generation is not supported. Please provide a generation between 1 and 9."
				);
			}

			const pokemonData = await fetchPokemon(pokemonNameInput);
			if (!pokemonData) {
				return interaction.reply({
					content: "The specified Pokémon does not exist.",
					ephemeral: true,
				});
			}

			const dataMovesets = await smogon.sets(
				gens.get(generationInput),
				pokemonNameInput.toLowerCase(),
				"gen" + generationInput + movesetFormat
			);

			if (!dataMovesets || dataMovesets.length === 0) {
				return interaction.reply({
					content:
						"There is no information available for this Pokémon with the specified settings.\nPlease try using the command with a different generation (1-9) or format.",
					ephemeral: true,
				});
			}

			const speciesResponse = await fetchPokemonBySpeciesUrl(
				pokemonData.species.url
			);

			const embeds = await Promise.all(
				dataMovesets.map((moveset, i) =>
					createMovesetEmbed(pokemonData, moveset, speciesResponse, generationInput, movesetFormat, i, dataMovesets.length)
				)
			);

			await pagination({
				interaction: interaction,
				embeds: embeds,
				author: interaction.member.user,
				time: 60000,
				fastSkip: true,
				disableButtons: true,
				buttons: [
					{
						type: ButtonTypes.first,
						label: "First Page",
						style: ButtonStyles.Primary,
						emoji: "⏮",
					},
					{
						type: ButtonTypes.previous,
						label: "Previous Page",
						style: ButtonStyles.Success,
						emoji: "◀️",
					},
					{
						type: ButtonTypes.number,
						label: null,
						style: ButtonStyles.Success,
						emoji: "#️⃣",
					},
					{
						type: ButtonTypes.next,
						label: "Next Page",
						style: ButtonStyles.Success,
						emoji: "▶️",
					},
					{
						type: ButtonTypes.last,
						label: "Last Page",
						style: ButtonStyles.Primary,
						emoji: "⏭️",
					},
				],
			});
		} catch (err) {
			console.log(colors.red(err));
		}
	},
};
