import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';

export class UserEvent extends Listener<typeof Events.Error> {
	public override run(error: Error) {
		this.container.logger.error('❌ Client error occurred:', error);
	}
}
