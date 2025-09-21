# CAP Mini Bookshop (Node.js)

A minimal SAP CAP project demonstrating CRUD, OData queries, a custom action (`restock`), and a function (`searchBooks`). Uses SQLite for local dev.

## Prerequisites
- Node.js LTS (>= 18 recommended)
- npm
- `@sap/cds-dk` installed globally: `npm i -g @sap/cds-dk`

## Install & Run
```bash
npm install
npm run deploy          # creates db/my.db from CDS and loads CSV
npm run watch           # starts the dev server with hot reload
```

If you have `cds` globally, you can also do:
```bash
cds watch
```

## Endpoints (OData v4)
- GET `/catalog/Books`
- GET `/catalog/Books(ID=<uuid>)`
- POST `/catalog/Books`
- PATCH `/catalog/Books(ID=<uuid>)`
- DELETE `/catalog/Books(ID=<uuid>)`
- GET `/catalog/$metadata`

### Query Options (examples)
- `/catalog/Books?$select=title,author&$orderby=title`
- `/catalog/Books?$filter=stock gt 0 and author eq 'Eric Evans'`
- `/catalog/Books?$top=2&$skip=2`
- `/catalog/Books?$search=code` (if `$search` is enabled in your env/version)
- Function: `/catalog/searchBooks(q='code')`
- Action (POST): `/catalog/restock` with body `{ "ID": "<uuid>", "amount": 3 }`

## Sample cURL
```bash
# List
curl "http://localhost:4004/catalog/Books"

# Create
curl -X POST "http://localhost:4004/catalog/Books"   -H "Content-Type: application/json"   -d '{ "title": "Patterns of Enterprise Application Architecture", "author": "Martin Fowler", "stock": 4, "price": 55.00 }'

# Update (PATCH)
curl -X PATCH "http://localhost:4004/catalog/Books(ID=67eea854-5c0b-4b73-a8b8-bd1be3d4a001)"   -H "Content-Type: application/json"   -d '{ "stock": 8 }'

# Delete
curl -X DELETE "http://localhost:4004/catalog/Books(ID=d8c3db4c-6a8e-4f9c-a0a2-710f9b0fb002)"
```

## Notes
- The data model uses `managed` aspect, so `createdAt/createdBy/modifiedAt/modifiedBy` are auto-managed by CAP.
- SQLite configuration is in `.cdsrc.json`. Database file is `db/my.db`.
- CSV seed data is auto-loaded on deploy from `db/data/my.bookshop-Books.csv`.
