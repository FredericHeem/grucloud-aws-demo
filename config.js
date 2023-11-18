const pkg = require("./package.json");
module.exports = () => ({
  projectName: pkg.name,
  includeGroups: ["EC2", "ECS", "IAM", "KMS", "RDS"],
  credentials: { profile: "default" },
  partition: "aws",
});
