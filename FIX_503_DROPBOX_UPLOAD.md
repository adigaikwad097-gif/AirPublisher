# Fix 503 Error - Dropbox Upload

## Error
```
503 Service Unavailable
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This means the server is crashing and returning an HTML error page instead of JSON.

## Most Likely Causes

### 1. Dropbox Package Not Installed
```bash
npm install dropbox
```

### 2. DROPBOX_ACCESS_TOKEN Not Set
Add to `.env.local`:
```env
DROPBOX_ACCESS_TOKEN=sl.u.AGPZ3Hr5aUusNaIXSA2yCKKFM2JPeu8wviXktYfBFd_uZ9zfDRtOw0LnQKQm3K7OyMpdf5ckffZXiPi_wmJAJX7k8lJMX_2NJt1ojKn0Fs653jxuMD2xrYy1LUj2kMCZPIiTplH8AT4Cr9_4e_EmpbltSAj37iry-o8jGc-xuL7gcT0E2fqr8rQ2yaTOOkusUkSPnqPh_CAKXjHcG_DrMDQ-yzvJThafhFznIsd3_VcTh-szFKmB_TUq-lhp9DhlGCVedtsAtFXDhBXvl6ZiFInWY0wpxv_Kx9KsBAD5wd-G76Qy3cXjEt2DUDQ63q-kPuyiIwJjRXLBDf-3OfS6vJewnpcQ6xOwqbPEM2EJuoGpv38VCSn9COMCYbZiRCNQK0d92MFZoN8AmvqA_Y0c46BTe_ZMPRi2U8NFIbZgXQD_q_XV-rPSdFVZMnFAFsV7nSKWnkzzhW4Ijk4xBqKezhq2DW_o-9Yg82GZKgWB3APjEfvm7Bu_RPCiiADOy58ltnnSGzqe4MALZTGcu74orkuc_NRJSznPAGAJlzYmuB0rNsua86B5V2tr-vBuE_RXVlRvJNNcru1Uh00_Zp3PVXSvJKMkuheqI5vAuFNPfSJkNrY7PSFGj55AxNU6oi1eIaanoZwMkHwRCrjmJgvwxzgnQdGrTOKi4BzTZ7Ap4Bf0cobZHALe4H5gEg5pL4hTyhPhFr_lXUUagvJUAmXtzqJL6O-5HgLKaBTtWPxZrtn6zL55GzFSNqaglnNUSGrxyW3OdUNfk7nv5Fu1LN2PjNKhD56LATUFM4W6Y_H7eKlv3yP-IsubLWZWOAELpaw8wxOgLDlejEvmDjw8EpuBzp1FlrAUeTamwVLMQ42M-rqsbq3QD-3lLVzRmm_jCf9O1HKKtaxFurypvvrL-tokib8wJASzU9Pi-uGucXDkg8YVOIR5WhBrRLOrDJTqnzJFb-8U9OsaZAPlzkaykRkwwGpkYr7ynNDQWBM9Bqd6PhbJMMrbFEudDqft62Wro5OhG9ULl2OkZJiWZ70uavWBhIEtx8Mwq7xLkEDd0RzpPVf203WfeES0WSq7ZJfKOhKJE08BW05RjgiQSr_-hbsGqx-4zUI5QWexzBiMqc7u-d7qIUroj0jiBi37_IDc-8J8BrKSvqtYVsj_eYcBOkJoiIgisLqGtgzDkJ1Nnlbg2nZlk5-epawjon6pE6aG6wap5U2GOnfcW9bequOZ_gObX45cgYybc2YAXM2hw-rUzne_rDSHqNjiCgIwxz0HBMth1pcwdyLQMqyF2E1A_WmT1uBLRgj6Sd0e29iZxArzn4RpEt2YSzhWAxdzU1neJp1uU-WL_Xd71XIly1JKht1Uu7x8KC9uW39c1JTNJfZ_sAqJ1TFJA1zC6zd6eu33gzUyeV4hwGAK0loQ2uG-rV-MuI4nGxuKqjaZ_qPQEUx-O48EKA
```

### 3. Migration Not Run
Run `supabase/migrations/014_make_platform_target_nullable.sql` to allow null platform_target.

## Steps to Fix

1. **Install Dropbox package:**
   ```bash
   npm install dropbox
   ```

2. **Add DROPBOX_ACCESS_TOKEN to `.env.local`** (see above)

3. **Run migration** (if not done):
   ```sql
   -- File: supabase/migrations/014_make_platform_target_nullable.sql
   ```

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

5. **Check terminal logs** - you should see:
   ```
   [uploadToDropbox] Starting upload...
   [createDropboxClient] Creating Dropbox client with token
   [uploadToDropbox] Uploading file to Dropbox...
   [uploadToDropbox] ✅ File uploaded successfully
   ```

## Check Terminal Logs

Look for these error messages in your terminal:
- `Dropbox SDK not installed` → Run `npm install dropbox`
- `DROPBOX_ACCESS_TOKEN not set` → Add token to `.env.local`
- `Dropbox upload failed` → Check token validity or Dropbox API errors

The improved error handling will now show specific error messages instead of crashing with 503.


