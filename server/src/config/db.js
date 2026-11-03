import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';

const LOCAL_URI = 'mongodb://localhost:27017/digital_declutter';

const tryConnect = async (uri) => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  return mongoose.connection.host;
};

/**
 * Connects to MONGO_URI (local by default). If that fails and
 * MONGO_URI_FALLBACK (e.g. a MongoDB Atlas string) is set, it is tried next.
 */
const connectDB = async () => {
  const primary = process.env.MONGO_URI || LOCAL_URI;
  const fallback = process.env.MONGO_URI_FALLBACK;

  try {
    const host = await tryConnect(primary);
    console.log(`MongoDB connected: ${host}`);
  } catch (primaryError) {
    console.error(`Primary MongoDB connection failed: ${primaryError.message}`);
    if (!fallback) throw primaryError;

    console.log('Trying MONGO_URI_FALLBACK (Atlas)...');
    const host = await tryConnect(fallback);
    console.log(`MongoDB connected (fallback): ${host}`);
  }
};

export default connectDB;
