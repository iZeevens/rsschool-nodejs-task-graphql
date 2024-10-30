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
import { UUIDType } from './types/uuid.js';

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
    memberTypes: { type: new GraphQLList(new GraphQLNonNull(MemberType)) },
    memberType: {
      type: MemberType,
      args: { id: { type: new GraphQLNonNull(MemberEnum) } },
    },
    users: {
      type: new GraphQLList(new GraphQLNonNull(UserType)),
    },
    user: {
      type: UserType,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
    },
    posts: {
      type: new GraphQLList(new GraphQLNonNull(PostType)),
    },
    post: {
      type: PostType,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
    },
    profiles: {
      type: new GraphQLList(new GraphQLNonNull(ProfileType)),
    },
    profile: {
      type: ProfileType,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
    },
  },
});

const schema = new GraphQLSchema({
  query: RootQueryType,
});

export default schema;
