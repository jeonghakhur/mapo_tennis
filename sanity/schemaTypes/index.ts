import { type SchemaTypeDefinition } from 'sanity';
import { user } from './user';
import { club } from './club';
import { clubMember } from './clubMember';
import { award } from './award';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [user, club, clubMember, award],
};
