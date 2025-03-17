import figlet from 'figlet';
import chalk from 'chalk';

export const getFigletText = async (text: string): Promise<string> => {
    try {
        return new Promise((resolve) => {
            figlet.text(text, (err, result) => {
                resolve(result || '');
            });
        });
    } catch (error) {
        console.error(
            chalk.red('Error generating ASCII art:'),
            error instanceof Error ? error.stack : String(error),
        );
        return '';
    }
};
