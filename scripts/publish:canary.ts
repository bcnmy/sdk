import { execSync } from "node:child_process"
import fs from "node:fs/promises"
import semver from "semver"

async function publishCanary() {
  // Read the package.json file
  const packageJson = JSON.parse(await fs.readFile("package.json", "utf-8"))

  // Add '-canary' to the package name if it's not already there
  if (!packageJson.name.endsWith("-canary")) {
    packageJson.name = `${packageJson.name}-canary`
  }
  const canaryName = packageJson.name

  // Get the latest version from npm
  let latestVersion: string
  try {
    latestVersion = execSync(`npm view ${canaryName} version`, {
      encoding: "utf-8"
    }).trim()
    console.log(`Latest version on npm: ${latestVersion}`)
  } catch (error) {
    console.log(
      "No existing canary version found on npm. Using package.json version."
    )
    latestVersion = packageJson.version
  }

  console.log({ latestVersion })

  // Ensure we're working with valid semver
  if (!semver.valid(latestVersion)) {
    console.log(
      `Invalid version ${latestVersion}, defaulting to package.json version`
    )
    latestVersion = packageJson.version
  }

  // Bump the version
  const newVersion = semver.inc(latestVersion, "patch")
  if (!newVersion) {
    throw new Error("Failed to increment version")
  }
  packageJson.version = newVersion

  console.log(`New version will be: ${newVersion}`)

  // Write the updated package.json
  await fs.writeFile("package.json", JSON.stringify(packageJson, null, 2))

  // Run changeset version command
  execSync("bun run changeset:version", { stdio: "inherit" })

  console.log(`Canary version bumped to ${newVersion}`)
}

publishCanary().catch(console.error)
