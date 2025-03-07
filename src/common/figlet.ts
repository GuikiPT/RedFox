import figlet from 'figlet';
import { promisify } from 'util';
import chalk from 'chalk';

const figletAsync = promisify(figlet);

export const getFigletText = async (text: string): Promise<string> => {
    try {
        const result = await figletAsync(text);
        return result || '';
    } catch (error) {
        console.error(
            chalk.red('Error generating ASCII art:'),
            error instanceof Error ? error.stack : String(error),
        );
        return '';
    }
};
