import puter from "@heyputer/puter.js";
import {
  getOrCreateHostingConfig,
  uploadImageToHosting,
} from "./puter.hosting";
import { isHostedUrl } from "./utils";

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

export const createProject = async ({
  item,
}: CreateProjectParams): Promise<DesignItem | null | undefined> => {
  const projectId = item.id;

  const hosting = await getOrCreateHostingConfig();

  const hostedSource = projectId
    ? await uploadImageToHosting({
        hosting,
        url: item.sourceImage,
        projectId,
        label: "source",
      })
    : null;

  const hostedRender =
    projectId && item.renderedImage
      ? await uploadImageToHosting({
          hosting,
          url: item.renderedImage,
          projectId,
          label: "rendered",
        })
      : null;
  const resolvedSource =
    hostedSource?.url && isHostedUrl(hostedSource?.url)
      ? hostedSource?.url
      : item.sourceImage;
  const isHosted = isHostedUrl(hostedSource?.url);
  console.log("hostedSource", hostedSource);
  console.log("isHosted", isHosted);
  console.log("hostedSource", isHostedUrl);
  console.log("resolvedSource", resolvedSource);

  if (!resolvedSource) {
    console.warn("Failed to host source image, skipping save");
    return null;
  }

  const resolvedRender = hostedRender?.url
    ? hostedRender.url
    : item.renderedImage && isHostedUrl(item.renderedImage)
      ? item.renderedImage
      : undefined;

  const {
    sourcePath: _sourcePath,
    renderedPath: _renderPath,
    publicPath: _publicPath,
    ...rest
  } = item;
  const payload: DesignItem = {
    ...rest,
    sourceImage: resolvedSource,
    renderedImage: resolvedRender,
  };

  try {
    // CAll the puter worker
    return payload;
  } catch (error) {
    console.log(`Failed to save project: ${error}`);
    return null;
  }
};
