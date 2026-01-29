# Fix Upload Error - Two Steps

## Error
```
null value in column "platform_target" of relation "air_publisher_videos" violates not-null constraint
```

## Solution

### Step 1: Run Migration (REQUIRED)

Run this SQL in Supabase SQL Editor:

```sql
-- File: supabase/migrations/014_make_platform_target_nullable.sql

-- Make platform_target nullable (videos can be drafts without a platform selected)
ALTER TABLE air_publisher_videos 
  ALTER COLUMN platform_target DROP NOT NULL;

-- Update the CHECK constraint to allow NULL
ALTER TABLE air_publisher_videos 
  DROP CONSTRAINT IF EXISTS air_publisher_videos_platform_target_check;

ALTER TABLE air_publisher_videos 
  ADD CONSTRAINT air_publisher_videos_platform_target_check 
  CHECK (platform_target IS NULL OR platform_target IN ('youtube', 'instagram', 'tiktok', 'internal'));
```

### Step 2: Verify Dropbox Token

Make sure `DROPBOX_ACCESS_TOKEN` is in your `.env.local`:

```env
DROPBOX_ACCESS_TOKEN=sl.u.AGPZ3Hr5aUusNaIXSA2yCKKFM2JPeu8wviXktYfBFd_uZ9zfDRtOw0LnQKQm3K7OyMpdf5ckffZXiPi_wmJAJX7k8lJMX_2NJt1ojKn0Fs653jxuMD2xrYy1LUj2kMCZPIiTplH8AT4Cr9_4e_EmpbltSAj37iry-o8jGc-xuL7gcT0E2fqr8rQ2yaTOOkusUkSPnqPh_CAKXjHcG_DrMDQ-yzvJThafhFznIsd3_VcTh-szFKmB_TUq-lhp9DhlGCVedtsAtFXDhBXvl6ZiFInWY0wpxv_Kx9KsBAD5wd-G76Qy3cXjEt2DUDQ63q-kPuyiIwJjRXLBDf-3OfS6vJewnpcQ6xOwqbPEM2EJuoGpv38VCSn9COMCYbZiRCNQK0d92MFZoN8AmvqA_Y0c46BTe_ZMPRi2U8NFIbZgXQD_q_XV-rPSdFVZMnFAFsV7nSKWnkzzhW4Ijk4xBqKezhq2DW_o-9Yg82GZKgWB3APjEfvm7Bu_RPCiiADOy58ltnnSGzqe4MALZTGcu74orkuc_NRJSznPAGAJlzYmuB0rNsua86B5V2tr-vBuE_RXVlRvJNNcru1Uh00_Zp3PVXSvJKMkuheqI5vAuFNPfSJkNrY7PSFGj55AxNU6oi1eIaanoZwMkHwRCrjmJgvwxzgnQdGrTOKi4BzTZ7Ap4Bf0cobZHALe4H5gEg5pL4hTyhPhFr_lXUUagvJUAmXtzqJL6O-5HgLKaBTtWPxZrtn6zL55GzFSNqaglnNUSGrxyW3OdUNfk7nv5Fu1LN2PjNKhD56LATUFM4W6Y_H7eKlv3yP-IsubLWZWOAELpaw8wxOgLDlejEvmDjw8EpuBzp1FlrAUeTamwVLMQ42M-rqsbq3QD-3lLVzRmm_jCf9O1HKKtaxFurypvvrL-tokib8wJASzU9Pi-uGucXDkg8YVOIR5WhBrRLOrDJTqnzJFb-8U9OsaZAPlzkaykRkwwGpkYr7ynNDQWBM9Bqd6PhbJMMrbFEudDqft62Wro5OhG9ULl2OkZJiWZ70uavWBhIEtx8Mwq7xLkEDd0RzpPVf203WfeES0WSq7ZJfKOhKJE08BW05RjgiQSr_-hbsGqx-4zUI5QWexzBiMqc7u-d7qIUroj0jiBi37_IDc-8J8BrKSvqtYVsj_eYcBOkJoiIgisLqGtgzDkJ1Nnlbg2nZlk5-epawjon6pE6aG6wap5U2GOnfcW9bequOZ_gObX45cgYybc2YAXM2hw-rUzne_rDSHqNjiCgIwxz0HBMth1pcwdyLQMqyF2E1A_WmT1uBLRgj6Sd0e29iZxArzn4RpEt2YSzhWAxdzU1neJp1uU-WL_Xd71XIly1JKht1Uu7x8KC9uW39c1JTNJfZ_sAqJ1TFJA1zC6zd6eu33gzUyeV4hwGAK0loQ2uG-rV-MuI4nGxuKqjaZ_qPQEUx-O48EKA
```

### Step 3: Restart Dev Server

```bash
npm run dev
```

## ✅ After Fix

1. Videos can be uploaded without selecting a platform
2. Videos upload to Dropbox: `/airpublisher/creator_{id}/`
3. Platform is selected later when publishing from "My Videos"

## 📁 Dropbox Upload Flow

1. User uploads video → Video record created (draft, no platform)
2. File uploaded to Dropbox → `/airpublisher/creator_{id}/{video-id}.mp4`
3. Video URL saved in database → Points to Dropbox shared link
4. User goes to "My Videos" → Selects platform → Publishes

Ready to test! 🚀



