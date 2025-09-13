# Conventional Commits

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation
- **ci**: Changes to our CI configuration files and scripts
- **build**: Changes that affect the build system or external dependencies
- **revert**: Reverts a previous commit

## Scopes

- **api**: API routes and endpoints
- **ui**: User interface components
- **lib**: Library utilities and helpers
- **agent**: AI agent functionality
- **config**: Configuration files
- **deps**: Dependencies and package management
- **security**: Security-related changes
- **logging**: Logging and monitoring
- **validation**: Input validation and schemas

## Examples

```
feat(api): add health check endpoint

Add /api/health endpoint for monitoring application status
and uptime information.

Closes #123
```

```
fix(ui): resolve 500 error in prompt builder

Replace Pino logger with Next.js-compatible logger to fix
worker path issues in development mode.

Fixes #456
```

```
chore(deps): update Next.js to v15.3.2

Update Next.js and related dependencies to latest stable
version for improved performance and security.
```
