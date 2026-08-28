# Firestore Composite Indexes for Multi-Tenant SaaS (Tripbone)

To scale Tripbone to 10,000+ tenants, every Firestore query on a tenant-specific collection is automatically filtered by `tenantId`. To support custom sorting, range filters, and paginated queries under this setup, Firestore requires **Composite Indexes**.

Below is the definitive list of composite indexes required for production performance.

---

## 1. Tours Collection (`tours`)

### Index A: Sorting tours by creation date within a tenant
* Used in: Admin Dashboard, Home tour lists, and Tours archive.
* **Fields:**
  1. `tenantId` (Ascending)
  2. `createdAt` (Descending)
* **Query example:**
  ```typescript
  query(collection(db, 'tours'), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'))
  ```

### Index B: Filtering by status and sorting by price within a tenant
* Used in: Customer-facing Tours page with price filter/sort.
* **Fields:**
  1. `tenantId` (Ascending)
  2. `status` (Ascending)
  3. `regularPrice` (Ascending)
* **Query example:**
  ```typescript
  query(collection(db, 'tours'), where('tenantId', '==', tenantId), where('status', '==', 'active'), orderBy('regularPrice', 'asc'))
  ```

---

## 2. Bookings Collection (`bookings`)

### Index A: Main Admin booking dashboard query
* Used in: Booking Manager table and general analytics.
* **Fields:**
  1. `tenantId` (Ascending)
  2. `createdAt` (Descending)
* **Query example:**
  ```typescript
  query(collection(db, 'bookings'), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'))
  ```

### Index B: Filtering bookings by status and sorting by creation date
* Used in: Booking Manager filter tabs (Confirmed, Pending, Cancelled).
* **Fields:**
  1. `tenantId` (Ascending)
  2. `status` (Ascending)
  3. `createdAt` (Descending)
* **Query example:**
  ```typescript
  query(collection(db, 'bookings'), where('tenantId', '==', tenantId), where('status', '==', 'confirmed'), orderBy('createdAt', 'desc'))
  ```

### Index C: Customer personal booking history within a tenant
* Used in: Customer portal bookings list.
* **Fields:**
  1. `tenantId` (Ascending)
  2. `userId` (Ascending)
  3. `createdAt` (Descending)
* **Query example:**
  ```typescript
  query(collection(db, 'bookings'), where('tenantId', '==', tenantId), where('userId', '==', userId), orderBy('createdAt', 'desc'))
  ```

---

## 3. Blog Posts Collection (`posts`)

### Index A: Fetching published blog posts sorted by date
* Used in: Website blog section.
* **Fields:**
  1. `tenantId` (Ascending)
  2. `status` (Ascending)
  3. `createdAt` (Descending)
* **Query example:**
  ```typescript
  query(collection(db, 'posts'), where('tenantId', '==', tenantId), where('status', '==', 'published'), orderBy('createdAt', 'desc'))
  ```

---

## 4. Support Tickets Collection (`supportTickets`)

### Index A: Admin support tickets view
* Used in: Admin Dashboard tickets pane.
* **Fields:**
  1. `tenantId` (Ascending)
  2. `status` (Ascending)
  3. `updatedAt` (Descending)
* **Query example:**
  ```typescript
  query(collection(db, 'supportTickets'), where('tenantId', '==', tenantId), where('status', '==', 'open'), orderBy('updatedAt', 'desc'))
  ```

---

## 5. Analytics & Logs (`analytics_pageviews`)

### Index A: Querying pageviews over time range within a tenant
* Used in: Tenant traffic dashboard charts.
* **Fields:**
  1. `tenantId` (Ascending)
  2. `timestamp` (Descending)
* **Query example:**
  ```typescript
  query(collection(db, 'analytics_pageviews'), where('tenantId', '==', tenantId), orderBy('timestamp', 'desc'))
  ```

---

## Deployment Instructions

These indexes can be created:
1. **Automatically via Firebase SDK warnings:** Clicking the automatically generated URL in the browser's developer console when a query fails with an index error.
2. **Declaring in `firestore.indexes.json`:** Included in the Firebase deployment configuration to provision all indexes instantly.
