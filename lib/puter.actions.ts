import puter from "@heyputer/puter.js";

export const signInPuter = async () => {
  await puter.auth.signIn();
};
export const signOutPuter = () => {
  puter.auth.signOut();
};

export const getCurrentUser = async () => {
  try {
    return await puter.auth.getUser();
  } catch {
    return null;
  }
};
