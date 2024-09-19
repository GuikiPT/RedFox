const axios = require('axios');

module.exports = {
    formatDuration: (ms) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);

        const hDisplay = hours > 0 ? `${hours}h ` : "";
        const mDisplay = minutes > 0 ? `${minutes}m ` : "";
        const sDisplay = seconds > 0 ? `${seconds}s` : "";
        return `${hDisplay}${mDisplay}${sDisplay}`;
    },

    fetchPokemon: async (pokemonName) => {
        if (!pokemonName) return null;
        
        try {
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase().replace(' ', '-')}`);
            const pokemon = response.data;

            return {
                abilities: pokemon.abilities,
                baseExp: pokemon.base_experience,
                forms: pokemon.forms,
                height: pokemon.height,
                id: pokemon.id,
                moves: pokemon.moves,
                name: pokemon.name,
                species: pokemon.species,
                sprites: pokemon.sprites,
                stats: pokemon.stats,
                types: pokemon.types,
                weight: pokemon.weight
            };
        } catch (error) {
            console.error(`Error fetching Pokémon ${pokemonName}:`, error);
            return null;
        }
    },

    fetchPokemonBySpeciesUrl: async (pokemonSpeciesUrl) => {
        if (!pokemonSpeciesUrl) return null;

        try {
            const response = await axios.get(pokemonSpeciesUrl);
            const pokemonSpecie = response.data;

            const flavorText = pokemonSpecie.flavor_text_entries.find(entry => entry.language.name === 'en')?.flavor_text.replace(/(\r\n|\n|\r)/gm, ' ') || '';
            return {
                color: pokemonSpecie.color.name,
                flavor_text: flavorText,
            };
        } catch (error) {
            console.error(`Error fetching Pokémon species:`, error);
            return null;
        }
    },

    formatJsonToText: (input) => {
        if (!input) return "No information available";

        try {
            return Object.keys(input).map((key, index) => {
                const formattedKey = isNaN(key) ? key : (+key + 1).toString();
                return `${formattedKey.toUpperCase()} - ${input[key]}`;
            }).join('\n');
        } catch (error) {
            console.error("Error formatting JSON:", error);
            return "Error formatting information.";
        }
    },

    translatedPokemonTypes: async (types) => {
        if (!types || !Array.isArray(types)) return [];

        try {
            const translatedTypes = {
                normal: 'Normal',
                fire: 'Fire',
                water: 'Water',
                electric: 'Electric',
                grass: 'Grass',
                ice: 'Ice',
                fighting: 'Fighting',
                poison: 'Poison',
                ground: 'Ground',
                flying: 'Flying',
                psychic: 'Psychic',
                bug: 'Bug',
                rock: 'Rock',
                ghost: 'Ghost',
                dragon: 'Dragon',
                dark: 'Dark',
                steel: 'Steel',
                fairy: 'Fairy'
            };

            return types.map(type => translatedTypes[type] || type);
        } catch (error) {
            console.error("Error translating Pokémon types:", error);
            return [];
        }
    },

    firstLetterToUppercase: (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
};
