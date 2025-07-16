import { type SchemaTypeDefinition } from 'sanity';
import { user } from './user';
import { club } from './club';
import { clubMember } from './clubMember';
import { award } from './award';
import notification from './notification';
import post from './post';
import expense from './expense';
import tournament from './tournament';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [user, club, clubMember, award, notification, post, expense, tournament],
};
