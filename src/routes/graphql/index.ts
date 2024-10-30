import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import schema from './schema.js';
import { graphql } from 'graphql';

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

      const result = await graphql({
        schema,
        source: query,
        variableValues: variables,
        contextValue: { prisma },
      });

      await reply.send(result)
    },
  });
};

export default plugin;
