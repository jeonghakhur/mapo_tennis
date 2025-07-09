import { type SchemaTypeDefinition } from 'sanity';
import { user } from './user';
import { club } from './club';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [user, club],
};
