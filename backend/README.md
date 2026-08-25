# Nagar Drishti backend

## Prayagraj network

`src/data/prayagraj.network.js` is the only curated geography source for the demo. It defines six operational zones, twelve connected corridors, and 27 camera junctions across Civil Lines, Katra, Sangam, Naini, Teliarganj–Phaphamau, and Jhunsi.

The coordinates are suitable for a prototype map and simulated journeys. Confirm every proposed camera position, traffic direction, road ownership, and surveillance approval with the relevant authority before any real deployment.

## Generate 180 days of detections

Set `DATABASE_URL` and `JWT_SECRET` in `backend/.env`, then run the following from `backend`:

```bash
npx prisma migrate deploy
npm run generate:historical
npm run export:detections
```

`generate:historical` clears existing traffic, camera, road, and zone records, seeds the Prayagraj network again, and generates the last 180 calendar days ending now. It also creates camera-to-camera transitions and linked blacklist alerts. `export:detections` writes `data/exports/detections.csv`.

To generate a fixed presentation window, use an explicit end date in India time:

```bash
HISTORICAL_DAYS=180 HISTORICAL_END_DATE='2026-08-25T23:59:59+05:30' npm run generate:historical
```

To seed only the map network without detections, run:

```bash
npm run seed:prayagraj-network
```
