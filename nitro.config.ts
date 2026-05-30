export default {
  preset: "vercel",
  node: true,
  vercel: {
    functions: {
      runtime: "nodejs22.x",
    },
  },
};
