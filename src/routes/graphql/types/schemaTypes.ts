type IPostType = { id?: string; title: string; content: string; authorId: string };

type IProfileType = {
  id?: string;
  isMale: boolean;
  yearOfBirth: number;
  user: object;
  memberType: object;
};

export type { IPostType, IProfileType };
