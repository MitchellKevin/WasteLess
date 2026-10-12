// Copies every collection (documents + indexes) from one database to another in the same cluster.
// The source is left untouched; the target must be empty.
//
//   MONGODB_URI='mongodb+srv://…' node server/scripts/copy-database.js <from> <to> [--dry-run]
//   e.g.  node server/scripts/copy-database.js test wasteless --dry-run
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const mongoose = require('mongoose')

const [from, to] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const dryRun = process.argv.includes('--dry-run')
const BATCH = 1000

async function main() {
  if (!from || !to || from === to) throw new Error('Usage: node server/scripts/copy-database.js <from> <to> [--dry-run]')
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI (your Atlas connection string)')

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
  const client = mongoose.connection.getClient()
  const source = client.db(from)
  const target = client.db(to)
  console.log(`Cluster: ${mongoose.connection.host}`)

  const collections = (await source.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((name) => !name.startsWith('system.'))
  if (collections.length === 0) throw new Error(`Database "${from}" has no collections`)

  // Never merge into or overwrite existing data
  for (const name of await target.listCollections({}, { nameOnly: true }).toArray()) {
    if (await target.collection(name.name).estimatedDocumentCount() > 0)
      throw new Error(`Database "${to}" already has data in "${name.name}". Nothing was copied.`)
  }

  for (const name of collections) {
    const count = await source.collection(name).countDocuments()
    if (dryRun) { console.log(`  would copy ${name}: ${count} documents`); continue }

    let copied = 0
    let batch = []
    for await (const doc of source.collection(name).find()) {
      batch.push(doc)
      if (batch.length === BATCH) { await target.collection(name).insertMany(batch, { ordered: false }); copied += batch.length; batch = [] }
    }
    if (batch.length) { await target.collection(name).insertMany(batch, { ordered: false }); copied += batch.length }

    // Same indexes (e.g. the unique email on users); _id_ exists already
    const indexes = (await source.collection(name).indexes()).filter((i) => i.name !== '_id_')
    for (const { key, name: indexName, v, ns, ...options } of indexes) {
      await target.collection(name).createIndex(key, { name: indexName, ...options })
    }

    const check = await target.collection(name).countDocuments()
    console.log(`  ${name}: ${copied} documents, ${indexes.length} indexes ${check === count ? '✔' : `✖ (target has ${check}, expected ${count})`}`)
  }

  console.log(dryRun ? '\nDry run: nothing was written.' : `\nDone. "${from}" is unchanged; delete it in Atlas once the app works on "${to}".`)
}

main()
  .catch((err) => { console.error(`✖ ${err.message}`); process.exitCode = 1 })
  .finally(() => mongoose.disconnect())
