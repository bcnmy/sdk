export const envCheck = () => {
  const fields = ["BUNDLER_URL", "PRIVATE_KEY"];
  const errorFields = fields.filter((field) => !process.env[field]);
  if (errorFields.length) {
    throw new Error(
      `Missing environment variable${
        errorFields.length > 1 ? "s" : ""
      }: ${errorFields.join(", ")}`
    );
  }
};
