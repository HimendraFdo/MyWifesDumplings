import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: "q5y27r5n",
    dataset: "production",
  },
  // Hostname for the hosted Studio: https://<studioHost>.sanity.studio
  // Change this if the name is already taken.
  studioHost: "mywifesdumplings",
});
