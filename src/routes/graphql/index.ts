import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import schema from './schema.js';
import { graphql, parse, validate } from 'graphql';
import depthLimit from 'graphql-depth-limit';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req, reply) {
      const { query, variables } = req.body;

      const document = parse(query);
      const errors = validate(schema, document, [depthLimit(5)]);

      if (errors.length > 0) {
        return reply.status(400).send({ errors });
      }

      const result = await graphql({
        schema,
        source: query,
        variableValues: variables,
        contextValue: {
          prisma: prisma,
          dataloaders: new WeakMap(),
        },
      });

      await reply.send(result);
    },
  });
};

export default plugin;
