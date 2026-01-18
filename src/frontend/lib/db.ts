import { MongoClient, Db } from 'mongodb'

const mongoUri = process.env.MONGODB_URI

if (!mongoUri) {
  throw new Error('Missing MONGODB_URI in environment variables')
}

const dbName = process.env.MONGODB_DB_NAME || 'scholarship_finder_ca'

let clientPromise: Promise<MongoClient>

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(mongoUri)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  const client = new MongoClient(mongoUri)
  clientPromise = client.connect()
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise
  return client.db(dbName)
}

export default clientPromise
