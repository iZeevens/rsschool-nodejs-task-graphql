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
import {
  IPostType,
  IProfileType,
  IUserType,
  IMemberType,
} from './types/schemaTypes.js';
import { randomUUID } from 'node:crypto';
import DataLoader from 'dataloader';

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
      resolve: async (
        parent: { memberTypeId: 'BASIC' | 'BUSINESS' },
        _,
        context: {
          dataloaders: WeakMap<object, DataLoader<string, IMemberType | null>>;
          prisma: PrismaClient;
        },
        info,
      ) => {
        const { dataloaders, prisma } = context;

        let dl = dataloaders.get(info.fieldNodes);

        if (!dl) {
          dl = new DataLoader(async (userIds: readonly string[]) => {
            const profiles = await prisma.memberType.findMany({
              where: { id: { in: userIds as string[] } },
            });
            return userIds.map(
              (id) => profiles.find((profile) => profile.id === id) || null,
            );
          });

          dataloaders.set(info.fieldNodes, dl);
        }

        return dl.load(parent.memberTypeId);
      },
    },
  },
});

const postsLoader = new DataLoader(async (authorIds) => {
  const posts = await prisma.post.findMany({
    where: { authorId: { in: authorIds as string[] } },
  });

  return authorIds.map((authorId) => {
    return posts.filter((post) => post.authorId === authorId);
  });
});

const userSubscribedToLoader = new DataLoader(async (subscriberId) => {
  const subTo = await prisma.user.findMany({
    where: {
      subscribedToUser: { some: { subscriberId: { in: subscriberId as string[] } } },
    },
    include: {
      subscribedToUser: true,
    },
  });

  return subscriberId.map((subscriberId) =>
    subTo.filter((user) =>
      user.subscribedToUser.some((sub) => sub.subscriberId === subscriberId),
    ),
  );
});

const subscribedToUserLoader = new DataLoader(async (subscribedToUser) => {
  const users = await prisma.user.findMany({
    where: {
      userSubscribedTo: { some: { authorId: { in: subscribedToUser as string[] } } },
    },
    include: {
      userSubscribedTo: true,
    },
  });

  const result = subscribedToUser.map((id) =>
    users.filter((user) =>
      user.userSubscribedTo.some((subscription) => subscription.authorId === id),
    ),
  );

  return result;
});

const UserType: GraphQLObjectType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    profile: {
      type: ProfileType,
      resolve: async (
        parent: { id: string },
        _,
        context: {
          dataloaders: WeakMap<object, DataLoader<string, IProfileType | null>>;
          prisma: PrismaClient;
        },
        info,
      ) => {
        const { dataloaders, prisma } = context;

        let dl = dataloaders.get(info.fieldNodes);

        if (!dl) {
          dl = new DataLoader(async (userIds: readonly string[]) => {
            const profiles = await prisma.profile.findMany({
              where: { userId: { in: userIds as string[] } },
              include: {
                user: true,
                memberType: true,
              },
            });
            return userIds.map(
              (id) => profiles.find((profile) => profile.userId === id) || null,
            );
          });

          dataloaders.set(info.fieldNodes, dl);
        }

        return dl?.load(parent.id);
      },
    },
    posts: {
      type: new GraphQLList(new GraphQLNonNull(PostType)),
      resolve: async (parent: { id: string }) => {
        return postsLoader.load(parent.id);
      },
    },
    userSubscribedTo: {
      type: new GraphQLList(new GraphQLNonNull(UserType)),
      resolve: async (parent: { id: string }) => {
        return userSubscribedToLoader.load(parent.id);
      },
    },
    subscribedToUser: {
      type: new GraphQLList(new GraphQLNonNull(UserType)),
      resolve: async (parent: { id: string }) => {
        return subscribedToUserLoader.load(parent.id);
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
      resolve: async (_, args: { dto: IUserType }) => {
        const id = randomUUID();

        return await prisma.user.create({
          data: { id, ...args.dto },
        });
      },
    },
    createProfile: {
      type: new GraphQLNonNull(ProfileType),
      args: { dto: { type: new GraphQLNonNull(CreateProfileInputType) } },
      resolve: async (_, args: { dto: IProfileType }) => {
        const id = randomUUID();

        return await prisma.profile.create({
          data: { id, ...args.dto },
        });
      },
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
      resolve: async (_, args: { id: string; dto: IPostType }) => {
        return await prisma.post.update({
          where: { id: args.id },
          data: args.dto,
        });
      },
    },
    changeProfile: {
      type: new GraphQLNonNull(ProfileType),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeProfileInputType) },
      },
      resolve: async (_, args: { id: string; dto: IProfileType }) => {
        return await prisma.profile.update({
          where: { id: args.id },
          data: args.dto,
        });
      },
    },
    changeUser: {
      type: new GraphQLNonNull(UserType),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeUserInputType) },
      },
      resolve: async (_, args: { id: string; dto: IUserType }) => {
        return await prisma.user.update({
          where: { id: args.id },
          data: args.dto,
        });
      },
    },
    deleteUser: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: { id: string }) => {
        await prisma.user.delete({
          where: { id: args.id },
        });
        return `User with ID ${args.id} has been deleted successfully`;
      },
    },
    deletePost: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: { id: string }) => {
        await prisma.post.delete({
          where: { id: args.id },
        });
        return `Post with ID ${args.id} has been deleted successfully`;
      },
    },
    deleteProfile: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: { id: string }) => {
        await prisma.profile.delete({
          where: { id: args.id },
        });
        return `Profile with ID ${args.id} has been deleted successfully`;
      },
    },
    subscribeTo: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: { userId: string; authorId: string }) => {
        console.log(args);
        await prisma.subscribersOnAuthors.create({
          data: {
            subscriberId: args.userId,
            authorId: args.authorId,
          },
        });
        return `User with ID ${args.authorId} successfully subscribed to ${args.userId}`;
      },
    },
    unsubscribeFrom: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: { userId: string; authorId: string }) => {
        console.log(args);
        await prisma.subscribersOnAuthors.delete({
          where: {
            subscriberId_authorId: {
              subscriberId: args.userId,
              authorId: args.authorId,
            },
          },
        });
        return `User with ID ${args.authorId} successfully unsubscribed to ${args.userId}`;
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: Mutations,
});

export default schema;
