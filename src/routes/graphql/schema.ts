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
  GraphQLInputObjectType,
} from 'graphql';
import { PrismaClient } from '@prisma/client';
import { UUIDType } from './types/uuid.js';
import { IPostType } from './types/schemaTypes.js';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

// Queries
const MemberTypeId = new GraphQLEnumType({
  name: 'MemberTypeId',
  values: {
    BASIC: { value: 'BASIC' },
    BUSINESS: { value: 'BUSINESS' },
  },
});

const MemberType = new GraphQLObjectType({
  name: 'MemberType',
  fields: {
    id: { type: new GraphQLNonNull(MemberTypeId) },
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
    memberType: {
      type: new GraphQLNonNull(MemberType),
      resolve: async (parent: { memberTypeId: 'BASIC' | 'BUSINESS' }) => {
        return await prisma.memberType.findFirst({
          where: {
            id: parent.memberTypeId,
          },
        });
      },
    },
  },
});

const UserType: GraphQLObjectType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    profile: {
      type: ProfileType,
      resolve: async (parent: { id: string }) => {
        return await prisma.profile.findFirst({
          where: {
            userId: parent.id,
          },
        });
      },
    },
    posts: {
      type: new GraphQLList(new GraphQLNonNull(PostType)),
      resolve: async (parent: { id: string }) => {
        return prisma.post.findMany({
          where: {
            authorId: parent.id,
          },
        });
      },
    },
    userSubscribedTo: {
      type: new GraphQLList(new GraphQLNonNull(UserType)),
      resolve: async (parent: { id: string }) => {
        return await prisma.user.findMany({
          where: {
            subscribedToUser: {
              some: { subscriberId: parent.id },
            },
          },
        });
      },
    },
    subscribedToUser: {
      type: new GraphQLList(new GraphQLNonNull(UserType)),
      resolve: async (parent: { id: string }) => {
        return await prisma.user.findMany({
          where: {
            userSubscribedTo: {
              some: { authorId: parent.id },
            },
          },
        });
      },
    },
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
      args: { id: { type: new GraphQLNonNull(MemberTypeId) } },
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
      resolve: async (_, { id }: { id: string }) => {
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
      resolve: async (_, { id }: { id: string }) => {
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
      resolve: async (_, { id }: { id: string }) => {
        return await prisma.profile.findUnique({
          where: {
            id,
          },
        });
      },
    },
  },
});

// Mutations
const ChangePostInputType = new GraphQLInputObjectType({
  name: 'ChangePostInput',
  fields: {
    title: { type: GraphQLString },
    content: { type: GraphQLString },
  },
});

const ChangeProfileInputType = new GraphQLInputObjectType({
  name: 'ChangeProfileInput',
  fields: {
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    memberTypeId: { type: MemberTypeId },
  },
});

const ChangeUserInputType = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: {
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
  },
});

const CreatePostInputType = new GraphQLInputObjectType({
  name: 'CreatePostInput',
  fields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(UUIDType) },
  },
});

const CreateProfileInputType = new GraphQLInputObjectType({
  name: 'CreateProfileInput',
  fields: {
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    userId: { type: new GraphQLNonNull(UUIDType) },
    memberTypeId: { type: new GraphQLNonNull(MemberTypeId) },
  },
});

const CreateUserInputType = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
  },
});

const Mutations = new GraphQLObjectType({
  name: 'Mutations',
  fields: {
    createUser: {
      type: new GraphQLNonNull(UserType),
      args: { dto: { type: new GraphQLNonNull(CreateUserInputType) } },
    },
    createProfile: {
      type: new GraphQLNonNull(ProfileType),
      args: { dto: { type: new GraphQLNonNull(CreateProfileInputType) } },
      // resolve: async (_, args: {dto: }) => {
      //   const id = randomUUID();

      //   return await prisma.profile.create({})
      // }
    },
    createPost: {
      type: new GraphQLNonNull(PostType),
      args: { dto: { type: new GraphQLNonNull(CreatePostInputType) } },
      resolve: async (_, args: { dto: IPostType }) => {
        const id = randomUUID();

        return await prisma.post.create({
          data: { id, ...args.dto },
        });
      },
    },
    changePost: {
      type: new GraphQLNonNull(PostType),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangePostInputType) },
      },
    },
    changeProfile: {
      type: new GraphQLNonNull(ProfileType),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeProfileInputType) },
      },
    },
    changeUser: {
      type: new GraphQLNonNull(UserType),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeUserInputType) },
      },
    },
    deleteUser: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
    },
    deletePost: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
    },
    deleteProfile: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
    },
    subscribeTo: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
    },
    unsubscribeFrom: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: Mutations,
});

export default schema;
