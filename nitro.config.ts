export default {
  preset: "vercel",
  output: {
    dir: ".vercel/output",
    publicDir: ".vercel/output/static",
  },
  // Ensure that we don't try to use Node.js specific features if we want to be compatible
  // with different Vercel runtimes, but here we are using Node.js.
  node: true,
  // Add some helpful headers or configuration if needed
};
