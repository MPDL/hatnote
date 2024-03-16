# Visualization

An audiovisualisation of the Max Planck Digital Library services (minervamessenger, keeper, bloxberg). Events of these
services are presented as fading dots accompanied by a relaxing soundscape. Dot sizes and tone pitches vary based on event
information. Based on [Hatnote](https://github.com/hatnote/listen-to-wikipedia).

## Build

### api

Build
`go build -o ./api`

Run
`./api -logAbsPath=$LOG_ABS_PATH -appEnvironment=$APP_ENVIRONMENT -appEnvironmentFileDir=$APP_ENVIRONMENT_FILE_DIR`

### docker
Inside the development/staging/production folder run
`docker compose down && docker compose build && docker compose up -d`

### web
For development run `npm run build-dev`. Staging: `npm run build-staging`. Production: `npm run build-prod`.

Then run `npm run start` to start the web server.

Now you can open the website on http://localhost:3000.

## Geographic information
Country data comes from [TopoJSON World Atlas](https://github.com/topojson/world-atlas) (by [Natural Earth](https://www.naturalearthdata.com/)).
Country IDs are expected to be [ISO 3166-1](https://en.wikipedia.org/wiki/ISO_3166-1) numeric.
State IDs are expected to be [https://de.wikipedia.org/wiki/Amtlicher_Gemeindeschl%C3%BCssel](AGS).
German state geo information comes from [https://github.com/AliceWi/TopoJSON-Germany](github.com/AliceWi/TopoJSON-Germany).
You can also use [this one](https://github.com/m-ad/geofeatures-ags-germany/tree/master/topojson) if the other source is unavailable.
There is a separate CRUD website project that serves and creates the mapping between the service data and the geo information.

## Deployment
See on Keeper.

## Additional notes
Further documentation and possible missing files can be found on Keeper.