# https://github.com/casey/just
install:
    pnpm install

# For external and internal APIs
redis:
    docker run --rm -p 6379:6379 --label devographics-redis redis

# For Next surveyform and APIs
# Use Compass to access the DB via GUI
mongo:
    docker run --rm -p 27017:27017 -v "$(pwd)"/.mongo:/data/db --label devographics-mongodb mongo:4.0.4

# @see https://www.npmjs.com/package/concurrently
# @see https://stackoverflow.com/questions/47207616/auto-remove-container-with-docker-compose-yml
# It is not currently possible to automatically remove containers using docker-compose.yml
# so it's easier tp run both commands concurrently
dbs:
    pnpm exec concurrently --prefix-colors "bgRed,bgGreen" \
    --names "redis,mongo" "just redis" "just mongo";

# Create local build
# Don't forget to run Redis and Mongo dbs
build:
    pnpm exec nx run-many --target=build

default:
    @just --list --justfile {{justfile()}}