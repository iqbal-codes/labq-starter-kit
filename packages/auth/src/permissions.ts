import { createAccessControl } from "better-auth/plugins";

const statement = {
  module: ["enable", "disable"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  module: ["enable", "disable"],
});

export const admin = ac.newRole({
  module: ["enable", "disable"],
});

export const member = ac.newRole({
  module: [],
});

export const viewer = ac.newRole({
  module: [],
});

export const roles = {
  owner,
  admin,
  member,
  viewer,
};
