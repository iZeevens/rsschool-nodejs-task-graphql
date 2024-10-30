import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { PrismaClient } from '@prisma/client';
import { UUIDType } from './types/uuid.js';

const prisma = new PrismaClient();

const MemberEnum = new GraphQLEnumType({
  name: 'MemberEnum',
  values: {
    BASIC: { value: 'BASIC' },
    BUSINESS: { value: 'BUSINESS' },
  },
});

const MemberType = new GraphQLObjectType({
  name: 'MemberType',
  fields: {
    id: { type: new GraphQLNonNull(MemberEnum) },
    discount: { type: new GraphQLNonNull(GraphQLFloat) },
    postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

const PostType = new GraphQLObjectType({
  name: 'PostType',
  fields: {
    id: { type: new GraphQLNonNull(UUIDType) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
  },
});

const ProfileType = new GraphQLObjectType({
  name: 'ProfileType',
  fields: {
    id: { type: new GraphQLNonNull(UUIDType) },
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    memberType: { type: new GraphQLNonNull(MemberType) },
  },
});

const UserType: GraphQLObjectType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: UUIDType },
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
    profile: { type: ProfileType },
    posts: { type: new GraphQLList(new GraphQLNonNull(PostType)) },
    userSubscribedTo: { type: new GraphQLList(new GraphQLNonNull(UserType)) },
    subscribedToUser: { type: new GraphQLList(new GraphQLNonNull(UserType)) },
  }),
});

const RootQueryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    memberTypes: {
      type: new GraphQLList(new GraphQLNonNull(MemberType)),
      resolve: async () => {
        return await prisma.memberType.findMany();
      },
    },
    memberType: {
      type: MemberType,
      args: { id: { type: new GraphQLNonNull(MemberEnum) } },
      resolve: async (_, { id }: { id: 'BASIC' | 'BUSINESS' }) => {
        return await prisma.memberType.findUnique({
          where: {
            id,
          },
        });
      },
    },
    users: {
      type: new GraphQLList(new GraphQLNonNull(UserType)),
      resolve: async () => {
        return await prisma.user.findMany();
      },
    },
    user: {
      type: UserType,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
      resolve: async (_, { id }: { id: 'BASIC' | 'BUSINESS' }) => {
        return await prisma.user.findUnique({
          where: {
            id,
          },
        });
      },
    },
    posts: {
      type: new GraphQLList(new GraphQLNonNull(PostType)),
      resolve: async () => {
        return await prisma.post.findMany();
      },
    },
    post: {
      type: PostType,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
      resolve: async (_, { id }: { id: 'BASIC' | 'BUSINESS' }) => {
        return await prisma.post.findUnique({
          where: {
            id,
          },
        });
      },
    },
    profiles: {
      type: new GraphQLList(new GraphQLNonNull(ProfileType)),
      resolve: async () => {
        return await prisma.profile.findMany();
      },
    },
    profile: {
      type: ProfileType,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
      resolve: async (_, { id }: { id: 'BASIC' | 'BUSINESS' }) => {
        return await prisma.profile.findUnique({
          where: {
            id,
          },
        });
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: RootQueryType,
});

export default schema;
