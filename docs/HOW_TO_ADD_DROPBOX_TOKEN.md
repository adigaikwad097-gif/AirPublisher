# How to Add Dropbox Token

## Where the Token Goes

The `DROPBOX_ACCESS_TOKEN` should be in your **`.env.local`** file (in the project root, same folder as `package.json`).

## Steps to Add Token

### 1. Open `.env.local` File

Open the file in your editor. It should be in the root of your project:
```
/Users/suniya/Desktop/airpublisher/.env.local
```

### 2. Add This Line

Add this line to your `.env.local` file (at the end, or wherever you keep your environment variables):

```env
DROPBOX_ACCESS_TOKEN=sl.u.AGPZ3Hr5aUusNaIXSA2yCKKFM2JPeu8wviXktYfBFd_uZ9zfDRtOw0LnQKQm3K7OyMpdf5ckffZXiPi_wmJAJX7k8lJMX_2NJt1ojKn0Fs653jxuMD2xrYy1LUj2kMCZPIiTplH8AT4Cr9_4e_EmpbltSAj37iry-o8jGc-xuL7gcT0E2fqr8rQ2yaTOOkusUkSPnqPh_CAKXjHcG_DrMDQ-yzvJThafhFznIsd3_VcTh-szFKmB_TUq-lhp9DhlGCVedtsAtFXDhBXvl6ZiFInWY0wpxv_Kx9KsBAD5wd-G76Qy3cXjEt2DUDQ63q-kPuyiIwJjRXLBDf-3OfS6vJewnpcQ6xOwqbPEM2EJuoGpv38VCSn9COMCYbZiRCNQK0d92MFZoN8AmvqA_Y0c46BTe_ZMPRi2U8NFIbZgXQD_q_XV-rPSdFVZMnFAFsV7nSKWnkzzhW4Ijk4xBqKezhq2DW_o-9Yg82GZKgWB3APjEfvm7Bu_RPCiiADOy58ltnnSGzqe4MALZTGcu74orkuc_NRJSznPAGAJlzYmuB0rNsua86B5V2tr-vBuE_RXVlRvJNNcru1Uh00_Zp3PVXSvJKMkuheqI5vAuFNPfSJkNrY7PSFGj55AxNU6oi1eIaanoZwMkHwRCrjmJgvwxzgnQdGrTOKi4BzTZ7Ap4Bf0cobZHALe4H5gEg5pL4hTyhPhFr_lXUUagvJUAmXtzqJL6O-5HgLKaBTtWPxZrtn6zL55GzFSNqaglnNUSGrxyW3OdUNfk7nv5Fu1LN2PjNKhD56LATUFM4W6Y_H7eKlv3yP-IsubLWZWOAELpaw8wxOgLDlejEvmDjw8EpuBzp1FlrAUeTamwVLMQ42M-rqsbq3QD-3lLVzRmm_jCf9O1HKKtaxFurypvvrL-tokib8wJASzU9Pi-uGucXDkg8YVOIR5WhBrRLOrDJTqnzJFb-8U9OsaZAPlzkaykRkwwGpkYr7ynNDQWBM9Bqd6PhbJMMrbFEudDqft62Wro5OhG9ULl2OkZJiWZ70uavWBhIEtx8Mwq7xLkEDd0RzpPVf203WfeES0WSq7ZJfKOhKJE08BW05RjgiQSr_-hbsGqx-4zUI5QWexzBiMqc7u-d7qIUroj0jiBi37_IDc-8J8BrKSvqtYVsj_eYcBOkJoiIgisLqGtgzDkJ1Nnlbg2nZlk5-epawjon6pE6aG6wap5U2GOnfcW9bequOZ_gObX45cgYybc2YAXM2hw-rUzne_rDSHqNjiCgIwxz0HBMth1pcwdyLQMqyF2E1A_WmT1uBLRgj6Sd0e29iZxArzn4RpEt2YSzhWAxdzU1neJp1uU-WL_Xd71XIly1JKht1Uu7x8KC9uW39c1JTNJfZ_sAqJ1TFJA1zC6zd6eu33gzUyeV4hwGAK0loQ2uG-rV-MuI4nGxuKqjaZ_qPQEUx-O48EKA
```

**Important:**
- No quotes around the token
- No spaces around the `=` sign
- The entire token should be on one line

### 3. Save the File

Save `.env.local` after adding the token.

### 4. Restart Dev Server

**You MUST restart the dev server** for the token to be loaded:

```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

## How to Verify Token is Loaded

### ✅ You'll See in Terminal (NOT the token itself, but confirmation):

When you try to upload, you should see in your terminal:

**If token is found:**
```
[getDropboxAccessToken] ✅ Using DROPBOX_ACCESS_TOKEN from env (length: 1234)
[upload] Dropbox token check: { hasToken: true, tokenLength: 1234 }
```

**If token is NOT found:**
```
[getDropboxAccessToken] ❌ DROPBOX_ACCESS_TOKEN not set in environment variables
[upload] Dropbox token check: { hasToken: false, tokenLength: 0 }
[upload] ❌ DROPBOX_ACCESS_TOKEN not set in environment variables
```

### ❌ You Will NOT See:

- The actual token value (for security, it's never logged)
- The token in browser console
- The token in terminal output (only confirmation it exists)

## Troubleshooting

### Token not loading?

1. **Check file location**: `.env.local` must be in project root (same folder as `package.json`)
2. **Check spelling**: Must be exactly `DROPBOX_ACCESS_TOKEN` (case-sensitive)
3. **Check format**: No quotes, no spaces around `=`
4. **Restart server**: Environment variables only load on server start
5. **Check for typos**: Make sure the entire token is on one line

### Still not working?

Check terminal logs when you try to upload. The logs will tell you exactly what's wrong:
- Token missing → Add to `.env.local` and restart
- Token invalid → Get a new token from Dropbox
- Import error → Run `npm install dropbox`






