import { setServers } from 'node:dns';
import 'reflect-metadata';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import { readableText } from '../src/config/address';
import { stableObjectId } from '../src/config/stable-id';
config({ path: '.env' });
setServers(['8.8.8.8', '8.8.4.4']);
const users = [
  { _id: '650000000000000000000001', name: 'Avery Stone', key: 'avery' },
  { _id: '650000000000000000000002', name: 'Mina Chen', key: 'mina' },
  { _id: '650000000000000000000003', name: 'Ravi Patel', key: 'ravi' },
  { _id: '650000000000000000000004', name: 'Noor Williams', key: 'noor' },
];
const sites: Array<[string, string, (typeof users)[number], string]> = [
  ['nature.zz','Field Notes from the Coast',users[0]!,`<article><h1>Field Notes from the Coast</h1><p>At dawn, tide pools hold a quiet map of the night. Anemones close around drops of seawater while tiny crabs move between ribbons of kelp. Patient observation reveals how the shore changes with each tide.</p><p>Good field notes record weather, water, and uncertainty. A sketch can preserve the shape of a shell, while a few careful sentences explain where it was found.</p><p>Continue exploring: <a href="science.zz">read the science desk</a>, <a href="history.zz">visit the coastal archive</a>, <a href="madeup.zz">a misplaced buoy</a>.</p></article>`],
  ['science.zz','A Pocket Guide to Small Experiments',users[1]!,`<article><h1>A Pocket Guide to Small Experiments</h1><p>Science begins with a question that can be tested. A paper bridge, a jar of seeds, or a week of weather observations can reveal a surprising pattern when measurements are repeated.</p><p>Change one condition at a time and write down what you expected before looking at the result. A useful experiment makes room for being wrong.</p><p>Follow the trail to <a href="books.zz">the reading room</a>, <a href="nature.zz">coastal field notes</a>, or <a href="observatory.zz">the observatory</a>.</p></article>`],
  ['history.zz','The Harbor That Moved',users[2]!,`<article><h1>The Harbor That Moved</h1><p>Maps from three centuries show the old harbor migrating west as storms reshaped the inlet. The oldest chart marks a market at the water's edge; a later survey places it several streets inland.</p><p>Local histories connect large events to ordinary choices: where people built a home, which path they took to work, and what they chose to preserve.</p><p>Read <a href="travel.zz">a walk through the old quarter</a>, <a href="nature.zz">the changing shoreline</a>, and <a href="archive.zz">the community archive</a>.</p></article>`],
  ['travel.zz','Walking the Lantern District',users[3]!,`<article><h1>Walking the Lantern District</h1><p>The Lantern District is best explored slowly. Begin at the tiled fountain, follow the narrow lane toward the bookbinders, and pause on the footbridge when the evening lamps turn gold.</p><p>Travel notes are invitations rather than instructions. Ask residents which bakery is open and leave enough time for an unexpected turn.</p><p>Nearby: <a href="history.zz">learn the district's history</a>, <a href="food.zz">a market morning</a>, <a href="books.zz">find a quiet reading room</a>.</p></article>`],
  ['books.zz','A Reading Room for Everyone',users[0]!,`<article><h1>A Reading Room for Everyone</h1><p>A neighborhood reading room is built from more than shelves. It is a warm table, a patient volunteer, large-print books, and an invitation to return even when you are not sure what to read.</p><p>Our catalog groups stories by the feelings and questions they leave behind. Readers can add a note about the next book that might help someone else.</p><p>Explore <a href="science.zz">small experiments</a>, <a href="music.zz">the listening shelf</a>, and <a href="forest.zz">a guide to the forest path</a>.</p></article>`],
  ['observatory.zz','A Window on the Night Sky',users[1]!,`<article><h1>A Window on the Night Sky</h1><p>On a clear evening, the observatory opens its roof to visitors. Start with the bright planets, then let your eyes adjust before tracing the faint line of the Milky Way.</p><p>A telescope gathers light; it does not make distant objects less mysterious. Keep a log of what you see and return to the same patch of sky next month.</p><p>See <a href="science.zz">how experiments work</a> and <a href="archive.zz">stories from the observatory's first year</a>.</p></article>`],
  ['archive.zz','The Neighborhood Memory Project',users[2]!,`<article><h1>The Neighborhood Memory Project</h1><p>Every donated photograph carries questions about who took it, who is missing, and what happened just outside the frame. The archive pairs images with oral histories and keeps corrections alongside earlier descriptions.</p><p>Community memory grows through careful stewardship. Contributors choose what can be shared and how names should appear.</p><p>Browse <a href="history.zz">harbor maps</a> and <a href="nature.zz">field notes from the coast</a>.</p></article>`],
  ['food.zz','Market Morning',users[3]!,`<article><h1>Market Morning</h1><p>At the market, a basket of pears sits beside jars of local honey. Growers explain which varieties keep well and which are best eaten today. Recipes change with the weather and the harvest.</p><p>Cooking is a form of local knowledge: a way to share tools, remember a season, and welcome someone to the table.</p><p>Plan a stop in <a href="travel.zz">the Lantern District</a> or read <a href="books.zz">stories from the reading room</a>.</p></article>`],
  ['music.zz','A Listening Shelf',users[0]!,`<article><h1>A Listening Shelf</h1><p>This listening shelf collects field recordings: rain on a greenhouse roof, a ferry bell at noon, and the soft clatter of a print shop. Each recording is accompanied by notes about place and permission.</p><p>Listening closely can make a familiar street feel new. Try sitting still for a minute and naming every sound you can hear.</p><p>Pair the soundscape with <a href="nature.zz">the coastal notes</a> or <a href="observatory.zz">a night at the observatory</a>.</p></article>`],
  ['forest.zz','The Old Forest Path',users[1]!,`<article><h1>The Old Forest Path</h1><p>The old forest path climbs gently past cedar, fern, and a stream that disappears beneath a shelf of stone. Stay on marked ground to protect the small plants growing along its edges.</p><p>Seasonal guides describe what may be seen, not what must be found. Leave the path as you found it and carry your observations home.</p><p>Read <a href="nature.zz">shoreline field notes</a>, <a href="travel.zz">walking directions</a>, and <a href="lost.zz">a trail marker missing from the map</a>.</p></article>`],
];
const visits = [
  ['avery',['nature.zz','science.zz','books.zz','science.zz','observatory.zz','archive.zz','nature.zz','music.zz','books.zz','forest.zz','travel.zz','food.zz','nature.zz']],
  ['mina',['science.zz','observatory.zz','science.zz','nature.zz','forest.zz','books.zz','music.zz','science.zz']],
  ['ravi',['history.zz','archive.zz','history.zz','travel.zz','food.zz','archive.zz','nature.zz']],
  ['noor',['travel.zz','food.zz','books.zz','travel.zz','history.zz','food.zz','nature.zz']],
];

async function seed(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<DB_PASSWORD>')) throw new Error('Set MONGODB_URI privately in backend/.env before seeding.');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db!;
  const userCollection = db.collection('users'); const siteCollection = db.collection('sites'); const visitCollection = db.collection('visits');
  await userCollection.createIndex({ key: 1 }, { unique: true }); await siteCollection.createIndex({ address: 1 }, { unique: true });
  await userCollection.bulkWrite(users.map((user) => ({ updateOne: { filter: { key: user.key }, update: { $set: { name: user.name, updatedAt: new Date('2025-01-01T00:00:00Z') }, $setOnInsert: { _id: new mongoose.Types.ObjectId(user._id), key: user.key, createdAt: new Date('2025-01-01T00:00:00Z') } }, upsert: true } })));
  const userByKey = new Map<string, { _id: mongoose.Types.ObjectId }>();
  for (const user of users) { const found = await userCollection.findOne({ key: user.key }); if (found) userByKey.set(user.key, { _id: found._id as mongoose.Types.ObjectId }); }
  await siteCollection.createIndex({ seedKey: 1 }, { unique: true, sparse: true });
  await siteCollection.bulkWrite(sites.map(([address, title, author, html]) => ({ updateOne: { filter: { seedKey: `seed-v1-${address}` }, update: { $set: { seedKey: `seed-v1-${address}`, address, title, authorId: userByKey.get(author.key)!._id, html, searchableText: readableText(html), createdAt: new Date('2025-01-01T00:00:00Z'), updatedAt: new Date('2025-01-01T00:00:00Z') }, $setOnInsert: { _id: stableObjectId(`site:${address}`) } }, upsert: true } })));
  await visitCollection.createIndex({ seedKey: 1 }, { unique: true, sparse: true }); await visitCollection.createIndex({ userId: 1, visitedAt: -1 });
  const base = new Date('2025-01-01T12:00:00Z'); let ordinal = 0;
  const ops = visits.flatMap(([key, addresses]) => (addresses as string[]).map((address) => {
    const minute = ordinal++ * 2;
    const seedKey = `seed-v1-${key}-${minute}`;
    return { updateOne: { filter: { seedKey }, update: { $setOnInsert: { _id: stableObjectId(`visit:${seedKey}`), seedKey, userId: userByKey.get(key as string)!._id, address, method: minute === 0 ? 'typed' : 'link', title: sites.find((s) => s[0] === address)?.[1], visitedAt: new Date(base.getTime() + minute * 60_000) } }, upsert: true } };
  }));
  await visitCollection.bulkWrite(ops); await mongoose.disconnect();
  console.log(`Seeded ${users.length} users, ${sites.length} sites, and ${ops.length} deterministic visits.`);
}
void seed().catch(async () => { console.error('Seed failed. Check backend/.env and MongoDB network access.'); await mongoose.disconnect(); process.exitCode = 1; });
