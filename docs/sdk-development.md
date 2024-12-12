# SDK Development Guide

## Repository Structure

We maintain two repositories:
1. Main Backend Repository (`BAWES-ERP`)
   - Contains the `sdk` folder with base configuration
   - Contains OpenAPI spec (`swagger.json`)
   - Generates SDK code via GitHub Actions

2. SDK Repository (`BAWES-ERP-sdk`)
   - Contains the published SDK code
   - Updated automatically when API changes
   - Used by frontend applications

## The `sdk` Folder

The `sdk` folder in the main repository contains the base configuration for the SDK: 

sdk/
├── package.json # SDK package configuration
├── tsconfig.json # TypeScript configuration
└── README.md # SDK documentation

These files are used as templates when initializing/updating the SDK repository. They are **not** automatically synced on every commit.

## SDK Update Flow

1. **When is the SDK updated?**
   - When `swagger.json` changes
   - When files in `src/**/*.ts` change
   - When manually triggered via GitHub Actions

2. **Update Process**
   - GitHub Action detects changes
   - Generates new TypeScript code from OpenAPI spec
   - Copies base configuration from `sdk` folder
   - Pushes changes to SDK repository

3. **Version Control**
   - Breaking changes trigger a GitHub issue
   - Version numbers follow semantic versioning
   - CHANGELOG.md is maintained in the SDK repository

## Making Changes

### Updating SDK Configuration

1. Make changes in the `sdk` folder
2. Commit changes to main repository
3. Manually trigger SDK update workflow to apply changes:
   ```bash
   # Via GitHub UI
   Actions -> Update SDK -> Run workflow

   # Or via API
   gh workflow run "Update SDK"
   ```

### API Changes

1. Update your API endpoints/controllers
2. Update OpenAPI spec (`swagger.json`)
3. SDK update happens automatically via GitHub Actions

## Breaking Changes

When the GitHub Action detects breaking changes:

1. An issue is created in the main repository
2. Issue contains:
   - Details of the breaking changes
   - Required version bump (major)
   - Suggested migration steps

## Development Workflow

1. **Backend Changes**
   ```bash
   # 1. Make API changes
   # 2. Update swagger.json
   # 3. Commit and push
   git add .
   git commit -m "feat: add new endpoint"
   git push

   # 4. SDK is automatically updated
   ```

2. **SDK Configuration Changes**
   ```bash
   # 1. Update files in sdk/
   # 2. Commit and push
   git add sdk/
   git commit -m "chore: update SDK config"
   git push

   # 3. Manually trigger SDK update
   gh workflow run "Update SDK"
   ```

## Troubleshooting

1. **SDK not updating?**
   - Check if changes were made to `swagger.json` or `src/**/*.ts`
   - Verify GitHub Action logs
   - Try manual workflow trigger

2. **Breaking changes?**
   - Check GitHub issues for breaking change notifications
   - Review suggested migration steps
   - Plan version bump accordingly

3. **Need to force update?**
   - Use workflow_dispatch trigger in GitHub Actions
   - Monitor action logs for errors