import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import CleanupItem from './src/models/CleanupItem.js';

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const items = [
  { title: 'Old Gmail (college days)', type: 'account', category: 'Personal', reviewIntervalDays: 90, lastReviewedAt: daysAgo(210), notes: 'Used for hostel forms. Check for linked logins before closing.', link: 'https://myaccount.google.com' },
  { title: 'Netflix Premium plan', type: 'subscription', category: 'Entertainment', reviewIntervalDays: 30, lastReviewedAt: daysAgo(75), notes: 'Barely watched since June. Downgrade to Mobile plan?', link: 'https://www.netflix.com/youraccount' },
  { title: 'Downloads folder (laptop)', type: 'file', category: 'Personal', reviewIntervalDays: 14, lastReviewedAt: daysAgo(48), notes: 'Installers, duplicate PDFs and screenshots piling up.' },
  { title: 'Dropbox free account', type: 'account', category: 'Cloud Storage', reviewIntervalDays: 120, lastReviewedAt: daysAgo(330), notes: 'Move project files to Google Drive, then delete.', link: 'https://www.dropbox.com/account' },
  { title: 'Spotify Premium', type: 'subscription', category: 'Entertainment', reviewIntervalDays: 60, lastReviewedAt: daysAgo(12), notes: 'Student discount renews every year.', link: 'https://www.spotify.com/account' },
  { title: 'Old LinkedIn profile', type: 'account', category: 'Work', reviewIntervalDays: 180, lastReviewedAt: daysAgo(160), notes: 'Update skills and remove outdated internship.', link: 'https://www.linkedin.com' },
  { title: 'Semester 1 scanned notes', type: 'file', category: 'Cloud Storage', status: 'archived', reviewIntervalDays: 365, lastReviewedAt: daysAgo(400), notes: 'Archived to external drive.' },
  { title: 'Bank statements 2022', type: 'file', category: 'Finance', reviewIntervalDays: 365, lastReviewedAt: daysAgo(95), notes: 'Keep for tax records. Password protect the folder.' },
  { title: 'Gym membership', type: 'subscription', category: 'Personal', reviewIntervalDays: 30, lastReviewedAt: daysAgo(5), notes: 'Auto-renews on the 1st.' },
  { title: 'Figma free workspace', type: 'account', category: 'Work', reviewIntervalDays: 90, lastReviewedAt: daysAgo(40), notes: 'Delete abandoned design drafts.', link: 'https://www.figma.com' },
  { title: 'Cloud storage 200 GB plan', type: 'subscription', category: 'Cloud Storage', reviewIntervalDays: 60, lastReviewedAt: daysAgo(22), notes: 'Only 40 GB in use. Consider the cheaper tier.', link: 'https://one.google.com' },
  { title: 'Old Twitter/X account', type: 'account', category: 'Other', status: 'archived', reviewIntervalDays: 365, lastReviewedAt: daysAgo(500), notes: 'Downloaded archive. Account deactivated.' },
  { title: 'Desktop screenshots', type: 'file', category: 'Personal', reviewIntervalDays: 7, lastReviewedAt: daysAgo(2) },
];

const run = async () => {
  try {
    await connectDB();
    const removed = await CleanupItem.deleteMany({});
    console.log(`Cleared ${removed.deletedCount} existing items`);
    const created = await CleanupItem.insertMany(items);
    console.log(`Inserted ${created.length} sample items`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
