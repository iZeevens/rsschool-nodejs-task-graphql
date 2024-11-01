type IPostType = { id?: string; title: string; content: string; authorId: string };

type IProfileType = {
  id?: string;
  isMale: boolean;
  yearOfBirth: number;
  user: object;
  memberType: object;
};

type IUserType = {
  id?: string;
  name: string;
  balance: number;
};

type IMemberType = {
  id: string;
  discount: number;
  postsLimitPerMonth: number;
};

export type { IPostType, IProfileType, IUserType, IMemberType };
