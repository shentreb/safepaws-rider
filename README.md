# SafePaws Rider V2.9

Pet Transport Rider App - Firebase + Leaflet

## Features Added
1.  Car Animation Fix: Car only fades, login no flicker
2.  Scrollable Dashboard: Map only shows when Online = true
3. 1-Time Status Card: Approved/Rejected shows 1 time only using localStorage
4.  Earnings Today vs Total
5.  Leaflet Navigate Button: 100% Free, No Google API Key
6.  Pet Details in Booking Card: Name, Breed, Size

## Setup
1.  Create Firebase Project > Enable Email/Password Auth
2.  Create Firestore: collections = `riders`, `bookings`
3.  Replace `firebaseConfig` in index.html with your keys
4.  Host in Firebase Hosting, Netlify, or Vercel. 100% Static.

## Firestore Schema
riders/{uid} = { name, phone, plate, email, status: pending/approved/rejected, online: bool, earnings: number, earningsToday: number, lat, lng }
bookings/{id} = { assignedRider: uid, status: assigned/accepted/picking/completed, customerName, customerPhone, petName, petBreed, petSize, pickup, dropoff, pickupLat, pickupLng, dropoffLat, dropoffLng, fee }

## 0 Pesos Map
Using Leaflet.js + OpenStreetMap. No API key needed.
